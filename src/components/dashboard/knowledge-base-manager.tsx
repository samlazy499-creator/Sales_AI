"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FileText, Link as LinkIcon, Type, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Doc = {
  id: string;
  title: string;
  sourceType: "PDF" | "DOCX" | "URL" | "IMAGE" | "TEXT";
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  createdAt: string;
  _count: { chunks: number };
};

const STATUS_STYLE: Record<Doc["status"], string> = {
  PENDING: "bg-mist-400/15 text-mist-400",
  PROCESSING: "bg-signal-500/15 text-signal-400",
  READY: "bg-emerald-500/15 text-emerald-400",
  FAILED: "bg-red-500/15 text-red-400",
};

export function KnowledgeBaseManager({ organizationId }: { organizationId: string }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [tab, setTab] = useState<"file" | "url" | "text">("file");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    const res = await fetch(`/api/knowledge?organizationId=${organizationId}`);
    if (res.ok) {
      const data = await res.json();
      setDocs(data.documents);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchDocs();
    // Poll while anything is still PENDING/PROCESSING — extraction and
    // embedding happen asynchronously server-side, this is how the UI
    // reflects READY/FAILED without a websocket.
    const interval = setInterval(() => {
      setDocs((current) => {
        const hasInFlight = current.some((d) => d.status === "PENDING" || d.status === "PROCESSING");
        if (hasInFlight) fetchDocs();
        return current;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchDocs]);

  async function handleFileUpload(file: File) {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("organizationId", organizationId);
    formData.append("file", file);

    const res = await fetch("/api/knowledge/upload", { method: "POST", body: formData });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Upload failed");
      return;
    }
    fetchDocs();
  }

  async function handleUrlSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/knowledge/url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, url: form.get("url") }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not fetch URL");
      return;
    }
    (e.target as HTMLFormElement).reset();
    fetchDocs();
  }

  async function handleTextSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/knowledge/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, title: form.get("title"), text: form.get("text") }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not save text");
      return;
    }
    (e.target as HTMLFormElement).reset();
    fetchDocs();
  }

  async function handleDelete(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    await fetch(`/api/knowledge/${id}?organizationId=${organizationId}`, { method: "DELETE" });
  }

  return (
    <div className="grid lg:grid-cols-[380px_1fr] gap-6">
      <div className="glass-panel rounded-xl p-5">
        <div className="flex gap-1 mb-5 bg-ink-800 rounded-lg p-1">
          <TabButton active={tab === "file"} onClick={() => setTab("file")} icon={Upload} label="File" />
          <TabButton active={tab === "url"} onClick={() => setTab("url")} icon={LinkIcon} label="URL" />
          <TabButton active={tab === "text"} onClick={() => setTab("text")} icon={Type} label="Text" />
        </div>

        {tab === "file" && (
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-white/10 rounded-xl py-10 text-center hover:border-signal-400/30 transition-colors"
            >
              <Upload className="mx-auto text-mist-400 mb-2" size={22} />
              <p className="text-sm text-mist-200">Click to upload</p>
              <p className="text-xs text-mist-400 mt-1">PDF, DOCX, or TXT — up to 10MB</p>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
          </div>
        )}

        {tab === "url" && (
          <form onSubmit={handleUrlSubmit} className="space-y-3">
            <input
              name="url"
              type="url"
              required
              placeholder="https://yourbusiness.com/pricing"
              className="w-full h-10 rounded-lg bg-ink-800 border border-white/10 px-3 text-sm text-mist-50 placeholder:text-mist-400/50 focus-visible:outline-none"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Fetching…" : "Add URL"}
            </Button>
          </form>
        )}

        {tab === "text" && (
          <form onSubmit={handleTextSubmit} className="space-y-3">
            <input
              name="title"
              required
              placeholder="Title (e.g. Pricing FAQ)"
              className="w-full h-10 rounded-lg bg-ink-800 border border-white/10 px-3 text-sm text-mist-50 placeholder:text-mist-400/50 focus-visible:outline-none"
            />
            <textarea
              name="text"
              required
              rows={6}
              placeholder="Paste pricing, policies, FAQs…"
              className="w-full rounded-lg bg-ink-800 border border-white/10 px-3 py-2 text-sm text-mist-50 placeholder:text-mist-400/50 focus-visible:outline-none resize-none"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving…" : "Add text"}
            </Button>
          </form>
        )}

        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
      </div>

      <div className="glass-panel rounded-xl p-5">
        <h3 className="text-sm text-mist-200 mb-4">
          Documents ({docs.length})
        </h3>
        {docs.length === 0 && (
          <p className="text-sm text-mist-400">
            Nothing uploaded yet. Add your pricing, policies, or FAQs so the AI agent can answer from them.
          </p>
        )}
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-ink-900/40">
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={16} className="text-mist-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-mist-50 truncate">{doc.title}</p>
                  <p className="text-xs text-mist-400">
                    {doc.sourceType} · {doc._count.chunks} chunks
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={cn("text-[10px] font-mono uppercase px-2 py-0.5 rounded-full", STATUS_STYLE[doc.status])}>
                  {doc.status}
                </span>
                <button onClick={() => handleDelete(doc.id)} className="text-mist-400 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Upload;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 text-xs rounded-md py-2 transition-colors",
        active ? "bg-signal-600/20 text-signal-400" : "text-mist-400 hover:text-mist-200"
      )}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}
