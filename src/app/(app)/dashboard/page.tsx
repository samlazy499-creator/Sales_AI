import { Users, TrendingUp, MessageSquare, CalendarCheck } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import { LeadGrowthChart } from "@/components/dashboard/lead-growth-chart";
import { PipelineFunnelChart } from "@/components/dashboard/pipeline-funnel-chart";
import {
  getDashboardSummary,
  getLeadGrowthSeries,
  getPipelineFunnel,
} from "@/lib/services/analytics.service";

export default async function DashboardPage() {
  const session = await auth();
  const organizationId = session?.activeOrganizationId;
  if (!organizationId) redirect("/login");

  const [summary, growth, funnel] = await Promise.all([
    getDashboardSummary(organizationId),
    getLeadGrowthSeries(organizationId),
    getPipelineFunnel(organizationId),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl text-mist-50">Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's leads" value={summary.todaysLeads} icon={Users} />
        <StatCard label="Conversion rate" value={`${summary.conversionRate}%`} icon={TrendingUp} accent />
        <StatCard label="Total conversations" value={summary.totalConversations} icon={MessageSquare} />
        <StatCard label="Upcoming appointments" value={summary.upcomingAppointments} icon={CalendarCheck} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <LeadGrowthChart data={growth} />
        <PipelineFunnelChart data={funnel} />
      </div>
    </div>
  );
}
