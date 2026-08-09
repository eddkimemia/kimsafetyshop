"use client";

import { useMemo, useState } from "react";
import { Check, Eye, EyeOff, Pencil, Star, Trash2, X } from "lucide-react";
import { useFetch, AdminCard } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

type Review = {
  id: string;
  product_id: string;
  user_name: string;
  rating: number;
  title: string;
  text: string;
  status: string;
  verified: number;
  created_at: string;
};

const statusTone: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  hidden: "bg-gray-100 text-gray-500",
};

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("h-3.5 w-3.5", i < rating ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const { data, loading, refresh } = useFetch<{ reviews: Review[] }>("/api/admin/reviews");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "hidden">("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<Review | null>(null);
  const [form, setForm] = useState({ rating: 5, title: "", text: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reviews = useMemo(() => {
    const all = data?.reviews ?? [];
    return filter === "all" ? all : all.filter((r) => r.status === filter);
  }, [data, filter]);

  const patch = async (id: string, body: Record<string, unknown>) => {
    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    if (!res.ok) return false;
    refresh();
    return true;
  };

  const setStatus = async (r: Review, status: string) => {
    if (await patch(r.id, { status })) setNotice(`${r.user_name}'s review ${status === "approved" ? "approved" : status === "hidden" ? "hidden" : "returned to pending"}.`);
  };

  const remove = async (r: Review) => {
    if (!confirm(`Delete review by ${r.user_name}?`)) return;
    const res = await fetch(`/api/admin/reviews?id=${encodeURIComponent(r.id)}`, { method: "DELETE" });
    setNotice(res.ok ? "Review deleted." : "Delete failed");
    refresh();
  };

  const openEdit = (r: Review) => {
    setEditing(r);
    setForm({ rating: r.rating, title: r.title, text: r.text });
    setError("");
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (form.title.trim().length < 3) return setError("Title is too short");
    if (form.text.trim().length < 10) return setError("Review text is too short");
    setSaving(true);
    try {
      const ok = await patch(editing.id, { rating: form.rating, title: form.title.trim(), text: form.text.trim() });
      if (ok) {
        setEditing(null);
        setNotice("Review updated.");
      } else {
        setError("Could not save changes");
      }
    } finally {
      setSaving(false);
    }
  };

  const counts = useMemo(() => {
    const all = data?.reviews ?? [];
    return {
      all: all.length,
      pending: all.filter((r) => r.status === "pending").length,
      approved: all.filter((r) => r.status === "approved").length,
      hidden: all.filter((r) => r.status === "hidden").length,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">Product Reviews</h1>
          <p className="text-sm text-gray-500">
            {counts.all} reviews · {counts.pending} awaiting approval · only verified purchasers can submit
          </p>
        </div>
        <div className="flex gap-1.5">
          {(["all", "pending", "approved", "hidden"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg px-3.5 py-2 text-xs font-bold capitalize transition-colors",
                filter === f ? "bg-navy-900 text-white" : "border border-line bg-white text-gray-500 hover:text-navy-900"
              )}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>}

      <AdminCard title="Reviews">
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
        ) : reviews.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">No reviews {filter === "all" ? "yet" : `with status "${filter}"`}.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-navy-900">{r.title}</p>
                      <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", statusTone[r.status] ?? statusTone.pending)}>
                        {r.status}
                      </span>
                      {r.verified === 1 && (
                        <span className="rounded-full bg-safety-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-safety-700">
                          Verified purchase
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      {r.user_name} · product {r.product_id} · {new Date(r.created_at).toLocaleString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <Stars rating={r.rating} />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{r.text}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line/60 pt-3">
                  {r.status === "pending" && (
                    <button
                      onClick={() => setStatus(r, "approved")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                  )}
                  {r.status === "approved" ? (
                    <button
                      onClick={() => setStatus(r, "hidden")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-2 text-xs font-bold text-gray-500 transition-colors hover:text-navy-900"
                    >
                      <EyeOff className="h-3.5 w-3.5" /> Hide
                    </button>
                  ) : (
                    <button
                      onClick={() => setStatus(r, "approved")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-2 text-xs font-bold text-gray-500 transition-colors hover:text-navy-900"
                    >
                      <Eye className="h-3.5 w-3.5" /> Show
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(r)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-2 text-xs font-bold text-gray-500 transition-colors hover:text-navy-900"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => remove(r)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-2 text-xs font-bold text-danger transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4" role="dialog" aria-modal="true" aria-label="Edit review">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-extrabold text-navy-900">Edit review</h2>
              <button onClick={() => setEditing(null)} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg border border-line">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="mb-1.5 text-xs font-bold text-gray-500">Rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setForm({ ...form, rating: n })} aria-label={`${n} star${n === 1 ? "" : "s"}`}>
                      <Star className={cn("h-7 w-7", n <= form.rating ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <input
                  placeholder="Review title"
                  className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none transition-all focus:border-safety-400 focus:ring-4 focus:ring-safety-500/10"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
                <textarea
                  placeholder="Review text"
                  rows={4}
                  className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none transition-all focus:border-safety-400 focus:ring-4 focus:ring-safety-500/10"
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                />
                {error && <p className="text-xs font-semibold text-danger">{error}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditing(null)} className="rounded-xl border border-line px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-navy-900">
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-safety-500 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
