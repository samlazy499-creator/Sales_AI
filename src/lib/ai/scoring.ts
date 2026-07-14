import type { LeadScore } from "@prisma/client";

/**
 * Deterministic keyword-based scoring, run on the timeline text the AI
 * itself extracts during conversation (not on raw customer text, which
 * is too noisy). This is intentionally simple and auditable rather than
 * another LLM call — a support rep can look at a lead's `timeline` field
 * and understand exactly why it scored HOT/WARM/COLD.
 */
export function scoreFromTimeline(timeline: string | null | undefined): LeadScore {
  if (!timeline) return "COLD";
  const t = timeline.toLowerCase();

  const hotSignals = ["this week", "today", "tomorrow", "asap", "immediately", "urgent", "within a week", "few days"];
  const warmSignals = ["month", "3 months", "6 months", "few months", "this quarter", "soon"];

  if (hotSignals.some((s) => t.includes(s))) return "HOT";
  if (warmSignals.some((s) => t.includes(s))) return "WARM";

  // "30 days" reads as HOT per the product's own definition; check
  // numerically since "30 days" won't match the string signals above.
  const dayMatch = t.match(/(\d+)\s*day/);
  if (dayMatch && Number(dayMatch[1]) <= 30) return "HOT";

  const monthMatch = t.match(/(\d+)\s*month/);
  if (monthMatch) {
    const months = Number(monthMatch[1]);
    if (months <= 1) return "HOT";
    if (months <= 6) return "WARM";
  }

  return "COLD";
}
