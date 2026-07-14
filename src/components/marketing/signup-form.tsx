"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const INDUSTRIES = [
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "COACHING", label: "Coaching Institute" },
  { value: "CLINIC", label: "Clinic" },
  { value: "AUTOMOBILE", label: "Automobile Dealer" },
  { value: "TRAVEL", label: "Travel Agency" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "OTHER", label: "Other" },
];

export function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
      organizationName: form.get("organizationName"),
      industry: form.get("industry"),
    };

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <h2 className="font-display text-xl text-mist-50 mb-2">Check your email</h2>
        <p className="text-sm text-mist-200">
          We've sent a verification link. Confirm it to activate your 14-day trial.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="font-display font-bold text-2xl text-mist-50 mb-1">
        Start your free trial
      </h1>
      <p className="text-sm text-mist-400 mb-6">14 days, no credit card required.</p>

      <Field label="Your name" name="name" type="text" required />
      <Field label="Work email" name="email" type="email" required />
      <Field label="Password" name="password" type="password" required minLength={8} />
      <Field label="Business name" name="organizationName" type="text" required />

      <div>
        <label className="text-xs text-mist-400 mb-1.5 block">Industry</label>
        <select
          name="industry"
          required
          className="w-full h-11 rounded-lg bg-ink-800 border border-white/10 px-3 text-sm text-mist-50 focus-visible:outline-none"
        >
          {INDUSTRIES.map((ind) => (
            <option key={ind.value} value={ind.value}>
              {ind.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-xs text-mist-400 text-center pt-2">
        Already have an account?{" "}
        <Link href="/login" className="text-signal-400">
          Log in
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  required,
  minLength,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div>
      <label className="text-xs text-mist-400 mb-1.5 block">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        className="w-full h-11 rounded-lg bg-ink-800 border border-white/10 px-3 text-sm text-mist-50 placeholder:text-mist-400 focus-visible:outline-none"
      />
    </div>
  );
}
