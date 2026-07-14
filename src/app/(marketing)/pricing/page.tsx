import type { Metadata } from "next";
import { Pricing } from "@/components/marketing/pricing";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for SalesPilot AI — starting at ₹4,999/month.",
};

export default function PricingPage() {
  return (
    <div className="pt-16">
      <Pricing />
    </div>
  );
}
