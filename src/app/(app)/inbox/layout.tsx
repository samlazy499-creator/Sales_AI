import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { ConversationList } from "@/components/dashboard/conversation-list";

export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const organizationId = session?.activeOrganizationId;
  if (!organizationId) redirect("/login");

  return (
    <div className="flex -m-6">
      <ConversationList organizationId={organizationId} />
      {children}
    </div>
  );
}
