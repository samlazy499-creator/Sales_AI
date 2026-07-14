import { prisma } from "@/lib/db";
import { sendWhatsAppMessage } from "@/lib/integrations/whatsapp.client";
import { renderTemplate, type WorkflowStep, type WorkflowTrigger } from "@/lib/validation/workflow";
import type { Lead } from "@prisma/client";

/**
 * Fires whenever a trigger event happens (lead created, status changed,
 * score hits HOT). Finds all active workflows listening for that trigger
 * in this org and starts executing each from step 0. Called from
 * lead.service.ts and ai-agent.service.ts at the points those events
 * actually occur — this function itself doesn't know or care who calls it.
 */
export async function fireTrigger(organizationId: string, trigger: WorkflowTrigger, leadId: string) {
  const workflows = await prisma.workflow.findMany({
    where: { organizationId, trigger, isActive: true },
  });

  for (const workflow of workflows) {
    const steps = workflow.definition as unknown as WorkflowStep[];
    await runFromStep(organizationId, workflow.id, leadId, steps, 0);
  }
}

/**
 * Executes steps in order starting at `startIndex`. Stops and schedules
 * a WorkflowRun for later when it hits a WAIT step — this is what lets a
 * "follow up in 24 hours" step survive past the current request without
 * a long-running process or a real job queue.
 */
async function runFromStep(
  organizationId: string,
  workflowId: string,
  leadId: string,
  steps: WorkflowStep[],
  startIndex: number
) {
  for (let i = startIndex; i < steps.length; i++) {
    const step = steps[i];

    if (step.type === "WAIT") {
      const runAt = new Date(Date.now() + step.hours * 60 * 60 * 1000);
      await prisma.workflowRun.create({
        data: { organizationId, workflowId, leadId, nextStepIndex: i + 1, runAt, status: "PENDING" },
      });
      return; // execution resumes later via processDueRuns()
    }

    const ok = await executeStep(organizationId, leadId, step);
    if (!ok) return; // lead vanished or step failed — don't keep going
  }
}

async function executeStep(organizationId: string, leadId: string, step: WorkflowStep): Promise<boolean> {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, organizationId } });
  if (!lead) return false;

  switch (step.type) {
    case "ASSIGN_ROUND_ROBIN":
      await assignLeastLoadedEmployee(organizationId, lead);
      return true;

    case "UPDATE_STATUS":
      await prisma.lead.update({ where: { id: lead.id }, data: { status: step.status } });
      return true;

    case "SEND_MESSAGE": {
      const text = renderTemplate(step.template, {
        name: lead.name,
        requirement: lead.requirement,
        location: lead.location,
      });
      try {
        await sendWhatsAppMessage(lead.phone, text);
        const { conversation } = await import("@/lib/services/conversation.service").then((m) =>
          m.findOrCreateConversation(organizationId, lead.phone, lead.name)
        );
        await (
          await import("@/lib/services/conversation.service")
        ).appendMessage(conversation.id, "AI", text, { source: "automation" });
      } catch (err) {
        console.error("Automation SEND_MESSAGE failed:", err);
      }
      return true;
    }

    default:
      return true;
  }
}

/**
 * Assigns to whichever active SALES_EMPLOYEE/SALES_MANAGER in the org
 * currently has the fewest open (non-WON/LOST) leads. This achieves the
 * same fairness goal as strict round robin without needing to persist a
 * rotating pointer, and self-corrects if someone's been on leave.
 */
async function assignLeastLoadedEmployee(organizationId: string, lead: Lead) {
  const members = await prisma.membership.findMany({
    where: { organizationId, role: { in: ["SALES_EMPLOYEE", "SALES_MANAGER"] } },
    select: { userId: true },
  });
  if (members.length === 0) return;

  const loadCounts = await Promise.all(
    members.map(async (m) => ({
      userId: m.userId,
      count: await prisma.lead.count({
        where: { organizationId, assignedToId: m.userId, status: { notIn: ["WON", "LOST"] } },
      }),
    }))
  );

  loadCounts.sort((a, b) => a.count - b.count);
  const chosen = loadCounts[0];

  await prisma.lead.update({ where: { id: lead.id }, data: { assignedToId: chosen.userId } });
}

/**
 * Called by the cron endpoint. Picks up every WorkflowRun whose runAt
 * has passed, resumes that workflow from nextStepIndex, and marks the
 * run COMPLETED or FAILED. Safe to call frequently and concurrently —
 * updateMany with a status guard means two overlapping cron invocations
 * can't both pick up and double-execute the same run.
 */
export async function processDueRuns(limit = 50) {
  const dueRuns = await prisma.workflowRun.findMany({
    where: { status: "PENDING", runAt: { lte: new Date() } },
    take: limit,
    include: { workflow: true },
  });

  let processed = 0;

  for (const run of dueRuns) {
    const claimed = await prisma.workflowRun.updateMany({
      where: { id: run.id, status: "PENDING" },
      data: { status: "COMPLETED" }, // optimistic — reset to FAILED below if it throws
    });
    if (claimed.count === 0) continue; // another invocation already claimed this run

    try {
      const steps = run.workflow.definition as unknown as WorkflowStep[];
      await runFromStep(run.organizationId, run.workflowId, run.leadId, steps, run.nextStepIndex);
      processed++;
    } catch (err) {
      console.error(`WorkflowRun ${run.id} failed:`, err);
      await prisma.workflowRun.update({ where: { id: run.id }, data: { status: "FAILED" } });
    }
  }

  return { processed, checked: dueRuns.length };
}
