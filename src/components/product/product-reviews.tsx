"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Star, Loader2, ShieldCheck } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RatingStars } from "@/components/ui/rating";
import { Badge, Button } from "@/components/ui/button";

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

const starInput = "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none transition-all focus:border-safety-400 focus:ring-4 focus:ring-safety-500/10";

export function ProductReviews({ product }: { product: Product }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<{ name?: string | null } | null>(null);
  const [canReview, setCanReview] = useState<boolean | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: "", text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = (eligible: boolean) => {
    fetch(`/api/reviews?product=${encodeURIComponent(product.id)}${eligible ? "&eligible=1" : ""}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.reviews)) setReviews(d.reviews);
        if (eligible) {
          setCanReview(d.canReview ?? null);
          setHasReviewed(Boolean(d.hasReviewed));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(false);
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => {
        const user = s?.user;
        if (user?.email || user?.name) {
          setSessionUser(user);
          load(true);
        } else {
          setSessionUser(null);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const summary = useMemo(() => {
    const list = reviews.filter((r) => r.rating >= 1 && r.rating <= 5);
    const avg = list.length > 0 ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;
    const count = list.length;
    const dist = [5, 4, 3, 2, 1].map((star) => {
      const n = list.filter((r) => r.rating === star).length;
      return { star, pct: count > 0 ? Math.round((n / count) * 100) : 0 };
    });
    return { avg, count, dist };
  }, [reviews]);

  const submit = async () => {
    setMsg(null);
    if (form.title.trim().length < 3) return setMsg({ ok: false, text: "Please add a short review title." });
    if (form.text.trim().length < 10) return setMsg({ ok: false, text: "Please write at least a sentence about the product." });
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, rating: form.rating, title: form.title.trim(), text: form.text.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Could not submit review");
      setOpen(false);
      setHasReviewed(true);
      setCanReview(false);
      setForm({ rating: 5, title: "", text: "" });
      setMsg({ ok: true, text: "Review submitted! It will appear here once approved by our team." });
      load(true);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Could not submit review" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWriteClick = () => {
    if (!sessionUser) {
      window.location.href = `/login?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : `/product/${product.slug}`)}`;
      return;
    }
    load(true);
    setOpen(true);
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="rounded-2xl border border-line p-6 text-center">
        {summary.count > 0 ? (
          <>
            <p className="font-display text-5xl font-extrabold text-navy-900">{summary.avg.toFixed(1)}</p>
            <RatingStars rating={summary.avg} size="md" className="mt-2 justify-center" />
            <p className="mt-1 text-xs text-gray-400">
              Based on {summary.count} {summary.count === 1 ? "review" : "reviews"}
            </p>
            <div className="mt-4 space-y-1.5 text-left text-xs">
              {summary.dist.map(({ star, pct }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-6 font-bold text-gray-500">{star}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-gray-400">{pct}%</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="font-display text-5xl font-extrabold text-gray-200">—</p>
            <RatingStars rating={0} size="md" className="mt-2 justify-center" />
            <p className="mt-1 text-xs text-gray-400">No reviews yet — be the first to review this product.</p>
          </>
        )}
        <Button variant="outline" className="mt-5 w-full" onClick={handleWriteClick}>
          Write a Review
        </Button>
      </div>

      <div className="space-y-4 lg:col-span-2">
        {msg && (
          <p className={cn("rounded-xl px-4 py-3 text-xs font-semibold", msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-danger")}>
            {msg.text}
          </p>
        )}

        {open && (
          <div className="rounded-2xl border border-safety-200 bg-safety-50/40 p-5">
            {canReview === false ? (
              <div className="text-center">
                <p className="text-sm font-bold text-navy-900">
                  {hasReviewed ? "You've already reviewed this product" : "Only verified purchasers can review"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {hasReviewed
                    ? "Your review is live on the site (once approved). Thanks for sharing your feedback!"
                    : "Reviews unlock after you place an order for this product. You can add a review from your account order history."}
                </p>
              </div>
            ) : (
              <>
                <p className="mb-2 text-sm font-bold text-navy-900">Rate this product</p>
                <div className="mb-3 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setForm({ ...form, rating: n })} aria-label={`${n} star${n === 1 ? "" : "s"}`}>
                      <Star className={cn("h-7 w-7", n <= form.rating ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
                    </button>
                  ))}
                </div>
                <input
                  placeholder="Review title — e.g. Excellent quality, exactly as certified"
                  className={cn(starInput, "mb-2.5")}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
                <textarea
                  placeholder="Share what you liked (or didn't) about the product…"
                  rows={4}
                  className={cn(starInput, "mb-2.5")}
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Verified purchase — reviews are moderated before publishing
                  </p>
                  <Button onClick={submit} disabled={submitting} size="sm">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                    {submitting ? "Submitting…" : "Submit Review"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">Loading reviews…</p>
        ) : reviews.length > 0 ? (
          reviews.map((r) => (
            <article key={r.id} className="rounded-2xl border border-line p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-navy-700 to-navy-900 text-xs font-bold text-white">
                    {r.user_name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-navy-900">{r.user_name}</p>
                    <p className="text-[11px] text-gray-400">
                      {new Date(r.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              <h3 className="mt-3 flex items-center gap-2 text-sm font-bold text-navy-900">
                {r.title} {r.verified === 1 && <Badge tone="success">Verified Purchase</Badge>}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{r.text}</p>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
            <Star className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-semibold text-navy-900">No reviews yet</p>
            <p className="mt-1 text-xs text-gray-500">
              Have you bought this product? Share your experience — it helps other buyers choose with confidence.
            </p>
          </div>
        )}

        {!sessionUser && (
          <p className="text-center text-xs text-gray-400">
            <Link href="/login" className="font-bold text-safety-600 hover:underline">
              Sign in
            </Link>{" "}
            to leave a review — only verified purchasers can write one.
          </p>
        )}
      </div>
    </div>
  );
}
