import { prisma } from "@/lib/db";
import * as conversationService from "@/lib/services/conversation.service";
import * as aiAgentService from "@/lib/services/ai-agent.service";
import { sendWhatsAppMessage } from "@/lib/integrations/whatsapp.client";
import type { InboundWhatsAppMessage } from "@/lib/integrations/whatsapp.client";

/**
 * Resolves which organization owns a given WhatsApp phone number ID —
 * every inbound webhook is keyed by the business's number, not the
 * customer's, so this is how a shared webhook endpoint routes to the
 * right tenant.
 */
export async function resolveOrganizationForPhoneNumberId(phoneNumberId: string) {
  const channel = await prisma.channel.findFirst({
    where: { whatsappPhoneNumberId: phoneNumberId },
  });
  return channel?.organizationId ?? null;
}

/**
 * Full inbound-message pipeline: dedupe, persist, run the AI agent
 * (unless a human has taken the conversation over), send the reply.
 * Deliberately synchronous rather than queued for now — Inngest wiring
 * for this is the one piece explicitly deferred (see README), since it
 * needs its own project-level setup (event key, signing key) the person
 * hasn't configured yet.
 */
export async function processInboundMessage(
  organizationId: string,
  inbound: InboundWhatsAppMessage
) {
  // Dedupe on WhatsApp's message ID — Meta retries webhook delivery on
  // any non-2xx response, so the same message can arrive more than once.
  const alreadyProcessed = await prisma.message.findFirst({
    where: { metadata: { path: ["whatsappMessageId"], equals: inbound.messageId } },
  });
  if (alreadyProcessed) return;

  const { conversation, customer } = await conversationService.findOrCreateConversation(
    organizationId,
    inbound.from,
    inbound.profileName
  );

  await conversationService.appendMessage(conversation.id, "CUSTOMER", inbound.text, {
    whatsappMessageId: inbound.messageId,
  });

  await prisma.analyticsEvent.create({
    data: { organizationId, type: "CONVERSATION_MESSAGE_RECEIVED", payload: { conversationId: conversation.id } },
  });

  // A human already took over this conversation — don't let the AI
  // jump back in over their reply.
  if (conversation.mode === "HUMAN") return;

  const { reply, handoff } = await aiAgentService.generateReply(
    organizationId,
    conversation.id,
    customer.id,
    inbound.text
  );

  await conversationService.appendMessage(conversation.id, "AI", reply);

  try {
    await sendWhatsAppMessage(inbound.from, reply);
  } catch (err) {
    // Log and continue — the reply is saved in the conversation either
    // way, so a teammate can see and manually resend if WhatsApp delivery
    // failed (e.g. token expired).
    console.error("WhatsApp send failed:", err);
  }

  if (handoff) {
    await prisma.analyticsEvent.create({
      data: { organizationId, type: "CONVERSATION_HANDED_OFF", payload: { conversationId: conversation.id } },
    });
  }
}

/** Used by the inbox UI when a teammate sends a manual reply. */
export async function sendHumanReply(
  organizationId: string,
  conversationId: string,
  employeeId: string,
  text: string
) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, organizationId },
    include: { customer: true },
  });
  if (!conversation) throw new Error("Conversation not found");

  await conversationService.setConversationMode(conversationId, "HUMAN");
  await conversationService.appendMessage(conversationId, "EMPLOYEE", text, { sentBy: employeeId });
  await sendWhatsAppMessage(conversation.customer.phone, text);
}
