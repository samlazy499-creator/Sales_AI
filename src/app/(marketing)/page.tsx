import { Hero } from "@/components/marketing/hero";
import { ProblemSolution } from "@/components/marketing/problem-solution";
import { Features } from "@/components/marketing/features";
import { Industries } from "@/components/marketing/industries";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Pricing } from "@/components/marketing/pricing";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemSolution />
      <Features />
      <Industries />
      <HowItWorks />
      <Pricing />
    </>
  );
}
