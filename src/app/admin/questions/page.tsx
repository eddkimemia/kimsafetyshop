"use client";

import { useMemo, useState } from "react";
import { MessagesSquare } from "lucide-react";
import { useFetch, AdminCard } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

type Question = {
  id: string;
  product_id: string;
  name: string;
  email: string;
  question: string;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
};

export default function AdminQuestionsPage() {
  const { data, loading, refresh } = useFetch<{ questions: Question[] }>("/api/admin/questions");
  const [filter, setFilter] = useState<"all" | "unanswered" | "answered">("all");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const rows = useMemo(() => {
    const all = data?.questions ?? [];
    if (filter === "unanswered") return all.filter((q) => !q.answer);
    if (filter === "answered") return all.filter((q) => q.answer);
    return all;
  }, [data, filter]);

  const answer = async (q: Question) => {
    const text = answers[q.id]?.trim();
    if (!text) {
      setNotice("Type an answer before submitting.");
      return;
    }
    setBusy(q.id);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: q.id, answer: text }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Failed to save answer");
      setNotice(`Answer published for ${q.id} — it now shows on the product page.`);
      setAnswers((a) => ({ ...a, [q.id]: "" }));
      refresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to save answer");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (q: Question) => {
    setBusy(q.id);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/questions?id=${encodeURIComponent(q.id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete question");
      setNotice(`Question ${q.id} deleted.`);
      refresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to delete question");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold text-navy-900">
            <MessagesSquare className="h-6 w-6 text-safety-500" /> Product Q&amp;A
          </h1>
          <p className="mt-1 text-sm text-gray-500">Customer questions from product pages — answered questions appear publicly.</p>
        </div>
        <div className="flex gap-1.5 rounded-xl border border-line bg-white p-1">
          {(["all", "unanswered", "answered"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-bold capitalize transition-colors",
                filter === f ? "bg-safety-500 text-white" : "text-gray-500 hover:bg-surface"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>
      )}

      <AdminCard title={`${rows.length} question${rows.length === 1 ? "" : "s"}`} subtitle="Unanswered questions are shown first.">
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">Loading questions…</p>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">No questions match this filter.</p>
        ) : (
          <div className="space-y-4">
            {rows.map((q) => (
              <div key={q.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-navy-900">
                      {q.name} <span className="font-normal text-gray-400">· {q.email}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {q.id} · product {q.product_id} · {new Date(q.created_at).toLocaleDateString("en-KE")}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                      q.answer ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    )}
                  >
                    {q.answer ? "Answered" : "Unanswered"}
                  </span>
                </div>
                <p className="mt-3 rounded-lg bg-surface px-4 py-3 text-sm text-navy-900">“{q.question}”</p>
                {q.answer && (
                  <p className="mt-2 rounded-lg bg-emerald-50/60 px-4 py-3 text-sm text-gray-700">
                    <strong className="text-emerald-700">Answer: </strong>{q.answer}
                  </p>
                )}
                {!q.answer && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <textarea
                      rows={2}
                      placeholder="Write the public answer…"
                      value={answers[q.id] ?? ""}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                      className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-safety-400"
                    />
                    <button
                      onClick={() => answer(q)}
                      disabled={busy === q.id}
                      className="shrink-0 rounded-lg bg-safety-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-safety-600 disabled:opacity-50"
                    >
                      {busy === q.id ? "Saving…" : "Publish answer"}
                    </button>
                    <button
                      onClick={() => remove(q)}
                      disabled={busy === q.id}
                      className="shrink-0 rounded-lg border border-line px-4 py-2 text-xs font-bold text-gray-500 transition-colors hover:text-danger disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}