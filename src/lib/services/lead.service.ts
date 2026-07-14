import { prisma } from "@/lib/db";
import * as leadRepo from "@/lib/repositories/lead.repository";
import { fireTrigger } from "@/lib/services/automation.service";
import type { CreateLeadInput, UpdateLeadInput, LeadFilterInput } from "@/lib/validation/lead";

export async function listLeads(organizationId: string, filters: LeadFilterInput) {
  return leadRepo.findLeads(organizationId, filters);
}

export async function getLead(organizationId: string, leadId: string) {
  return leadRepo.findLeadById(organizationId, leadId);
}

/**
 * Creates a lead and links it to a Customer record, creating the customer
 * if this phone number hasn't been seen before. Every business tool
 * downstream (WhatsApp, appointments) keys off Customer, so a lead must
 * always resolve to one — this is the one place that invariant is
 * enforced rather than trusting every caller to do it themselves.
 */
export async function createLead(organizationId: string, input: CreateLeadInput) {
  const customer = await prisma.customer.upsert({
    where: { organizationId_phone: { organizationId, phone: input.phone } },
    update: { name: input.name, email: input.email || undefined },
    create: {
      organizationId,
      phone: input.phone,
      name: input.name,
      email: input.email || undefined,
    },
  });

  const lead = await leadRepo.createLead(organizationId, {
    ...input,
    email: input.email || null,
    customerId: customer.id,
  });

  await prisma.analyticsEvent.create({
    data: { organizationId, type: "LEAD_CREATED", payload: { leadId: lead.id, source: lead.source } },
  });

  await fireTrigger(organizationId, "LEAD_CREATED", lead.id).catch((err) =>
    console.error("Automation trigger failed for LEAD_CREATED:", err)
  );

  return lead;
}

export async function updateLead(organizationId: string, leadId: string, input: UpdateLeadInput) {
  const updated = await leadRepo.updateLead(organizationId, leadId, {
    ...input,
    email: input.email === "" ? null : input.email,
  });

  if (updated && input.status === "WON") {
    await prisma.analyticsEvent.create({
      data: { organizationId, type: "LEAD_WON", payload: { leadId } },
    });
  }

  if (updated && input.status) {
    await fireTrigger(organizationId, "LEAD_STATUS_CHANGED", leadId).catch((err) =>
      console.error("Automation trigger failed for LEAD_STATUS_CHANGED:", err)
    );
  }

  return updated;
}

export async function deleteLead(organizationId: string, leadId: string) {
  return leadRepo.deleteLead(organizationId, leadId);
}

export async function addNoteToLead(
  organizationId: string,
  leadId: string,
  authorId: string,
  content: string
) {
  // Confirm the lead actually belongs to this org before writing a note
  // against it — addNote() itself has no org filter since Note doesn't
  // carry organizationId directly.
  const lead = await leadRepo.findLeadById(organizationId, leadId);
  if (!lead) return null;
  return leadRepo.addNote(leadId, authorId, content);
}
