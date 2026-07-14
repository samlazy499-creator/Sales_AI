"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError(
        res.error === "EMAIL_NOT_VERIFIED"
          ? "Please verify your email before logging in."
          : "Invalid email or password."
      );
      return;
    }

    router.push(params.get("callbackUrl") ?? "/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="font-display font-bold text-2xl text-mist-50 mb-1">Log in</h1>
      <p className="text-sm text-mist-400 mb-6">Welcome back.</p>

      <div>
        <label className="text-xs text-mist-400 mb-1.5 block">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full h-11 rounded-lg bg-ink-800 border border-white/10 px-3 text-sm text-mist-50 focus-visible:outline-none"
        />
      </div>
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-xs text-mist-400">Password</label>
          <Link href="/forgot-password" className="text-xs text-signal-400">
            Forgot?
          </Link>
        </div>
        <input
          name="password"
          type="password"
          required
          className="w-full h-11 rounded-lg bg-ink-800 border border-white/10 px-3 text-sm text-mist-50 focus-visible:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Logging in…" : "Log in"}
      </Button>

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      >
        Continue with Google
      </Button>

      <p className="text-xs text-mist-400 text-center pt-2">
        Don't have an account?{" "}
        <Link href="/signup" className="text-signal-400">
          Start free trial
        </Link>
      </p>
    </form>
  );
}
