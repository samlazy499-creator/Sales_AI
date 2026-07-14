"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NewLeadDialog({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        name: form.get("name"),
        phone: form.get("phone"),
        email: form.get("email") || undefined,
        budget: form.get("budget") || undefined,
        location: form.get("location") || undefined,
        requirement: form.get("requirement") || undefined,
        source: "MANUAL",
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not create lead");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button size="sm">
          <Plus size={15} />
          New lead
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 glass-panel rounded-2xl p-6 w-full max-w-md z-50">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="font-display font-bold text-lg text-mist-50">
              New lead
            </Dialog.Title>
            <Dialog.Close className="text-mist-400 hover:text-mist-50">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input name="name" label="Name" required />
            <Input name="phone" label="Phone" required placeholder="9876543210" />
            <Input name="email" label="Email (optional)" type="email" />
            <div className="grid grid-cols-2 gap-3">
              <Input name="budget" label="Budget" />
              <Input name="location" label="Location" />
            </div>
            <Textarea name="requirement" label="Requirement" />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating…" : "Create lead"}
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Input({
  name,
  label,
  type = "text",
  required,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs text-mist-400 mb-1.5 block">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full h-10 rounded-lg bg-ink-800 border border-white/10 px-3 text-sm text-mist-50 placeholder:text-mist-400/50 focus-visible:outline-none"
      />
    </div>
  );
}

function Textarea({ name, label }: { name: string; label: string }) {
  return (
    <div>
      <label className="text-xs text-mist-400 mb-1.5 block">{label}</label>
      <textarea
        name={name}
        rows={2}
        className="w-full rounded-lg bg-ink-800 border border-white/10 px-3 py-2 text-sm text-mist-50 focus-visible:outline-none resize-none"
      />
    </div>
  );
}
