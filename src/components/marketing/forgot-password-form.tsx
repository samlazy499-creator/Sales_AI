"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center py-4">
        <h2 className="font-display text-xl text-mist-50 mb-2">Check your email</h2>
        <p className="text-sm text-mist-200">
          If an account exists for that address, a reset link is on its way.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="font-display font-bold text-2xl text-mist-50 mb-1">Reset password</h1>
      <p className="text-sm text-mist-400 mb-6">
        We'll email you a link to set a new one.
      </p>
      <div>
        <label className="text-xs text-mist-400 mb-1.5 block">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full h-11 rounded-lg bg-ink-800 border border-white/10 px-3 text-sm text-mist-50 focus-visible:outline-none"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sending…" : "Send reset link"}
      </Button>
      <p className="text-xs text-mist-400 text-center pt-2">
        <Link href="/login" className="text-signal-400">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
