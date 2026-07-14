import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { WorkflowBuilder } from "@/components/dashboard/workflow-builder";

export default async function AutomationPage() {
  const session = await auth();
  const organizationId = session?.activeOrganizationId;
  if (!organizationId) redirect("/login");

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-mist-50 mb-2">Automation</h1>
      <p className="text-sm text-mist-400 mb-6">
        Build sequences that run automatically when a lead is created, changes status, or scores HOT.
      </p>
      <WorkflowBuilder organizationId={organizationId} />
    </div>
  );
}
