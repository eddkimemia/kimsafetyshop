"use client";

import { useCallback, useEffect, useState } from "react";
import { LifeBuoy, MessageCircle, Plus, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type Reply = {
  id: string;
  user_id: string | null;
  staff_name: string | null;
  message: string;
  created_at: string;
};

const inputCls =
  "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none transition-all focus:border-safety-400 focus:ring-4 focus:ring-safety-500/10";

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

export function TicketsTab() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ subject: "", message: "" });
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replying, setReplying] = useState(false);

  const loadReplies = useCallback(async (ticketId: string) => {
    const r = await fetch(`/api/tickets/${ticketId}`);
    if (r.ok) {
      const d = await r.json();
      setReplies((prev) => ({ ...prev, [ticketId]: d.replies ?? [] }));
    }
  }, []);

  const load = useCallback(async () => {
    const r = await fetch("/api/tickets");
    if (r.ok) {
      const d = await r.json();
      setTickets(d.tickets ?? []);
      for (const t of d.tickets ?? []) loadReplies(t.id);
    }
    setLoading(false);
  }, [loadReplies]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const r = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Could not open ticket");
      setTickets([d.ticket, ...tickets]);
      setOpen(false);
      setForm({ subject: "", message: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open ticket");
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async (ticketId: string) => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const r = await fetch(`/api/tickets/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Could not send reply");
      setReplyText("");
      setReplyingTo(null);
      loadReplies(ticketId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send reply");
    } finally {
      setReplying(false);
    }
  };

  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-extrabold text-navy-900">Support tickets</h2>
          <p className="text-xs text-gray-400">We usually respond within 1 working day.</p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-navy-800"
        >
          {open ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {open ? "Cancel" : "Open ticket"}
        </button>
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-danger">{error}</p>}

      {open && (
        <div className="mb-6 rounded-2xl border border-safety-200 bg-safety-50/40 p-5">
          <div className="grid grid-cols-1 gap-3">
            <label className="block text-xs font-bold text-navy-900">
              Subject
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Where is my order KS-12345?"
                className={cn(inputCls, "mt-1.5")}
              />
            </label>
            <label className="block text-xs font-bold text-navy-900">
              Message
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Describe your question or issue — include your order or quote number if relevant."
                className={cn(inputCls, "mt-1.5")}
              />
            </label>
          </div>
          <button
            onClick={submit}
            disabled={saving || !form.subject.trim() || !form.message.trim()}
            className="mt-4 rounded-xl bg-safety-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-safety-600 disabled:opacity-50"
          >
            {saving ? "Opening…" : "Open ticket"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading tickets…</p>
      ) : tickets.length === 0 ? (
        <div className="py-8 text-center">
          <LifeBuoy className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">
            No tickets yet — need help with an order, quote or product? Open a ticket and we&apos;ll help.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => {
            const thread = replies[t.id] ?? [];
            return (
              <div key={t.id} className="overflow-hidden rounded-xl border border-line">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface/50 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-navy-900">{t.subject}</p>
                    <p className="text-[11px] text-gray-400">
                      {t.id} · opened {relativeTime(t.created_at)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-bold",
                      t.status === "Open" && "bg-amber-50 text-amber-700",
                      t.status === "Replied" && "bg-safety-50 text-safety-700",
                      t.status === "Closed" && "bg-gray-100 text-gray-500"
                    )}
                  >
                    {t.status}
                  </span>
                </div>
                <div className="space-y-3 px-4 py-4">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-surface px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">You</p>
                    <p className="mt-1 text-sm text-navy-900">{t.message}</p>
                  </div>
                  {thread.map((r) => {
                    const isStaff = r.user_id === null && r.staff_name;
                    return (
                      <div key={r.id} className={cn("max-w-[85%] rounded-2xl px-4 py-3", isStaff ? "bg-navy-900 text-white rounded-tr-sm" : "bg-safety-50 text-navy-900 rounded-tl-sm")}>
                        <p className={cn("text-[10px] font-bold uppercase tracking-wider", isStaff ? "text-white/50" : "text-safety-700")}>
                          {isStaff ? r.staff_name : "You"}
                        </p>
                        <p className="mt-1 text-sm">{r.message}</p>
                        <p className={cn("mt-1 text-[10px]", isStaff ? "text-white/40" : "text-gray-400")}>{relativeTime(r.created_at)}</p>
                      </div>
                    );
                  })}
                  {t.status !== "Closed" && (
                    <div>
                      {replyingTo === t.id ? (
                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type your reply…"
                            className={cn(inputCls, "border-safety-300")}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => sendReply(t.id)}
                              disabled={replying || !replyText.trim()}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-safety-500 px-4 py-2 text-xs font-bold text-white hover:bg-safety-600 disabled:opacity-50"
                            >
                              <Send className="h-3.5 w-3.5" /> {replying ? "Sending…" : "Send reply"}
                            </button>
                            <button onClick={() => { setReplyingTo(null); setReplyText(""); }} className="rounded-lg border border-line px-4 py-2 text-xs font-bold text-navy-900 hover:bg-surface">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setReplyingTo(t.id); setReplyText(""); setError(""); }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-safety-600 hover:text-safety-700"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Reply
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
