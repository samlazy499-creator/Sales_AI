"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, X, UserCheck, Clock, MessageCircle, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TRIGGERS, type WorkflowStep, type WorkflowTrigger } from "@/lib/validation/workflow";

type Workflow = {
  id: string;
  name: string;
  trigger: string;
  definition: WorkflowStep[];
  isActive: boolean;
};

const TRIGGER_LABEL: Record<WorkflowTrigger, string> = {
  LEAD_CREATED: "New lead created",
  LEAD_STATUS_CHANGED: "Lead status changes",
  LEAD_SCORE_HOT: "Lead scored HOT",
};

const STEP_META = {
  ASSIGN_ROUND_ROBIN: { label: "Assign to least-loaded rep", icon: UserCheck },
  UPDATE_STATUS: { label: "Update lead status", icon: Tag },
  SEND_MESSAGE: { label: "Send WhatsApp message", icon: MessageCircle },
  WAIT: { label: "Wait", icon: Clock },
} as const;

export function WorkflowBuilder({ organizationId }: { organizationId: string }) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [editing, setEditing] = useState<Workflow | "new" | null>(null);

  const fetchWorkflows = useCallback(async () => {
    const res = await fetch(`/api/automation/workflows?organizationId=${organizationId}`);
    if (res.ok) setWorkflows((await res.json()).workflows);
  }, [organizationId]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  async function toggleActive(wf: Workflow) {
    setWorkflows((prev) => prev.map((w) => (w.id === wf.id ? { ...w, isActive: !w.isActive } : w)));
    await fetch(`/api/automation/workflows/${wf.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, isActive: !wf.isActive }),
    });
  }

  async function deleteWorkflow(id: string) {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
    await fetch(`/api/automation/workflows/${id}?organizationId=${organizationId}`, { method: "DELETE" });
  }

  if (editing) {
    return (
      <WorkflowEditor
        organizationId={organizationId}
        workflow={editing === "new" ? null : editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          fetchWorkflows();
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus size={15} />
          New workflow
        </Button>
      </div>

      {workflows.length === 0 && (
        <div className="glass-panel rounded-xl p-8 text-center">
          <p className="text-sm text-mist-200 mb-1">No workflows yet</p>
          <p className="text-xs text-mist-400">
            Automate what happens after a lead comes in — assignment, follow-ups, status updates.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {workflows.map((wf) => (
          <div key={wf.id} className="glass-panel rounded-xl p-4 flex items-center justify-between">
            <div className="min-w-0 cursor-pointer" onClick={() => setEditing(wf)}>
              <p className="text-sm text-mist-50 font-medium">{wf.name}</p>
              <p className="text-xs text-mist-400 mt-0.5">
                {TRIGGER_LABEL[wf.trigger as WorkflowTrigger] ?? wf.trigger} → {wf.definition.length} step
                {wf.definition.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => toggleActive(wf)}
                className={cn(
                  "relative w-10 h-5.5 rounded-full transition-colors",
                  wf.isActive ? "bg-signal-500" : "bg-ink-700"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform",
                    wf.isActive ? "translate-x-[18px]" : "translate-x-0.5"
                  )}
                />
              </button>
              <button onClick={() => deleteWorkflow(wf.id)} className="text-mist-400 hover:text-red-400">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkflowEditor({
  organizationId,
  workflow,
  onClose,
  onSaved,
}: {
  organizationId: string;
  workflow: Workflow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(workflow?.name ?? "");
  const [trigger, setTrigger] = useState<WorkflowTrigger>((workflow?.trigger as WorkflowTrigger) ?? "LEAD_CREATED");
  const [steps, setSteps] = useState<WorkflowStep[]>(workflow?.definition ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addStep(type: WorkflowStep["type"]) {
    const defaults: Record<WorkflowStep["type"], WorkflowStep> = {
      ASSIGN_ROUND_ROBIN: { type: "ASSIGN_ROUND_ROBIN" },
      UPDATE_STATUS: { type: "UPDATE_STATUS", status: "CONTACTED" },
      SEND_MESSAGE: { type: "SEND_MESSAGE", template: "Hi {{name}}, just checking in on your requirement — still interested?" },
      WAIT: { type: "WAIT", hours: 24 },
    };
    setSteps((prev) => [...prev, defaults[type]]);
  }

  function updateStep(index: number, next: WorkflowStep) {
    setSteps((prev) => prev.map((s, i) => (i === index ? next : s)));
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!name.trim() || steps.length === 0) {
      setError("Give the workflow a name and at least one step.");
      return;
    }
    setSaving(true);
    setError(null);

    const url = workflow ? `/api/automation/workflows/${workflow.id}` : "/api/automation/workflows";
    const method = workflow ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, name, trigger, definition: steps, isActive: true }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not save workflow");
      return;
    }
    onSaved();
  }

  return (
    <div className="glass-panel rounded-xl p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display font-bold text-lg text-mist-50">
          {workflow ? "Edit workflow" : "New workflow"}
        </h2>
        <button onClick={onClose} className="text-mist-400 hover:text-mist-50">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-mist-400 mb-1.5 block">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Hot lead fast-track"
            className="w-full h-10 rounded-lg bg-ink-800 border border-white/10 px-3 text-sm text-mist-50 placeholder:text-mist-400/50 focus-visible:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-mist-400 mb-1.5 block">Trigger</label>
          <select
            value={trigger}
            onChange={(e) => setTrigger(e.target.value as WorkflowTrigger)}
            className="w-full h-10 rounded-lg bg-ink-800 border border-white/10 px-3 text-sm text-mist-50 focus-visible:outline-none"
          >
            {TRIGGERS.map((t) => (
              <option key={t} value={t}>
                {TRIGGER_LABEL[t]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-mist-400 mb-2 block">Steps (run in order)</label>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <StepRow key={i} step={step} onChange={(s) => updateStep(i, s)} onRemove={() => removeStep(i)} />
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {(Object.keys(STEP_META) as (keyof typeof STEP_META)[]).map((type) => {
              const Icon = STEP_META[type].icon;
              return (
                <button
                  key={type}
                  onClick={() => addStep(type)}
                  className="flex items-center gap-1.5 text-xs text-mist-200 border border-white/10 rounded-full px-3 py-1.5 hover:border-signal-400/30 hover:text-signal-400 transition-colors"
                >
                  <Icon size={12} />
                  {STEP_META[type].label}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving…" : "Save workflow"}
        </Button>
      </div>
    </div>
  );
}

function StepRow({
  step,
  onChange,
  onRemove,
}: {
  step: WorkflowStep;
  onChange: (s: WorkflowStep) => void;
  onRemove: () => void;
}) {
  const Icon = STEP_META[step.type].icon;

  return (
    <div className="flex items-center gap-3 bg-ink-800/60 rounded-lg px-3 py-2.5">
      <Icon size={14} className="text-signal-400 shrink-0" />
      <span className="text-xs text-mist-200 shrink-0 w-40">{STEP_META[step.type].label}</span>

      {step.type === "UPDATE_STATUS" && (
        <select
          value={step.status}
          onChange={(e) => onChange({ type: "UPDATE_STATUS", status: e.target.value as any })}
          className="flex-1 h-8 rounded bg-ink-900 border border-white/10 px-2 text-xs text-mist-50"
        >
          {["NEW", "CONTACTED", "QUALIFIED", "MEETING_SCHEDULED", "WON", "LOST"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}

      {step.type === "SEND_MESSAGE" && (
        <input
          value={step.template}
          onChange={(e) => onChange({ type: "SEND_MESSAGE", template: e.target.value })}
          placeholder="Use {{name}}, {{requirement}}, {{location}}"
          className="flex-1 h-8 rounded bg-ink-900 border border-white/10 px-2 text-xs text-mist-50"
        />
      )}

      {step.type === "WAIT" && (
        <div className="flex items-center gap-2 flex-1">
          <input
            type="number"
            min={0.1}
            step={0.5}
            value={step.hours}
            onChange={(e) => onChange({ type: "WAIT", hours: Number(e.target.value) })}
            className="w-20 h-8 rounded bg-ink-900 border border-white/10 px-2 text-xs text-mist-50"
          />
          <span className="text-xs text-mist-400">hours</span>
        </div>
      )}

      {step.type === "ASSIGN_ROUND_ROBIN" && <div className="flex-1" />}

      <button onClick={onRemove} className="text-mist-400 hover:text-red-400 shrink-0">
        <Trash2 size={13} />
      </button>
    </div>
  );
}
