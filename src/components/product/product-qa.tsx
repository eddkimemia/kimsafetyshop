"use client";

import { useEffect, useState } from "react";
import { HelpCircle, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { useSettings } from "@/lib/settings";

type QAItem = {
  id: string;
  name: string;
  question: string;
  answer: string | null;
  created_at: string;
};

const inputCls =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-safety-400 focus:ring-4 focus:ring-safety-500/10";

export function ProductQA({ productId }: { productId: string }) {
  const { whatsapp } = useSettings();
  const [items, setItems] = useState<QAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", question: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/questions?productId=${encodeURIComponent(productId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setItems(j.questions ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setDone(null);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, ...form }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Could not submit your question");
      setDone(j.message ?? "Thanks — our team will answer shortly.");
      setForm({ name: "", email: "", question: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your question");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading questions…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center">
          <HelpCircle className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-semibold text-navy-900">No questions yet</p>
          <p className="mt-1 text-xs text-gray-500">
            Be the first to ask about this product — our safety specialists reply within the hour.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-navy-900">{item.question}</p>
              </div>
              <p className="mt-1 text-[11px] font-medium text-gray-400">
                {item.name} · {new Date(item.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
              </p>
              {item.answer && (
                <div className="mt-3 rounded-xl bg-safety-50 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-safety-600">KimSafety answer</p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-700">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="rounded-2xl border border-line bg-surface p-6">
        <h3 className="text-sm font-bold text-navy-900">Ask a question about this product</h3>
        {done && <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{done}</p>}
        {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{error}</p>}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input required placeholder="Your name *" className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required type="email" placeholder="Email address *" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <textarea
          required
          maxLength={500}
          rows={3}
          placeholder="Your question — e.g. is this available in size XXL? (max 500 characters)"
          className={`${inputCls} mt-3 resize-none`}
          value={form.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
        />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" disabled={sending} className="gap-2">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? "Sending…" : "Submit Question"}
          </Button>
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`I have a question about ${productId}…`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            <WhatsAppIcon className="h-4 w-4 text-white" /> Ask on WhatsApp
          </a>
        </div>
      </form>
    </div>
  );
}