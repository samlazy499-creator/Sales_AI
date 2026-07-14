import Link from "next/link";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/solutions", label: "Solutions" },
      { href: "/industries", label: "Industries" },
      { href: "/pricing", label: "Pricing" },
      { href: "/demo", label: "Book a demo" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/login", label: "Log in" },
      { href: "/signup", label: "Sign up" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] mt-12">
      <div className="container py-14 grid sm:grid-cols-3 gap-10">
        <div>
          <span className="font-display font-bold text-lg text-mist-50">
            SalesPilot<span className="text-signal-400">AI</span>
          </span>
          <p className="mt-3 text-sm text-mist-400 max-w-xs">
            The AI sales employee for Indian SMBs — WhatsApp conversations,
            qualification, and follow-up, automated.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-xs font-mono uppercase tracking-widest text-mist-400 mb-4">
              {col.title}
            </h4>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-mist-200 hover:text-mist-50">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container py-6 border-t border-white/[0.06] text-xs text-mist-400">
        © {new Date().getFullYear()} SalesPilot AI. Made for Indian businesses.
      </div>
    </footer>
  );
}
