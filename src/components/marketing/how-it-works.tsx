const STEPS = [
  { n: "01", title: "Connect WhatsApp", body: "Link your WhatsApp Business number in minutes — no code required." },
  { n: "02", title: "Upload your knowledge", body: "Add pricing sheets, brochures, or your website. The AI learns your business." },
  { n: "03", title: "AI qualifies every lead", body: "Conversations run automatically, capturing requirement, budget, and timeline." },
  { n: "04", title: "Your team closes", body: "Hot leads land in your pipeline, pre-qualified and ready for a human touch." },
];

export function HowItWorks() {
  return (
    <section className="container py-24">
      <div className="max-w-xl mb-14">
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-mist-50">
          Live in an afternoon
        </h2>
      </div>
      <div className="grid md:grid-cols-4 gap-6">
        {STEPS.map((step) => (
          <div key={step.n} className="relative pl-0">
            <span className="font-mono text-signal-400/50 text-3xl font-medium">{step.n}</span>
            <h3 className="font-display text-mist-50 mt-3 mb-2">{step.title}</h3>
            <p className="text-sm text-mist-200 leading-relaxed">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
