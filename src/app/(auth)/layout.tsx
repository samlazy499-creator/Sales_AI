import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-grid-glow px-4">
      <Link href="/" className="font-display font-bold text-lg mb-8">
        SalesPilot<span className="text-signal-400">AI</span>
      </Link>
      <div className="glass-panel rounded-2xl p-8 w-full max-w-md">{children}</div>
    </div>
  );
}
