import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    price: "₹4,999",
    period: "/month",
    features: ["1 WhatsApp number", "Up to 500 conversations/mo", "1 industry template", "Email support"],
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "₹14,999",
    period: "/month",
    features: [
      "3 WhatsApp numbers",
      "Up to 3,000 conversations/mo",
      "All industry templates",
      "Automation workflows",
      "Priority support",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: ["Unlimited numbers & conversations", "Custom integrations", "Dedicated success manager", "SLA & onboarding"],
    cta: "Talk to sales",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section className="container py-24" id="pricing">
      <div className="max-w-xl mb-14">
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-mist-50">
          Simple, transparent pricing
        </h2>
        <p className="mt-4 text-mist-200">No setup fees. Cancel anytime.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={
              plan.highlighted
                ? "glass-panel rounded-2xl p-8 border-signal-400/30 shadow-glow-signal relative"
                : "glass-panel rounded-2xl p-8"
            }
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-8 text-[10px] font-mono uppercase tracking-widest bg-amber-500 text-ink-950 px-3 py-1 rounded-full">
                Most popular
              </span>
            )}
            <h3 className="font-display text-mist-50 text-lg">{plan.name}</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display font-bold text-3xl text-mist-50">{plan.price}</span>
              <span className="text-mist-400 text-sm">{plan.period}</span>
            </div>
            <ul className="mt-6 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-mist-200">
                  <Check size={16} className="text-signal-400 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              variant={plan.highlighted ? "primary" : "secondary"}
              className="w-full mt-8"
              asChild
            >
              <Link href={plan.name === "Enterprise" ? "/contact" : "/signup"}>{plan.cta}</Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
