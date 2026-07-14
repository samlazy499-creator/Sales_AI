"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useState, useTransition } from "react";

const SCORES = ["HOT", "WARM", "COLD"] as const;

export function LeadFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && updateParam("search", search || null)}
          onBlur={() => updateParam("search", search || null)}
          placeholder="Search name or phone…"
          className="h-9 pl-9 pr-3 rounded-lg bg-ink-800 border border-white/10 text-sm text-mist-50 placeholder:text-mist-400/50 focus-visible:outline-none w-56"
        />
      </div>

      <select
        defaultValue={searchParams.get("score") ?? ""}
        onChange={(e) => updateParam("score", e.target.value || null)}
        className="h-9 rounded-lg bg-ink-800 border border-white/10 px-3 text-sm text-mist-50 focus-visible:outline-none"
      >
        <option value="">All scores</option>
        {SCORES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
