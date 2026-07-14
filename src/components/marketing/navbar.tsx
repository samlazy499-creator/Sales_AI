import Link from "next/link";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/solutions", label: "Solutions" },
  { href: "/industries", label: "Industries" },
  { href: "/pricing", label: "Pricing" },
  { href: "/demo", label: "Demo" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="font-display font-bold text-lg tracking-tight">
          SalesPilot<span className="text-signal-400">AI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-mist-200 hover:text-mist-50 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button variant="primary" size="sm" asChild>
            <Link href="/signup">Start free trial</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
