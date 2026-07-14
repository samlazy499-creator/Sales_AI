import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getConversationById } from "@/lib/services/conversation.service";
import { ConversationThread } from "@/components/dashboard/conversation-thread";

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const organizationId = session?.activeOrganizationId;
  if (!organizationId) redirect("/login");

  const conversation = await getConversationById(organizationId, params.id);
  if (!conversation) notFound();

  return (
    <ConversationThread
      conversationId={conversation.id}
      organizationId={organizationId}
      customerName={conversation.customer.name || conversation.customer.phone}
      mode={conversation.mode}
      initialMessages={conversation.messages}
    />
  );
}
