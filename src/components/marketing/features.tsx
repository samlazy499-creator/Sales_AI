import {
  MessageCircle,
  Brain,
  Workflow,
  BarChart3,
  Calendar,
  ShieldCheck,
} from "lucide-react";

const FEATURES = [
  {
    icon: MessageCircle,
    title: "WhatsApp-native conversations",
    body: "Reply, qualify, and follow up on the channel 500M+ Indians already use daily.",
  },
  {
    icon: Brain,
    title: "Knowledge-grounded AI",
    body: "The agent answers only from your uploaded docs, pricing sheets, and website — never guesses.",
  },
  {
    icon: Workflow,
    title: "Visual automation",
    body: "Build follow-up and assignment workflows without writing a line of code.",
  },
  {
    icon: Calendar,
    title: "Appointment booking",
    body: "The AI books site visits, demos, and consultations straight into your pipeline.",
  },
  {
    icon: BarChart3,
    title: "Revenue attribution",
    body: "See exactly which conversations turned into won deals, not just messages sent.",
  },
  {
    icon: ShieldCheck,
    title: "Human takeover, anytime",
    body: "Any teammate can jump into a live conversation and the AI steps back instantly.",
  },
];

export function Features() {
  return (
    <section className="container py-24">
      <div className="max-w-xl mb-14">
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-mist-50">
          Everything a sales team needs, minus the headcount
        </h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="glass-panel rounded-xl p-6">
            <Icon className="text-signal-400 mb-4" size={22} />
            <h3 className="font-display font-medium text-mist-50 mb-2">{title}</h3>
            <p className="text-sm text-mist-200 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
