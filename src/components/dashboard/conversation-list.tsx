import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { listConversations } from "@/lib/services/conversation.service";
import { cn } from "@/lib/utils";

export async function ConversationList({
  organizationId,
  activeId,
}: {
  organizationId: string;
  activeId?: string;
}) {
  const conversations = await listConversations(organizationId);

  return (
    <div className="w-80 shrink-0 border-r border-white/[0.06] h-[calc(100vh-4rem)] overflow-y-auto">
      {conversations.length === 0 && (
        <p className="text-sm text-mist-400 p-4">
          No conversations yet — they'll appear here once WhatsApp is connected.
        </p>
      )}
      {conversations.map((c) => (
        <Link
          key={c.id}
          href={`/inbox/${c.id}`}
          className={cn(
            "block px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors",
            activeId === c.id && "bg-signal-600/10"
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-mist-50 truncate">
              {c.customer.name || c.customer.phone}
            </p>
            <span
              className={cn(
                "text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full shrink-0 ml-2",
                c.mode === "AI"
                  ? "bg-signal-500/15 text-signal-400"
                  : "bg-amber-500/15 text-amber-400"
              )}
            >
              {c.mode}
            </span>
          </div>
          <p className="text-xs text-mist-400 truncate">
            {c.messages[0]?.content ?? "No messages"}
          </p>
          <p className="text-[10px] text-mist-400/60 mt-1">
            {formatDistanceToNow(c.updatedAt, { addSuffix: true })}
          </p>
        </Link>
      ))}
    </div>
  );
}
