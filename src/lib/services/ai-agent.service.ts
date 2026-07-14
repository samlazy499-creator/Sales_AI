import { prisma } from "@/lib/db";
import { getAIProvider } from "@/lib/ai/provider";
import { scoreFromTimeline } from "@/lib/ai/scoring";
import { retrieveContext } from "@/lib/services/rag.service";
import * as conversationService from "@/lib/services/conversation.service";
import { fireTrigger } from "@/lib/services/automation.service";
import type { ChatMessage } from "@/lib/ai/provider";

const OUTPUT_FORMAT_INSTRUCTIONS = `
Respond with ONLY a JSON object, no other text, no markdown fences. Shape:
{
  "reply": "the message to send the customer, 2-4 sentences max",
  "extracted": {
    "name": "string or null — only if newly mentioned",
    "requirement": "string or null",
    "budget": "string or null",
    "timeline": "string or null",
    "location": "string or null"
  },
  "handoff": false
}

Set "handoff" to true only if the customer explicitly asks for a human, seems frustrated, or asks something the knowledge base context can't answer at all. When handoff is true, "reply" should briefly tell the customer a teammate is joining.
`.trim();

interface AgentResult {
  reply: string;
  handoff: boolean;
  extracted: {
    name?: string | null;
    requirement?: string | null;
    budget?: string | null;
    timeline?: string | null;
    location?: string | null;
  };
}

function safeParseAgentJSON(raw: string): AgentResult | null {
  try {
    // Models occasionally wrap JSON in ```json fences despite instructions —
    // strip those defensively rather than failing the whole turn.
    const cleaned = raw.replace(/^```json\s*|```\s*$/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.reply !== "string") return null;
    return {
      reply: parsed.reply,
      handoff: Boolean(parsed.handoff),
      extracted: parsed.extracted ?? {},
    };
  } catch {
    return null;
  }
}

/**
 * Runs one turn of the AI sales conversation: builds the prompt from the
 * agent's persona + knowledge base context + conversation history, calls
 * the model, persists the extracted lead fields, updates lead scoring,
 * and returns the reply text ready to send back over WhatsApp (or
 * whatever channel called this).
 */
export async function generateReply(
  organizationId: string,
  conversationId: string,
  customerId: string,
  incomingMessage: string
): Promise<{ reply: string; handoff: boolean }> {
  const [agent, history] = await Promise.all([
    prisma.aIAgent.findUnique({ where: { organizationId } }),
    conversationService.getConversationHistory(conversationId),
  ]);

  if (!agent || !agent.isActive) {
    return {
      reply: "Thanks for your message — a member of our team will get back to you shortly.",
      handoff: true,
    };
  }

  const context = await retrieveContext(organizationId, incomingMessage);

  const systemPrompt = [
    agent.personaPrompt,
    context
      ? `\nRelevant business knowledge for this query:\n${context}`
      : "\nNo specific knowledge base context was found for this query — answer generally and honestly if you don't know specifics.",
    `\n${OUTPUT_FORMAT_INSTRUCTIONS}`,
  ].join("\n");

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({
      role: (m.sender === "CUSTOMER" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: incomingMessage },
  ];

  const provider = getAIProvider();
  const result = await provider.generateResponse({
    messages,
    model: agent.model,
    temperature: agent.temperature,
  });

  const parsed = safeParseAgentJSON(result.content);

  if (!parsed) {
    // Model didn't follow the JSON contract — fail safe rather than
    // sending garbage or a raw JSON blob to a real customer.
    return {
      reply: "Thanks for your message! Let me get back to you on that shortly.",
      handoff: true,
    };
  }

  await applyExtractedFields(organizationId, customerId, parsed.extracted);

  if (parsed.handoff) {
    await conversationService.setConversationMode(conversationId, "HUMAN");
  }

  return { reply: parsed.reply, handoff: parsed.handoff };
}

/**
 * Folds newly extracted fields into the customer's most recent open lead,
 * creating one if none exists yet, and re-scores it. Only non-null
 * extracted fields overwrite existing ones — a later message saying
 * "actually my budget is X" should win, but the agent restating context
 * shouldn't blank out a value already captured.
 */
async function applyExtractedFields(
  organizationId: string,
  customerId: string,
  extracted: AgentResult["extracted"]
) {
  const hasAnyField = Object.values(extracted).some((v) => v);
  if (!hasAnyField) return;

  let lead = await prisma.lead.findFirst({
    where: { organizationId, customerId, status: { notIn: ["WON", "LOST"] } },
    orderBy: { createdAt: "desc" },
  });

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return;

  if (!lead) {
    lead = await prisma.lead.create({
      data: {
        organizationId,
        customerId,
        name: extracted.name || customer.name || "Unknown",
        phone: customer.phone,
        source: "WHATSAPP",
        requirement: extracted.requirement ?? undefined,
        budget: extracted.budget ?? undefined,
        timeline: extracted.timeline ?? undefined,
        location: extracted.location ?? undefined,
      },
    });
    await prisma.analyticsEvent.create({
      data: { organizationId, type: "LEAD_CREATED", payload: { leadId: lead.id, source: "WHATSAPP" } },
    });
    await fireTrigger(organizationId, "LEAD_CREATED", lead.id).catch((err) =>
      console.error("Automation trigger failed for LEAD_CREATED:", err)
    );
  } else {
    const nextTimeline = extracted.timeline ?? lead.timeline;
    const nextScore = scoreFromTimeline(nextTimeline);
    const wasNotHot = lead.score !== "HOT";

    lead = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        name: extracted.name ?? lead.name,
        requirement: extracted.requirement ?? lead.requirement,
        budget: extracted.budget ?? lead.budget,
        timeline: nextTimeline,
        location: extracted.location ?? lead.location,
        score: nextScore,
        status: lead.status === "NEW" ? "CONTACTED" : lead.status,
      },
    });

    if (wasNotHot && nextScore === "HOT") {
      await fireTrigger(organizationId, "LEAD_SCORE_HOT", lead.id).catch((err) =>
        console.error("Automation trigger failed for LEAD_SCORE_HOT:", err)
      );
    }
  }
}
