import type { Metadata } from "next";
import { ConversationDemo } from "@/components/marketing/conversation-demo";

export const metadata: Metadata = {
  title: "Book a demo",
  description: "See SalesPilot AI qualify a lead on WhatsApp in real time, then book a live walkthrough.",
};

export default function DemoPage() {
  return (
    <div className="container pt-24 pb-24 grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <h1 className="font-display font-bold text-4xl text-mist-50 mb-4">
          Watch SalesPilot qualify a lead
        </h1>
        <p className="text-mist-200 leading-relaxed mb-8">
          This is a live sample of how the AI agent handles an inbound
          WhatsApp message — capturing budget and timeline, then booking a
          site visit, without a human touching the conversation.
        </p>
        <p className="text-sm text-mist-400">
          Want to see it configured for your business? Email{" "}
          <a href="mailto:demo@salespilot.ai" className="text-signal-400">
            demo@salespilot.ai
          </a>{" "}
          and we'll set up a 20-minute walkthrough.
        </p>
      </div>
      <div className="flex justify-center">
        <ConversationDemo />
      </div>
    </div>
  );
}
