"use client";

import { useEffect, useState } from "react";
import { Send, MailPlus, Loader2, X } from "lucide-react";
import { adminField } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

/**
 * "Send as Newsletter" button + dialog for the knowledge/blog editors.
 * Reuses /api/admin/newsletter/send so the broadcast is recorded in the
 * newsletter history exactly like a manual briefing.
 */
export function SendNewsletterButton({
  subject,
  body,
  disabledReason,
}: {
  subject: string;
  body: string;
  /** When set, the button is disabled with this tooltip. */
  disabledReason?: string;
}) {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState(subject);
  const [sending, setSending] = useState<"none" | "test" | "all">("none");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Keep subject in sync if the editor title changes before opening.
  useEffect(() => {
    if (!open) setEmailSubject(subject);
  }, [subject, open]);

  if (!isSuperAdmin) return null;

  const canSend = Boolean(emailSubject.trim()) && Boolean(body.trim()) && sending === "none" && !disabledReason;

  const doSend = async (test: boolean) => {
    setSending(test ? "test" : "all");
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: emailSubject.trim(), body, test }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Send failed");
      setNotice(
        test
          ? `Test email sent to ${json.firstRecipient ?? "the first subscriber"}.`
          : `Broadcast sent — ${json.sent}/${json.total} delivered${json.failed ? `, ${json.failed} failed` : ""}.`
      );
      if (!test) setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending("none");
    }
  };

  const blockedTooltip = disabledReason || (body.trim() ? undefined : "Save some body content first");

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setNotice(null);
          setError(null);
        }}
        disabled={Boolean(blockedTooltip)}
        title={blockedTooltip ?? "Email this content to newsletter subscribers"}
        className="flex items-center gap-2 rounded-xl border border-safety-300 bg-safety-50 px-4 py-3 text-sm font-bold text-safety-700 transition-colors hover:bg-safety-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send className="h-4 w-4" /> <span className="hidden lg:inline">Send as Newsletter</span>
        <span className="lg:hidden">Newsletter</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="font-display text-lg font-extrabold text-navy-900">Send as Newsletter</h2>
                <p className="mt-0.5 text-sm text-gray-500">The saved content is emailed as-is — save your changes first.</p>
              </div>
              <button onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-gray-500 hover:bg-surface" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-bold text-gray-500">Email subject *</span>
              <input
                className={adminField}
                value={emailSubject}
                maxLength={150}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Subject subscribers will see"
              />
            </label>

            {notice && (
              <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
                <MailPlus className="h-4 w-4 shrink-0" /> {notice}
              </p>
            )}
            {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">{error}</p>}

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => doSend(true)}
                disabled={!canSend}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-xs font-bold text-gray-500 transition-colors hover:text-navy-900 disabled:opacity-50"
                )}
                title="Send a copy to the first subscriber"
              >
                {sending === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailPlus className="h-4 w-4" />}
                {sending === "test" ? "Sending test…" : "Send test"}
              </button>
              <button
                type="button"
                onClick={() => doSend(false)}
                disabled={!canSend}
                className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-safety-500 disabled:opacity-60"
              >
                {sending === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending === "all" ? "Sending…" : "Send to subscribers"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
