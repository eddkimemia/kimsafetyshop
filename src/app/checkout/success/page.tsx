"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Download, Loader2, CircleAlert, Lock, Receipt } from "lucide-react";
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

  // Paystack appends "?reference=…&trxref=…" to the callback_url, which
  // corrupts URLs that already carry their own query string:
  //   …?order=KS-1&token=abc?reference=ks_x&trxref=ks_x
  // The token value then swallows the appended fragment. Strip anything from
  // a stray ?/# onwards so verification and the invoice/track links work.
  const cleanToken = token?.split(/[?#]/)[0] ?? null;

  const [status, setStatus] = useState<"checking" | "paid" | "pending" | "error">("checking");
  const [message, setMessage] = useState<string | null>(null);
  const [payment, setPayment] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Card payment returning from Paystack: verify against the reference this
    // server stored at initiation time (the echoed URL reference is optional
    // — see /api/payments/paystack/verify).
    if (orderId && cleanToken) {
      let pollTimer: ReturnType<typeof setInterval> | null = null;
      let polls = 0;
      (async () => {
        try {
          const res = await fetch("/api/payments/paystack/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, token: cleanToken, ...(reference ? { reference } : {}) }),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json.error ?? "Verification failed");
          if (!cancelled) {
            setStatus(json.paid ? "paid" : "pending");
            setPayment("card");
          }
          // Not confirmed yet: the webhook may still be in flight. Poll the
          // order status for ~90s before showing the retry UI.
          if (!json.paid) {
            pollTimer = setInterval(async () => {
              polls++;
              try {
                const r = await fetch(`/api/orders/status?orderId=${encodeURIComponent(orderId)}&token=${encodeURIComponent(cleanToken)}`, { cache: "no-store" });
                const j = await r.json();
                if (cancelled) return;
                setPayment(j.payment ?? "card");
                if (j.paid === 1) {
                  setStatus("paid");
                  if (pollTimer) clearInterval(pollTimer);
                } else if (polls > 18 && pollTimer) {
                  clearInterval(pollTimer);
                }
              } catch {
                /* transient network error — keep polling */
              }
            }, 5000);
          }
        } catch (err) {
          if (!cancelled) {
            setStatus("error");
            setMessage(err instanceof Error ? err.message : "We could not verify your payment. Contact us on WhatsApp if it was deducted.");
          }
        }
      })();
      return () => {
        cancelled = true;
        if (pollTimer) clearInterval(pollTimer);
      };
    }

    // M-Pesa: the confirmation arrives asynchronously via the Safaricom
    // callback, so POLL the order status until it flips to paid (or ~3 min).
    // Previously this ran once — a successful payment was never reflected
    // without a manual refresh.
    let timer: ReturnType<typeof setInterval> | null = null;
    let attempts = 0;
    const poll = async () => {
      if (!orderId || !cleanToken) return;
      attempts++;
      try {
        const r = await fetch(`/api/orders/status?orderId=${encodeURIComponent(orderId)}&token=${encodeURIComponent(cleanToken)}`, { cache: "no-store" });
        const j = await r.json();
        if (cancelled) return;
        setStatus(j.paid === 1 ? "paid" : "pending");
        setPayment(j.payment ?? null);
        if ((j.paid === 1 || attempts > 36) && timer) clearInterval(timer);
      } catch {
        /* transient network error — keep polling */
      }
    };
    poll();
    timer = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [orderId, cleanToken, reference]);

  const retryCard = async () => {
    if (retrying || !orderId || !cleanToken) return;
    setRetrying(true);
    setRetryError(null);
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, token: cleanToken }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Payment could not be started");
      if (json.method === "card" && json.authorizationUrl) {
        window.location.assign(json.authorizationUrl);
      }
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : "Payment could not be started. Contact us on WhatsApp for help.");
    } finally {
      setRetrying(false);
    }
  };

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
      {status === "pending" && payment === "card" && (
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-5 text-left shadow-card">
          <p className="text-sm font-bold text-navy-900">Card payment not completed</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">
            The payment wasn&apos;t confirmed, so your order is still unpaid. Try again — you&apos;ll be redirected to
            Paystack&apos;s secure payment page.
          </p>
          <div className="mt-3">
            <button
              onClick={retryCard}
              disabled={retrying}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-safety-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {retrying ? "Starting payment…" : "Retry card payment"}
            </button>
            {retryError && <p className="mt-2 text-center text-xs font-semibold text-danger">{retryError}</p>}
          </div>
        </div>
      )}
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {orderId && (
          <a
            href={`/api/orders/${encodeURIComponent(orderId)}/invoice?token=${encodeURIComponent(cleanToken ?? "")}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-xs font-bold text-navy-900 hover:bg-surface"
          >
            <Download className="h-3.5 w-3.5" /> Download Invoice
          </a>
        )}
        {/* Official receipt only exists once payment is confirmed. */}
        {orderId && status === "paid" && (
          <a
            href={`/api/orders/${encodeURIComponent(orderId)}/receipt?token=${encodeURIComponent(cleanToken ?? "")}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
          >
            <Receipt className="h-3.5 w-3.5" /> Download Receipt
          </a>
        )}
        {orderId && cleanToken && (
          <Link
            href={`/track?id=${encodeURIComponent(orderId)}&token=${encodeURIComponent(cleanToken)}`}
            className="rounded-xl border border-line bg-white px-7 py-3.5 text-sm font-bold text-navy-900 hover:bg-surface"
          >
            Track Order
          </Link>
        )}
        <Link href="/search" className="rounded-xl border border-line bg-white px-7 py-3.5 text-sm font-bold text-navy-900 hover:bg-surface">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
