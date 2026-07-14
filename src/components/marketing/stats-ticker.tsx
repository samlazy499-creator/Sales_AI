const STATS = [
  "2,847 conversations handled today",
  "412 leads qualified this week",
  "68% avg. response rate under 30s",
  "₹1.4Cr in attributed pipeline this month",
  "6 industries, 1 AI employee",
];

export function StatsTicker() {
  const doubled = [...STATS, ...STATS];
  return (
    <div className="overflow-hidden border-y border-white/[0.06] bg-ink-900/40">
      <div className="flex w-max animate-ticker font-mono text-xs text-mist-400 py-2.5">
        {doubled.map((s, i) => (
          <span key={i} className="px-6 whitespace-nowrap">
            {s}
            <span className="ml-6 text-mist-400/30">/</span>
          </span>
        ))}
      </div>
    </div>
  );
}
