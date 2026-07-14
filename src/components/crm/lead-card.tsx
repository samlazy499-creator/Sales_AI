"use client";

import Link from "next/link";
import { ScoreBadge } from "@/components/crm/badges";
import { MessageSquare } from "lucide-react";
import type { Lead, User } from "@prisma/client";

type LeadWithExtras = Lead & {
  assignedTo: Pick<User, "id" | "name" | "image"> | null;
  _count: { notes: number };
};

export function LeadCard({ lead }: { lead: LeadWithExtras }) {
  return (
    <Link
      href={`/leads/${lead.id}`}
      className="block glass-panel rounded-lg p-3.5 hover:border-signal-400/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-mist-50 truncate">{lead.name}</p>
        <ScoreBadge score={lead.score} />
      </div>
      <p className="text-xs text-mist-400 mb-2">{lead.phone}</p>
      {lead.requirement && (
        <p className="text-xs text-mist-200 line-clamp-2 mb-2">{lead.requirement}</p>
      )}
      <div className="flex items-center justify-between text-xs text-mist-400 pt-2 border-t border-white/[0.05]">
        <span className="truncate">{lead.assignedTo?.name ?? "Unassigned"}</span>
        {lead._count.notes > 0 && (
          <span className="flex items-center gap-1 shrink-0">
            <MessageSquare size={11} />
            {lead._count.notes}
          </span>
        )}
      </div>
    </Link>
  );
}
