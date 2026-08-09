"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Download,
  Loader2,
  MailPlus,
  Send,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useFetch, AdminCard } from "@/components/admin/ui";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  source: string;
  status: string;
  unsubscribed_at: string | null;
  created_at: string;
};

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm outline-none transition-all focus:border-safety-400 focus:bg-white focus:ring-4 focus:ring-safety-500/10";

const plainText = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export default function AdminNewsletterPage() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((s) => {
        if (alive) setIsSuperAdmin(s?.user?.role === "superadmin");
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const { data, loading, refresh } = useFetch<{ subscribers: Subscriber[]; count: number }>("/api/admin/newsletter");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  const subscribers = useMemo(() => {
    const all = data?.subscribers ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (s) => s.email.toLowerCase().includes(q) || (s.name ?? "").toLowerCase().includes(q) || s.source.toLowerCase().includes(q)
    );
  }, [data, query]);

  const active = (data?.subscribers ?? []).filter((s) => s.status === "subscribed").length;

  const remove = async (s: Subscriber) => {
    if (!confirm(`Delete subscriber ${s.email}?`)) return;
    const res = await fetch(`/api/admin/newsletter?id=${encodeURIComponent(s.id)}`, { method: "DELETE" });
    setNotice(res.ok ? "Subscriber deleted." : "Delete failed");
    refresh();
  };

  const exportXlsx = () => {
    const rows = subscribers.map((s) => [
      s.email,
      s.name ?? "",
      s.source,
      s.status,
      s.created_at,
      s.unsubscribed_at ?? "",
    ]);
    const ws = XLSX.utils.aoa_to_sheet([
      ["Email", "Name", "Source", "Status", "Subscribed at", "Unsubscribed at"],
      ...rows,
    ]);
    ws["!cols"] = [{ wch: 34 }, { wch: 24 }, { wch: 12 }, { wch: 14 }, { wch: 24 }, { wch: 24 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Subscribers");
    XLSX.writeFile(wb, `kimsafety-subscribers-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const send = async (test: boolean) => {
    if (!subject.trim() || !plainText(body)) {
      setError("Subject and message are required");
      return;
    }
    setError(null);
    setNotice(null);
    if (test) setSendingTest(true);
    else setSending(true);
    try {
      const res = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, test }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Send failed");
      if (test) {
        setNotice(`Test email sent to ${json.firstRecipient ?? "the first subscriber"}.`);
      } else {
        setNotice(`Broadcast sent — ${json.sent}/${json.total} delivered${json.failed ? `, ${json.failed} failed` : ""}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {!isSuperAdmin && (
        <AdminCard title="Restricted">
          <p className="py-6 text-center text-sm text-gray-400">Only the super admin can manage the newsletter.</p>
        </AdminCard>
      )}
      {isSuperAdmin && (
        <>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-navy-900">Newsletter</h1>
            <p className="mt-1 text-sm text-gray-500">
              Subscribers from the homepage and blog forms. Compose a monthly briefing and send it by email.
            </p>
          </div>

          {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>}
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">{error}</p>}

      <AdminCard
        title="Send a briefing"
        subtitle="Uses SMTP — configure SMTP_HOST / SMTP_USER / SMTP_PASS in the environment or in Settings"
      >
        <div className="space-y-4">
          <input
            className={inputCls}
            placeholder="Subject — e.g. March safety briefing: new arrivals, standards changes"
            value={subject}
            maxLength={150}
            onChange={(e) => setSubject(e.target.value)}
          />
          <RichTextEditor value={body} onChange={setBody} />
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => send(false)}
              disabled={sending || sendingTest}
              className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Sending…" : `Send to ${active} subscriber${active === 1 ? "" : "s"}`}
            </button>
            <button
              onClick={() => send(true)}
              disabled={sending || sendingTest || active === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-xs font-bold text-gray-500 transition-colors hover:text-navy-900 disabled:opacity-60"
              title="Send a copy to the newest subscriber first"
            >
              {sendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailPlus className="h-4 w-4" />}
              {sendingTest ? "Sending test…" : "Send test"}
            </button>
          </div>
        </div>
      </AdminCard>

      <AdminCard
        title="Subscribers"
        action={
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-lg bg-safety-50 px-3 py-1.5 text-xs font-bold text-safety-700 sm:inline-flex">
              <Users className="h-3.5 w-3.5" /> {active} active
            </span>
            <button
              onClick={exportXlsx}
              disabled={subscribers.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-gray-500 transition-colors hover:text-navy-900 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </div>
        }
      >
        <input
          className={inputCls}
          placeholder="Search by email, name or source…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
        ) : subscribers.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">No subscribers yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-line/60 rounded-xl border border-line">
            {subscribers.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-navy-900">{s.email}</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">
                    {s.name || "—"} · {s.source} ·{" "}
                    {new Date(s.created_at).toLocaleString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {s.status === "subscribed" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      <XCircle className="h-3 w-3" /> Unsubscribed
                    </span>
                  )}
                  <button
                    onClick={() => remove(s)}
                    aria-label={`Delete ${s.email}`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
        </>
      )}
    </div>
  );
}
