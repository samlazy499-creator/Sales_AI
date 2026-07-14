"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => setStatus(res.ok ? "success" : "error"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="text-center py-4">
      {status === "pending" && <p className="text-mist-200">Verifying…</p>}
      {status === "success" && (
        <>
          <h2 className="font-display text-xl text-mist-50 mb-2">Email verified</h2>
          <p className="text-sm text-mist-200 mb-6">Your trial is active. You're all set.</p>
          <Button asChild>
            <Link href="/login">Log in</Link>
          </Button>
        </>
      )}
      {status === "error" && (
        <>
          <h2 className="font-display text-xl text-mist-50 mb-2">Link expired</h2>
          <p className="text-sm text-mist-200 mb-6">
            This verification link is invalid or has expired.
          </p>
          <Button variant="secondary" asChild>
            <Link href="/login">Back to log in</Link>
          </Button>
        </>
      )}
    </div>
  );
}
