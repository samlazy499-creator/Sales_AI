"use client";

import { useState, useTransition } from "react";
import { LeadCard } from "@/components/crm/lead-card";
import { statusLabel } from "@/components/crm/badges";
import type { Lead, LeadStatus, User } from "@prisma/client";

type LeadWithExtras = Lead & {
  assignedTo: Pick<User, "id" | "name" | "image"> | null;
  _count: { notes: number };
};

const COLUMNS: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "MEETING_SCHEDULED",
  "WON",
  "LOST",
];

export function PipelineBoard({
  initialLeads,
  organizationId,
}: {
  initialLeads: LeadWithExtras[];
  organizationId: string;
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [dragOverCol, setDragOverCol] = useState<LeadStatus | null>(null);
  const [, startTransition] = useTransition();

  function handleDrop(status: LeadStatus, leadId: string) {
    setDragOverCol(null);
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status } : l))
    );

    startTransition(async () => {
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, status }),
      });
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((status) => {
        const columnLeads = leads.filter((l) => l.status === status);
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverCol(status);
            }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => {
              const leadId = e.dataTransfer.getData("text/lead-id");
              if (leadId) handleDrop(status, leadId);
            }}
            className={
              "w-72 shrink-0 rounded-xl p-3 transition-colors " +
              (dragOverCol === status ? "bg-signal-600/[0.08]" : "bg-ink-900/30")
            }
          >
            <div className="flex items-center justify-between px-1 mb-3">
              <h3 className="text-xs font-mono uppercase tracking-wide text-mist-400">
                {statusLabel(status)}
              </h3>
              <span className="text-xs text-mist-400">{columnLeads.length}</span>
            </div>
            <div className="flex flex-col gap-2 min-h-[60px]">
              {columnLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/lead-id", lead.id)}
                >
                  <LeadCard lead={lead} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
