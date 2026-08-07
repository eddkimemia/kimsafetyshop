"use client";

import { useCallback, useEffect, useState } from "react";
import { Inbox, LifeBuoy, Lock, RotateCcw, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  user_name: string | null;
  user_email: string | null;
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

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-KE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadReplies = useCallback(async (id: string) => {
    const r = await fetch(`/api/admin/tickets?thread=${id}`);
    if (!r.ok) return;
    const d = await r.json();
    if (d.replies) setReplies((prev) => ({ ...prev, [id]: d.replies }));
  }, []);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/tickets");
    if (!r.ok) return;
    const d = await r.json();
    setTickets(d.tickets ?? []);
    for (const t of d.tickets ?? []) loadReplies(t.id);
    setLoading(false);
  }, [loadReplies]);

  useEffect(() => {
    load();
  }, [load]);

  const openTicket = async (id: string) => {
    setSelected(id);
    setReplyText("");
    if (!replies[id]) loadReplies(id);
  };

  const sendReply = async () => {
    if (!selected || !replyText.trim()) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected, message: replyText.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Could not send reply");
      setReplyText("");
      loadReplies(selected);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send reply");
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (id: string, status: string) => {
    const r = await fetch("/api/admin/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (r.ok) load();
  };

  const openTickets = tickets.filter((t) => t.status !== "Closed");
  const closedTickets = tickets.filter((t) => t.status === "Closed");
  const active = tickets.find((t) => t.id === selected) ?? null;

  return (
    <div className="mx-auto max-w-shell">
      <h1 className="font-display text-xl font-extrabold text-navy-900">Support tickets</h1>
      <p className="text-sm text-gray-500">
        {openTickets.length} open · {closedTickets.length} closed
      </p>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,380px)_1fr]">
        <div className="space-y-2">
          <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Open</p>
          {loading ? (
            <p className="py-6 text-center text-sm text-gray-400">Loading tickets…</p>
          ) : openTickets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line p-6 text-center">
              <Inbox className="mx-auto mb-2 h-6 w-6 text-gray-300" />
              <p className="text-xs text-gray-400">No open tickets</p>
            </div>
          ) : (
            openTickets.map((t) => (
              <button
                key={t.id}
                onClick={() => openTicket(t.id)}
                className={cn(
                  "w-full rounded-xl border p-3.5 text-left transition-colors",
                  selected === t.id ? "border-safety-400 bg-safety-50/60" : "border-line bg-white hover:bg-surface"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-navy-900">{t.subject}</p>
                  <span className="h-2 w-2 shrink-0 rounded-full bg-safety-500" />
                </div>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  {t.id} · {t.user_name ?? "Unknown"} · {fmt(t.created_at)}
                </p>
              </button>
            ))
          )}

          {closedTickets.length > 0 && (
            <>
              <p className="px-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Closed</p>
              {closedTickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openTicket(t.id)}
                  className={cn(
                    "w-full rounded-xl border border-line p-3.5 text-left opacity-60 transition-opacity hover:opacity-100",
                    selected === t.id && "border-safety-400 bg-safety-50/60"
                  )}
                >
                  <p className="truncate text-sm font-bold text-navy-900">{t.subject}</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    {t.id} · {t.user_name ?? "Unknown"} · {fmt(t.created_at)}
                  </p>
                </button>
              ))}
            </>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
          {!active ? (
            <div className="py-16 text-center text-gray-400">
              <LifeBuoy className="mx-auto mb-3 h-8 w-8" />
              <p className="text-sm">Select a ticket to view the conversation</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
                <div>
                  <h2 className="font-display text-lg font-extrabold text-navy-900">{active.subject}</h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {active.id} · {active.user_name ?? "Unknown user"} ·{" "}
                    <a href={`mailto:${active.user_email}`} className="font-semibold text-safety-600 hover:underline">
                      {active.user_email ?? "no email"}
                    </a>
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400">Opened {fmt(active.created_at)}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-bold",
                    active.status === "Open" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"
                  )}
                >
                  {active.status}
                </span>
              </div>

              <div className="max-h-[420px] space-y-3 overflow-y-auto py-4">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-surface px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{active.user_name ?? "Customer"}</p>
                  <p className="mt-1 text-sm text-navy-900">{active.message}</p>
                </div>
                {(replies[active.id] ?? []).map((r) => (
                  <div key={r.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-navy-900 px-4 py-3 text-white">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">{r.staff_name ?? "Support"}</p>
                      <p className="mt-1 text-sm">{r.message}</p>
                      <p className="mt-1 text-[10px] text-white/40">{fmt(r.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {error && <p className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-danger">{error}</p>}

              {active.status === "Open" ? (
                <div className="space-y-2.5 border-t border-line pt-4">
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Reply to the customer…"
                    className={inputCls}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={sendReply}
                      disabled={busy || !replyText.trim()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-safety-500 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-safety-600 disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" /> {busy ? "Sending…" : "Send reply"}
                    </button>
                    <button
                      onClick={() => setStatus(active.id, "Closed")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line px-5 py-2.5 text-xs font-bold text-navy-900 transition-colors hover:bg-surface"
                    >
                      <Lock className="h-3.5 w-3.5" /> Close ticket
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-line pt-4">
                  <button
                    onClick={() => setStatus(active.id, "Open")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line px-5 py-2.5 text-xs font-bold text-navy-900 transition-colors hover:bg-surface"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reopen ticket
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
