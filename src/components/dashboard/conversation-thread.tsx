"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  sender: "CUSTOMER" | "AI" | "EMPLOYEE";
  content: string;
  createdAt: string | Date;
};

export function ConversationThread({
  conversationId,
  organizationId,
  customerName,
  mode,
  initialMessages,
}: {
  conversationId: string;
  organizationId: string;
  customerName: string;
  mode: "AI" | "HUMAN";
  initialMessages: Message[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [currentMode, setCurrentMode] = useState(mode);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!draft.trim()) return;
    setSending(true);

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      sender: "EMPLOYEE",
      content: draft,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, optimistic]);
    const text = draft;
    setDraft("");

    const res = await fetch(`/api/conversations/${conversationId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, text }),
    });

    if (res.ok) {
      setCurrentMode("HUMAN");
      router.refresh();
    }
    setSending(false);
  }

  async function toggleMode() {
    const nextMode = currentMode === "AI" ? "HUMAN" : "AI";
    setCurrentMode(nextMode);
    await fetch(`/api/conversations/${conversationId}/mode`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, mode: nextMode }),
    });
    router.refresh();
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)]">
      <div className="h-14 border-b border-white/[0.06] flex items-center justify-between px-5 shrink-0">
        <p className="text-sm font-medium text-mist-50">{customerName}</p>
        <button
          onClick={toggleMode}
          className={cn(
            "text-xs font-mono uppercase px-3 py-1.5 rounded-full border transition-colors",
            currentMode === "AI"
              ? "bg-signal-500/15 text-signal-400 border-signal-500/20"
              : "bg-amber-500/15 text-amber-400 border-amber-500/20"
          )}
        >
          {currentMode === "AI" ? "AI is replying — take over" : "You're in control — hand back to AI"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={m.sender === "CUSTOMER" ? "flex justify-start" : "flex justify-end"}>
            <div
              className={cn(
                "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                m.sender === "CUSTOMER" && "bg-ink-700 text-mist-50 rounded-tl-sm",
                m.sender === "AI" && "bg-signal-600/90 text-white rounded-tr-sm",
                m.sender === "EMPLOYEE" && "bg-amber-500/90 text-ink-950 rounded-tr-sm"
              )}
            >
              {m.content}
              {m.sender !== "CUSTOMER" && (
                <span className="block text-[9px] uppercase font-mono opacity-70 mt-1">
                  {m.sender === "AI" ? "AI" : "You"}
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-white/[0.06] flex gap-2 shrink-0">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a reply…"
          className="flex-1 h-11 rounded-lg bg-ink-800 border border-white/10 px-3 text-sm text-mist-50 placeholder:text-mist-400/50 focus-visible:outline-none"
        />
        <Button onClick={handleSend} disabled={sending || !draft.trim()}>
          <Send size={15} />
        </Button>
      </div>
    </div>
  );
}
