import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { KnowledgeBaseManager } from "@/components/dashboard/knowledge-base-manager";

export default async function KnowledgeBasePage() {
  const session = await auth();
  const organizationId = session?.activeOrganizationId;
  if (!organizationId) redirect("/login");

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-mist-50 mb-6">Knowledge Base</h1>
      <KnowledgeBaseManager organizationId={organizationId} />
    </div>
  );
}
