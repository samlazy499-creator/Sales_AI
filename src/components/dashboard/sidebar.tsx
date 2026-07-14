"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Users,
  Bot,
  BookOpen,
  Workflow,
  BarChart3,
  CreditCard,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/ai-agent", label: "AI Agent", icon: Bot },
  { href: "/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  { href: "/automation", label: "Automation", icon: Workflow },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-white/[0.06] bg-ink-900/40 h-screen sticky top-0 py-6 px-3">
      <Link href="/dashboard" className="font-display font-bold text-lg px-3 mb-8">
        SalesPilot<span className="text-signal-400">AI</span>
      </Link>
      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-signal-600/15 text-signal-400"
                  : "text-mist-200 hover:text-mist-50 hover:bg-white/[0.04]"
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
