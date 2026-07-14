import { prisma } from "@/lib/db";
import type { SenderType } from "@prisma/client";

export async function findOrCreateConversation(organizationId: string, customerPhone: string, customerName?: string) {
  const customer = await prisma.customer.upsert({
    where: { organizationId_phone: { organizationId, phone: customerPhone } },
    update: customerName ? { name: customerName } : {},
    create: { organizationId, phone: customerPhone, name: customerName },
  });

  let conversation = await prisma.conversation.findFirst({
    where: { organizationId, customerId: customer.id },
    orderBy: { updatedAt: "desc" },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { organizationId, customerId: customer.id, mode: "AI" },
    });
  }

  return { conversation, customer };
}

export async function appendMessage(
  conversationId: string,
  sender: SenderType,
  content: string,
  metadata?: Record<string, unknown>
) {
  const message = await prisma.message.create({
    data: { conversationId, sender, content, metadata },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
  return message;
}

export async function getConversationHistory(conversationId: string, limit = 20) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

export async function setConversationMode(conversationId: string, mode: "AI" | "HUMAN") {
  return prisma.conversation.update({ where: { id: conversationId }, data: { mode } });
}

export async function listConversations(organizationId: string) {
  return prisma.conversation.findMany({
    where: { organizationId },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getConversationById(organizationId: string, conversationId: string) {
  return prisma.conversation.findFirst({
    where: { id: conversationId, organizationId },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}
