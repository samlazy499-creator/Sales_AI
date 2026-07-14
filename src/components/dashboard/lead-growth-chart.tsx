"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function LeadGrowthChart({ data }: { data: { date: string; leads: number }[] }) {
  return (
    <div className="glass-panel rounded-xl p-5">
      <h3 className="text-sm text-mist-200 mb-4">Lead growth (14 days)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid stroke="#1C202B" vertical={false} />
          <XAxis dataKey="date" stroke="#8A8FA3" fontSize={11} tickLine={false} />
          <YAxis stroke="#8A8FA3" fontSize={11} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "#14171F", border: "1px solid #272C3A", borderRadius: 8 }}
            labelStyle={{ color: "#F5F6FA" }}
          />
          <Line type="monotone" dataKey="leads" stroke="#6D6BFF" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
