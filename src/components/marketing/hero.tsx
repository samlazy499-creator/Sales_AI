import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConversationDemo } from "@/components/marketing/conversation-demo";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-grid-glow">
      <div className="container grid lg:grid-cols-2 gap-12 items-center pt-20 pb-24">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-mono text-signal-400 border border-signal-400/20 bg-signal-400/[0.06] rounded-full px-3 py-1 mb-6">
            Built for Indian SMBs
          </span>
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-mist-50">
            Your AI sales employee that never sleeps
          </h1>
          <p className="mt-6 text-lg text-mist-200 max-w-lg leading-relaxed">
            Convert more leads with AI-powered WhatsApp conversations,
            automated follow-ups, and intelligent sales management —
            purpose-built for real estate, clinics, coaching, and five other
            industries.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button size="lg" asChild>
              <Link href="/demo">Book demo</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/signup">Start free trial</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-mist-400">
            14-day trial · no credit card required
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <ConversationDemo />
        </div>
      </div>
    </section>
  );
}
