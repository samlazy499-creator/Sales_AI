import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { StatsTicker } from "@/components/marketing/stats-ticker";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <StatsTicker />
      <Footer />
    </>
  );
}
