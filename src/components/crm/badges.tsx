import { cn } from "@/lib/utils";
import type { LeadScore, LeadStatus } from "@prisma/client";

const STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  MEETING_SCHEDULED: "Meeting Scheduled",
  WON: "Won",
  LOST: "Lost",
};

const SCORE_STYLE: Record<LeadScore, string> = {
  HOT: "bg-red-500/15 text-red-400 border-red-500/20",
  WARM: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  COLD: "bg-signal-500/15 text-signal-400 border-signal-500/20",
};

export function ScoreBadge({ score }: { score: LeadScore }) {
  return (
    <span
      className={cn(
        "text-[10px] font-mono uppercase tracking-wide border rounded-full px-2 py-0.5",
        SCORE_STYLE[score]
      )}
    >
      {score}
    </span>
  );
}

export function statusLabel(status: LeadStatus) {
  return STATUS_LABEL[status];
}
