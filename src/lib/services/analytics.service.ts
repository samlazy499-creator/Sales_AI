import { prisma } from "@/lib/db";
import { startOfDay, subDays, format } from "date-fns";

/**
 * All functions here take an explicit organizationId and every Prisma
 * call filters on it — this is the one place dashboard/analytics numbers
 * are computed, so tenant isolation only has to be right in one spot.
 */

export async function getDashboardSummary(organizationId: string) {
  const todayStart = startOfDay(new Date());

  const [todaysLeads, wonLeads, totalLeads, upcomingAppointments, conversations] =
    await Promise.all([
      prisma.lead.count({
        where: { organizationId, createdAt: { gte: todayStart } },
      }),
      prisma.lead.count({ where: { organizationId, status: "WON" } }),
      prisma.lead.count({ where: { organizationId } }),
      prisma.appointment.count({
        where: { organizationId, scheduledAt: { gte: new Date() }, status: "SCHEDULED" },
      }),
      prisma.conversation.count({ where: { organizationId } }),
    ]);

  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  return {
    todaysLeads,
    conversionRate,
    totalConversations: conversations,
    upcomingAppointments,
  };
}

export async function getLeadGrowthSeries(organizationId: string, days = 14) {
  const since = subDays(startOfDay(new Date()), days - 1);

  const leads = await prisma.lead.findMany({
    where: { organizationId, createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const day = format(subDays(new Date(), days - 1 - i), "MMM d");
    buckets.set(day, 0);
  }
  for (const lead of leads) {
    const day = format(lead.createdAt, "MMM d");
    buckets.set(day, (buckets.get(day) ?? 0) + 1);
  }

  return Array.from(buckets.entries()).map(([date, count]) => ({ date, leads: count }));
}

export async function getPipelineFunnel(organizationId: string) {
  const statuses = ["NEW", "CONTACTED", "QUALIFIED", "MEETING_SCHEDULED", "WON"] as const;
  const counts = await Promise.all(
    statuses.map((status) => prisma.lead.count({ where: { organizationId, status } }))
  );
  return statuses.map((status, i) => ({ stage: status, count: counts[i] }));
}
