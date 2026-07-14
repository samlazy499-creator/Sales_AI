import type { Metadata } from "next";
import { Industries } from "@/components/marketing/industries";

export const metadata: Metadata = {
  title: "Industries",
  description: "Industry-tuned AI sales agents for real estate, coaching, clinics, automobile, travel, and insurance.",
};

export default function IndustriesPage() {
  return (
    <div className="pt-16">
      <Industries />
    </div>
  );
}
