import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: boolean;
}) {
  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-mist-400">{label}</span>
        <Icon size={16} className={cn(accent ? "text-amber-400" : "text-signal-400")} />
      </div>
      <p className="font-display font-bold text-2xl text-mist-50">{value}</p>
    </div>
  );
}
