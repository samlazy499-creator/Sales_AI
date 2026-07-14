const INDUSTRIES = [
  { name: "Real Estate", detail: "Site visits booked, budget & locality captured" },
  { name: "Coaching Institutes", detail: "Demo classes booked, course fit qualified" },
  { name: "Clinics", detail: "Appointments scheduled, first-visit info collected" },
  { name: "Automobile Dealers", detail: "Test drives booked, model & budget captured" },
  { name: "Travel Agencies", detail: "Itinerary requests qualified by dates & budget" },
  { name: "Insurance", detail: "Policy interest routed to the right advisor" },
];

export function Industries() {
  return (
    <section className="container py-24">
      <div className="max-w-xl mb-14">
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-mist-50">
          One AI employee, tuned per industry
        </h2>
        <p className="mt-4 text-mist-200">
          Each template ships with an industry-specific conversation script and
          scoring model — not a generic chatbot wearing your logo.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
        {INDUSTRIES.map((ind) => (
          <div key={ind.name} className="bg-ink-950 p-6 hover:bg-ink-900 transition-colors">
            <h3 className="font-display text-mist-50 mb-1">{ind.name}</h3>
            <p className="text-xs text-mist-400">{ind.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
