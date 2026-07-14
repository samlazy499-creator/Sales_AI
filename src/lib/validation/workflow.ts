import { z } from "zod";

/**
 * Every step type the automation engine can execute. Kept as a closed
 * union rather than a free-form string so the builder UI and the
 * execution engine can never drift out of sync on what's supported.
 */
export const stepSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ASSIGN_ROUND_ROBIN") }),
  z.object({ type: z.literal("UPDATE_STATUS"), status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "MEETING_SCHEDULED", "WON", "LOST"]) }),
  z.object({ type: z.literal("SEND_MESSAGE"), template: z.string().min(1).max(1000) }),
  z.object({ type: z.literal("WAIT"), hours: z.number().min(0.1).max(720) }),
]);

export type WorkflowStep = z.infer<typeof stepSchema>;

export const TRIGGERS = ["LEAD_CREATED", "LEAD_STATUS_CHANGED", "LEAD_SCORE_HOT"] as const;
export type WorkflowTrigger = (typeof TRIGGERS)[number];

export const createWorkflowSchema = z.object({
  organizationId: z.string().cuid(),
  name: z.string().min(2).max(100),
  trigger: z.enum(TRIGGERS),
  definition: z.array(stepSchema).min(1).max(10),
  isActive: z.boolean().default(true),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;

export const updateWorkflowSchema = createWorkflowSchema.partial().extend({
  organizationId: z.string().cuid(),
});

/** Fills `{{field}}` placeholders in a follow-up template from lead data. */
export function renderTemplate(template: string, fields: Record<string, string | null | undefined>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => fields[key] ?? "");
}
