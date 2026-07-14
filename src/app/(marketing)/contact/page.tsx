import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the SalesPilot AI team.",
};

export default function ContactPage() {
  return (
    <div className="container pt-24 pb-24 max-w-lg">
      <h1 className="font-display font-bold text-4xl text-mist-50 mb-4">Talk to us</h1>
      <p className="text-mist-200 mb-8">
        For Enterprise plans, custom integrations, or general questions, reach
        us directly.
      </p>
      <div className="glass-panel rounded-2xl p-6 space-y-2 text-sm">
        <p className="text-mist-400">Email</p>
        <a href="mailto:hello@salespilot.ai" className="text-signal-400">
          hello@salespilot.ai
        </a>
      </div>
    </div>
  );
}
