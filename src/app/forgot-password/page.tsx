"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Mail } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

const field =
  "w-full rounded-xl border border-line bg-white px-3.5 py-3 pl-11 text-sm outline-none transition-all focus:border-safety-400 focus:ring-4 focus:ring-safety-500/10";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface pb-20">
      <PageHeader
        bg="/images/hero/hero3.jpg"
        eyebrow="Account Security"
        title="Forgot Password"
        subtitle="We'll email you a secure link to reset your password — for customers and staff."
      />

      <div className="mx-auto max-w-shell px-4 pt-8 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-line bg-white p-8 shadow-card">
            {done ? (
              <>
                <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </span>
                <h1 className="font-display text-2xl font-extrabold text-navy-900">Check your inbox</h1>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  If an account exists for <strong className="text-navy-900">{email}</strong>, a password
                  reset link is on its way. The link expires in 1 hour.
                </p>
                <Link
                  href="/login"
                  className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-navy-900 py-3 text-sm font-bold text-white transition-colors hover:bg-safety-500"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to sign in
                </Link>
              </>
            ) : (
              <>
                <h1 className="font-display text-2xl font-extrabold text-navy-900">Reset your password</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Enter the email you signed up with and we&apos;ll send you a reset link.
                </p>

                {error && (
                  <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{error}</p>
                )}

                <form onSubmit={submit} className="mt-6 space-y-4">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="Email address"
                      className={field}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy-900 text-sm font-bold text-white transition-colors hover:bg-safety-500 disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                    {loading ? "Sending…" : "Send reset link"}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                  Remembered it?{" "}
                  <Link href="/login" className="font-bold text-safety-600 hover:underline">
                    Back to sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}
