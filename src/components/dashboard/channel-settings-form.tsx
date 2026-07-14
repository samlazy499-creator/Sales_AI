"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Channel } from "@prisma/client";

export function ChannelSettingsForm({
  channel,
  organizationId,
  appUrl,
}: {
  channel: Channel | null;
  organizationId: string;
  appUrl: string;
}) {
  const [phoneNumberId, setPhoneNumberId] = useState(channel?.whatsappPhoneNumberId ?? "");
  const [wabaId, setWabaId] = useState(channel?.whatsappWabaId ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch("/api/settings/channel", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        whatsappPhoneNumberId: phoneNumberId,
        whatsappWabaId: wabaId,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const webhookUrl = `${appUrl}/api/webhooks/whatsapp`;

  return (
    <div className="glass-panel rounded-xl p-6 max-w-xl space-y-4">
      <div>
        <h3 className="font-display text-mist-50 mb-1">WhatsApp Business</h3>
        <p className="text-xs text-mist-400">
          From Meta for Developers → your app → WhatsApp → API Setup.
        </p>
      </div>

      <Field label="Phone Number ID" value={phoneNumberId} onChange={setPhoneNumberId} />
      <Field label="WABA ID" value={wabaId} onChange={setWabaId} />

      <div>
        <label className="text-xs text-mist-400 mb-1.5 block">
          Webhook URL (paste into Meta's webhook config)
        </label>
        <code className="block text-xs bg-ink-800 border border-white/10 rounded-lg px-3 py-2.5 text-mist-200 break-all">
          {webhookUrl}
        </code>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {saved && <span className="text-xs text-signal-400">Saved</span>}
        {channel?.status === "CONNECTED" && (
          <span className="text-xs text-signal-400 ml-auto">● Connected</span>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-mist-400 mb-1.5 block">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-lg bg-ink-800 border border-white/10 px-3 text-sm text-mist-50 focus-visible:outline-none"
      />
    </div>
  );
}
