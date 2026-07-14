import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listLeads } from "@/lib/services/lead.service";
import { PipelineBoard } from "@/components/crm/pipeline-board";
import { NewLeadDialog } from "@/components/crm/new-lead-dialog";
import { LeadFilters } from "@/components/crm/lead-filters";
import type { LeadScore, LeadStatus } from "@prisma/client";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { search?: string; score?: string; status?: string };
}) {
  const session = await auth();
  const organizationId = session?.activeOrganizationId;
  if (!organizationId) redirect("/login");

  const leads = await listLeads(organizationId, {
    search: searchParams.search,
    score: searchParams.score as LeadScore | undefined,
    status: searchParams.status as LeadStatus | undefined,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-mist-50">Leads</h1>
        <NewLeadDialog organizationId={organizationId} />
      </div>

      <LeadFilters />

      <PipelineBoard initialLeads={leads} organizationId={organizationId} />
    </div>
  );
}
