"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PackageSearch, Loader2, Check, CircleAlert, Lock, Truck, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export default function TrackPage() {
  return (
    <Suspense>
      <TrackInner />
    </Suspense>
  );
}

type TrackInfo = {
  orderId: string;
  payment: string;
  paid: number;
  status: string;
  mpesaPushCount: number;
  mpesaLastResult: string | null;
  mpesaLastResultDesc: string | null;
  transactionId: string | null;
  canResend: boolean;
  retryAfterMs: number;
};

const STATUS_STEPS = ["Processing", "In transit", "Delivered"];

function TrackInner() {
  const params = useSearchParams();
  const id = params.get("id") ?? params.get("orderId") ?? "";
  const token = params.get("token") ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<TrackInfo | null>(null);

  useEffect(() => {
    if (!id || !token) {
      setLoading(false);
      setError("Enter your order number and token from your confirmation email to track it.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/orders/status?orderId=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`);
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Order not found");
        if (!cancelled) {
          setInfo(j);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load your order");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  const paymentLabel: Record<string, string> = {
    mpesa: "M-Pesa",
    card: "Card (Paystack)",
    po: "Purchase Order",
  };

  return (
    <div className="bg-surface pb-24">
      <PageHeader
        bg="/images/hero/hero1.jpg"
        eyebrow={<PackageSearch className="h-3.5 w-3.5" />}
        title="Track your order"
        subtitle="No account needed — use the order number and code from your confirmation email."
      />

      <div className="mx-auto max-w-2xl px-4 pt-8">
        {!id || !token ? (
          <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card">
            <CircleAlert className="mx-auto h-8 w-8 text-safety-500" />
            <h2 className="mt-3 font-display text-lg font-extrabold text-navy-900">Missing tracking details</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Your order confirmation email contains a <strong>Track Order</strong> link with your
              order number and code. Open that link, or sign in to{" "}
              <Link href="/account" className="font-bold text-safety-600 hover:underline">your account</Link>{" "}
              to see all your orders.
            </p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center rounded-2xl border border-line bg-white py-16 shadow-card">
            <Loader2 className="h-8 w-8 animate-spin text-safety-500" />
            <p className="mt-3 text-sm font-semibold text-gray-500">Looking up your order…</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-line bg-white p-8 text-center shadow-card">
            <CircleAlert className="mx-auto h-8 w-8 text-danger" />
            <h2 className="mt-3 font-display text-lg font-extrabold text-navy-900">Order not found</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{error}</p>
            <p className="mt-4 text-xs text-gray-400">
              Need help? WhatsApp us on{" "}
              <a href="https://wa.me/254715135141" className="font-bold text-safety-600 hover:underline">+254 715 135 141</a>
            </p>
          </div>
        ) : info ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Order</p>
                  <h2 className="font-display text-xl font-extrabold text-navy-900">{info.orderId}</h2>
                </div>
                <span
                  className={
                    info.paid === 1
                      ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"
                      : "inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700"
                  }
                >
                  {info.paid === 1 ? <Check className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  {info.paid === 1 ? "Paid" : "Payment due"}
                </span>
              </div>

              <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-surface p-4">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Status</dt>
                  <dd className="mt-1 text-sm font-bold text-navy-900">{info.status}</dd>
                </div>
                <div className="rounded-xl bg-surface p-4">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Payment</dt>
                  <dd className="mt-1 text-sm font-bold text-navy-900">
                    {paymentLabel[info.payment] ?? info.payment}
                    {info.transactionId ? <span className="block text-xs font-normal text-gray-400">Ref {info.transactionId}</span> : null}
                  </dd>
                </div>
              </dl>

              <div className="mt-5">
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
                  {STATUS_STEPS.map((s) => (
                    <span key={s} className={info.status === s ? "text-safety-600" : ""}>
                      {s}
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex h-1.5 gap-1.5">
                  {STATUS_STEPS.map((s) => {
                    const idx = STATUS_STEPS.indexOf(s);
                    const reached = STATUS_STEPS.indexOf(info.status) >= idx;
                    return <span key={s} className={`h-full flex-1 rounded-full ${reached ? "bg-safety-500" : "bg-gray-200"}`} />;
                  })}
                </div>
                {info.status === "Cancelled" && (
                  <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-danger">This order was cancelled.</p>
                )}
              </div>
            </div>

            {info.paid !== 1 && (
              <div className="rounded-2xl border border-safety-200 bg-safety-50 p-6">
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-navy-900">
                  <Lock className="h-4 w-4 text-safety-600" /> Payment not yet received
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-gray-600">
                  You can complete the payment from the checkout confirmation screen — your link stays
                  valid until the order is settled.
                </p>
                <Link
                  href={`/checkout/success?order=${encodeURIComponent(info.orderId)}&token=${encodeURIComponent(token)}`}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-safety-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-safety-600"
                >
                  Pay or retry payment
                </Link>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3">
              <a
                href={`/api/orders/${encodeURIComponent(info.orderId)}/invoice`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-4 py-2 text-xs font-bold text-navy-900 hover:bg-surface"
              >
                <Download className="h-3.5 w-3.5" /> Download Invoice
              </a>
              <a
                href={`/checkout/success?order=${encodeURIComponent(info.orderId)}&token=${encodeURIComponent(token)}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-4 py-2 text-xs font-bold text-navy-900 hover:bg-surface"
              >
                <Truck className="h-3.5 w-3.5" /> Reopen confirmation
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}