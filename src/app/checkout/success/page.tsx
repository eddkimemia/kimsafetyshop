"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Download, Loader2, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <CheckoutSuccessInner />
    </Suspense>
  );
}

function CheckoutSuccessInner() {
  const params = useSearchParams();
  const orderId = params.get("order");
  const token = params.get("token");
  const reference = params.get("reference");

  const [status, setStatus] = useState<"checking" | "paid" | "pending" | "error">("checking");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      // Card payment returning from Paystack: verify the transaction first.
      if (reference && orderId && token) {
        try {
          const res = await fetch("/api/payments/paystack/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, token, reference }),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json.error ?? "Verification failed");
          if (!cancelled) {
            setStatus(json.paid ? "paid" : "pending");
          }
          return;
        } catch (err) {
          if (!cancelled) {
            setStatus("error");
            setMessage(err instanceof Error ? err.message : "We could not verify your payment. Contact us on WhatsApp if it was deducted.");
          }
          return;
        }
      }
      if (orderId && token) {
        try {
          const r = await fetch(`/api/orders/status?orderId=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}`);
          const j = await r.json();
          if (!cancelled) setStatus(j.paid === 1 ? "paid" : "pending");
        } catch {
          if (!cancelled) {
            setStatus("error");
            setMessage("We could not load your order. Check your email for the confirmation.");
          }
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [orderId, token, reference]);

  const paid = status === "paid";

  return (
    <div className="flex flex-col items-center gap-4 bg-surface px-4 py-24 text-center">
      <div className={cn("flex h-24 w-24 items-center justify-center rounded-full", paid ? "bg-emerald-50" : status === "checking" ? "bg-amber-50" : "bg-amber-50")}>
        {status === "checking" ? (
          <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
        ) : paid ? (
          <Check className="h-12 w-12 text-emerald-600" />
        ) : (
          <CircleAlert className="h-12 w-12 text-amber-500" />
        )}
      </div>
      <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-700">
        {orderId ? `Order #${orderId}` : "Order confirmation"}
      </span>
      <h1 className="font-display text-3xl font-extrabold text-navy-900">
        {status === "checking" ? "Confirming your payment…" : paid ? "Payment received — thank you!" : status === "error" ? "Something went wrong" : "Your order is placed"}
      </h1>
      <p className="max-w-md text-sm text-gray-500">
        {status === "checking"
          ? "Just a moment — we&apos;re confirming your payment with Paystack."
          : paid
            ? "Your order is confirmed and the invoice is marked PAID. You&apos;ll get a dispatch notification once it leaves our Nairobi warehouse."
            : status === "error"
              ? message
              : "Your order is placed but the payment is still pending. If you already paid, it may take a minute to confirm — or contact us on WhatsApp for help."}
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {orderId && (
          <a
            href={`/api/orders/${encodeURIComponent(orderId)}/invoice`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-xs font-bold text-navy-900 hover:bg-surface"
          >
            <Download className="h-3.5 w-3.5" /> Download Invoice
          </a>
        )}
        <Link href="/account" className="rounded-xl border border-line bg-white px-7 py-3.5 text-sm font-bold text-navy-900 hover:bg-surface">
          Track Order
        </Link>
        <Link href="/search" className="rounded-xl border border-line bg-white px-7 py-3.5 text-sm font-bold text-navy-900 hover:bg-surface">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
