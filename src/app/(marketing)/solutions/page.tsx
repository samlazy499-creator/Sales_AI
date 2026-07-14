import type { Metadata } from "next";
import { Features } from "@/components/marketing/features";
import { HowItWorks } from "@/components/marketing/how-it-works";

export const metadata: Metadata = {
  title: "Solutions",
  description: "How SalesPilot AI automates WhatsApp sales conversations, qualification, and follow-up.",
};

export default function SolutionsPage() {
  return (
    <div className="pt-16">
      <HowItWorks />
      <Features />
    </div>
  );
}
