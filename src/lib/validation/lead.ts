import { z } from "zod";
import { LeadSource, LeadStatus, LeadScore } from "@prisma/client";

export const createLeadSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email: z.string().email().optional().or(z.literal("")),
  source: z.nativeEnum(LeadSource).default("MANUAL"),
  budget: z.string().max(60).optional(),
  location: z.string().max(120).optional(),
  requirement: z.string().max(500).optional(),
  timeline: z.string().max(60).optional(),
  assignedToId: z.string().cuid().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  email: z.string().email().optional().or(z.literal("")),
  budget: z.string().max(60).optional(),
  location: z.string().max(120).optional(),
  requirement: z.string().max(500).optional(),
  timeline: z.string().max(60).optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  score: z.nativeEnum(LeadScore).optional(),
  assignedToId: z.string().cuid().nullable().optional(),
});

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export const createNoteSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const leadFilterSchema = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  score: z.nativeEnum(LeadScore).optional(),
  assignedToId: z.string().cuid().optional(),
  search: z.string().max(120).optional(),
});

export type LeadFilterInput = z.infer<typeof leadFilterSchema>;
