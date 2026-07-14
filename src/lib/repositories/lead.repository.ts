import { prisma } from "@/lib/db";
import type { LeadFilterInput } from "@/lib/validation/lead";
import type { Prisma } from "@prisma/client";

/**
 * Every query here takes organizationId as the first argument and bakes
 * it into the `where` clause — services should never be able to
 * construct a lead query that skips tenant scoping.
 */

export function findLeads(organizationId: string, filters: LeadFilterInput) {
  const where: Prisma.LeadWhereInput = { organizationId };

  if (filters.status) where.status = filters.status;
  if (filters.score) where.score = filters.score;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { phone: { contains: filters.search } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.lead.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true, image: true } },
      _count: { select: { notes: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export function findLeadById(organizationId: string, leadId: string) {
  return prisma.lead.findFirst({
    where: { id: leadId, organizationId },
    include: {
      assignedTo: { select: { id: true, name: true, image: true } },
      customer: true,
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
      appointments: { orderBy: { scheduledAt: "asc" } },
    },
  });
}

export function createLead(organizationId: string, data: Prisma.LeadUncheckedCreateInput) {
  return prisma.lead.create({
    data: { ...data, organizationId },
  });
}

export async function updateLead(
  organizationId: string,
  leadId: string,
  data: Prisma.LeadUpdateInput
) {
  // updateMany + refetch rather than update() so a mismatched org can't
  // accidentally touch another tenant's row — update() would throw a
  // generic "not found" either way, but this keeps the intent explicit.
  const result = await prisma.lead.updateMany({
    where: { id: leadId, organizationId },
    data,
  });
  if (result.count === 0) return null;
  return prisma.lead.findUnique({ where: { id: leadId } });
}

export async function deleteLead(organizationId: string, leadId: string) {
  const result = await prisma.lead.deleteMany({ where: { id: leadId, organizationId } });
  return result.count > 0;
}

export function addNote(leadId: string, authorId: string, content: string) {
  return prisma.note.create({ data: { leadId, authorId, content } });
}

export function countByStatus(organizationId: string) {
  return prisma.lead.groupBy({
    by: ["status"],
    where: { organizationId },
    _count: true,
  });
}
