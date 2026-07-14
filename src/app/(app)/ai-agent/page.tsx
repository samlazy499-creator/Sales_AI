import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { AgentSettingsForm } from "@/components/dashboard/agent-settings-form";

export default async function AIAgentPage() {
  const session = await auth();
  const organizationId = session?.activeOrganizationId;
  if (!organizationId) redirect("/login");

  const agent = await prisma.aIAgent.findUnique({ where: { organizationId } });
  if (!agent) {
    return <p className="text-mist-200">No AI agent found for this organization.</p>;
  }

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-mist-50 mb-6">AI Agent</h1>
      <AgentSettingsForm agent={agent} organizationId={organizationId} />
    </div>
  );
}
