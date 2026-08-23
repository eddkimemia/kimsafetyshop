"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, CircleAlert, Loader2, MailCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

function VerifyInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<"verifying" | "done" | "error">("verifying");
  const [message, setMessage] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("This page needs the verification link from the email we sent you.");
      return;
    }
    // StrictMode double-invokes effects in dev — guard against double POSTs.
    if (ran.current) return;
    ran.current = true;
    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error ?? "Verification failed");
        setState("done");
      })
      .catch((err: unknown) => {
        setState("error");
        setMessage(err instanceof Error ? err.message : "Verification failed. Please try again.");
      });
  }, [token]);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-line bg-white p-8 text-center shadow-card">
        {state === "verifying" && (
          <>
            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-safety-50">
              <Loader2 className="h-6 w-6 animate-spin text-safety-600" />
            </span>
            <h1 className="font-display text-2xl font-extrabold text-navy-900">Verifying your email…</h1>
            <p className="mt-2 text-sm text-gray-500">Just a moment — confirming your email address.</p>
          </>
        )}
        {state === "done" && (
          <>
            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </span>
            <h1 className="font-display text-2xl font-extrabold text-navy-900">Email verified</h1>
            <p className="mt-2 text-sm text-gray-500">
              Your email address is confirmed and your account is fully active. Sign in to start shopping.
            </p>
            <Link
              href="/login"
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy-900 text-sm font-bold text-white transition-colors hover:bg-safety-500"
            >
              Sign in to your account
            </Link>
          </>
        )}
        {state === "error" && (
          <>
            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
              <CircleAlert className="h-6 w-6 text-danger" />
            </span>
            <h1 className="font-display text-2xl font-extrabold text-navy-900">
              <MailCheck className="mr-1 inline h-5 w-5" /> Link problem
            </h1>
            <p className="mt-2 text-sm text-gray-500">{message}</p>
            <Link
              href="/register"
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy-900 text-sm font-bold text-white transition-colors hover:bg-safety-500"
            >
              Back to registration
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="bg-surface pb-20">
      <PageHeader
        bg="/images/hero/hero3.jpg"
        eyebrow="Account"
        title="Email Verification"
        subtitle="Confirm your email address to activate your KimSafety account."
      />
      <div className="mx-auto max-w-shell px-4 pt-8 lg:px-8">
        <Suspense>
          <VerifyInner />
        </Suspense>
      </div>
    </div>
  );
}
