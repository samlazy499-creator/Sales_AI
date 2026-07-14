"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AIAgent } from "@prisma/client";

export function AgentSettingsForm({
  agent,
  organizationId,
}: {
  agent: AIAgent;
  organizationId: string;
}) {
  const [personaPrompt, setPersonaPrompt] = useState(agent.personaPrompt);
  const [temperature, setTemperature] = useState(agent.temperature);
  const [isActive, setIsActive] = useState(agent.isActive);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/ai-agent/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, personaPrompt, temperature, isActive }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="glass-panel rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-mist-50 font-medium">Agent status</p>
          <p className="text-xs text-mist-400 mt-1">
            When off, incoming messages get a generic "we'll get back to you" reply and skip the AI entirely.
          </p>
        </div>
        <button
          onClick={() => setIsActive((v) => !v)}
          className={
            "relative w-11 h-6 rounded-full transition-colors shrink-0 " +
            (isActive ? "bg-signal-500" : "bg-ink-700")
          }
        >
          <span
            className={
              "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform " +
              (isActive ? "translate-x-5" : "translate-x-0.5")
            }
          />
        </button>
      </div>

      <div>
        <label className="text-xs text-mist-400 mb-2 block">
          Persona &amp; conversation rules
        </label>
        <textarea
          value={personaPrompt}
          onChange={(e) => setPersonaPrompt(e.target.value)}
          rows={16}
          className="w-full rounded-lg bg-ink-800 border border-white/10 px-3 py-2.5 text-sm text-mist-50 font-mono leading-relaxed focus-visible:outline-none resize-y"
        />
        <p className="text-xs text-mist-400 mt-2">
          This is the system prompt sent with every conversation. It was
          pre-filled with rules for your industry — edit freely, but keep
          the "only answer from knowledge base" instruction to avoid
          hallucinated pricing or policy answers.
        </p>
      </div>

      <div>
        <label className="text-xs text-mist-400 mb-2 block">
          Creativity ({temperature.toFixed(1)}) — lower is more consistent, higher is more varied
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
          className="w-full accent-signal-500"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
        {saved && <span className="text-xs text-signal-400">Saved</span>}
      </div>
    </div>
  );
}
