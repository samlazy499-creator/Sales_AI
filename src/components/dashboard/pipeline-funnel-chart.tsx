"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  MEETING_SCHEDULED: "Meeting",
  WON: "Won",
};

export function PipelineFunnelChart({ data }: { data: { stage: string; count: number }[] }) {
  const formatted = data.map((d) => ({ ...d, stage: LABELS[d.stage] ?? d.stage }));

  return (
    <div className="glass-panel rounded-xl p-5">
      <h3 className="text-sm text-mist-200 mb-4">Pipeline funnel</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={formatted}>
          <CartesianGrid stroke="#1C202B" vertical={false} />
          <XAxis dataKey="stage" stroke="#8A8FA3" fontSize={11} tickLine={false} />
          <YAxis stroke="#8A8FA3" fontSize={11} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "#14171F", border: "1px solid #272C3A", borderRadius: 8 }}
            labelStyle={{ color: "#F5F6FA" }}
          />
          <Bar dataKey="count" fill="#F79A2E" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
