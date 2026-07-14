const PROBLEMS = [
  "Leads message on WhatsApp after hours and go cold before anyone replies.",
  "Sales reps spend hours on repetitive qualification instead of closing.",
  "Follow-ups fall through the cracks across spreadsheets and chat apps.",
];

const SOLUTIONS = [
  "AI replies in seconds, any time, on the channel your leads already use.",
  "Every lead arrives pre-qualified with budget, timeline, and requirement captured.",
  "Automated follow-up sequences run until a lead books, buys, or opts out.",
];

export function ProblemSolution() {
  return (
    <section className="container py-24">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass-panel rounded-2xl p-8">
          <span className="text-xs font-mono uppercase tracking-widest text-mist-400">
            Without SalesPilot
          </span>
          <ul className="mt-6 space-y-4">
            {PROBLEMS.map((p) => (
              <li key={p} className="flex gap-3 text-mist-200 text-sm leading-relaxed">
                <span className="text-mist-400 mt-0.5">–</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-panel rounded-2xl p-8 border-signal-400/20 shadow-glow-signal">
          <span className="text-xs font-mono uppercase tracking-widest text-signal-400">
            With SalesPilot
          </span>
          <ul className="mt-6 space-y-4">
            {SOLUTIONS.map((s) => (
              <li key={s} className="flex gap-3 text-mist-50 text-sm leading-relaxed">
                <span className="text-signal-400 mt-0.5">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
