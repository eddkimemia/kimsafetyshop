"use client";

import { useState } from "react";
import { Send, Loader2, AlertCircle } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

export function BlogNewsletter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "blog" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not subscribe — please try again.");
      setSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not subscribe — please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-navy-900">
        <Send className="h-4.5 w-4.5 text-safety-500" /> Stay updated
      </h2>
      <p className="mt-1 text-xs text-gray-500">
        Safety news, product updates and compliance tips — straight to your inbox.
      </p>
      {subscribed ? (
        <p className="mt-3 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-700">
          You&apos;re on the list — welcome aboard!
        </p>
      ) : (
        <>
          <form className="mt-3 flex gap-2" onSubmit={submit}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2.5 text-xs outline-none transition-all focus:border-safety-400 focus:ring-4 focus:ring-safety-500/10"
            />
            <button
              type="submit"
              disabled={sending}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-navy-900 px-3.5 text-xs font-bold text-white transition-colors hover:bg-safety-500 disabled:opacity-70"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Join"}
            </button>
          </form>
          {error && (
            <p className="mt-2 flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-[11px] font-semibold text-danger">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
            </p>
          )}
        </>
      )}
      <p className="mt-2.5 flex items-center gap-1.5 text-[10px] text-gray-400">
        <WhatsAppIcon className="h-3 w-3" /> No spam — unsubscribe anytime.
      </p>
    </div>
  );
}
