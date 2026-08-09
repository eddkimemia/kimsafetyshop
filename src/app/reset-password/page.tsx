"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

const field =
  "w-full rounded-xl border border-line bg-white px-3.5 py-3 pl-11 text-sm outline-none transition-all focus:border-safety-400 focus:ring-4 focus:ring-safety-500/10";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Reset failed");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface pb-20">
      <PageHeader
        bg="/images/hero/hero3.jpg"
        eyebrow="Account Security"
        title="Choose a New Password"
        subtitle="Set a fresh password for your KimSafety account."
      />

      <div className="mx-auto max-w-shell px-4 pt-8 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-line bg-white p-8 shadow-card">
            {done ? (
              <>
                <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </span>
                <h1 className="font-display text-2xl font-extrabold text-navy-900">Password updated</h1>
                <p className="mt-2 text-sm text-gray-500">
                  Your password has been changed. Sign in with your new password to continue.
                </p>
                <button
                  onClick={() => router.push("/login")}
                  className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy-900 text-sm font-bold text-white transition-colors hover:bg-safety-500"
                >
                  Go to sign in
                </button>
              </>
            ) : !token ? (
              <>
                <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
                  <ShieldCheck className="h-6 w-6 text-amber-600" />
                </span>
                <h1 className="font-display text-2xl font-extrabold text-navy-900">Link missing or expired</h1>
                <p className="mt-2 text-sm text-gray-500">
                  This page requires a reset link from the email we sent you. Request a fresh one below.
                </p>
                <Link
                  href="/forgot-password"
                  className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy-900 text-sm font-bold text-white transition-colors hover:bg-safety-500"
                >
                  Request a new link
                </Link>
              </>
            ) : (
              <>
                <h1 className="font-display text-2xl font-extrabold text-navy-900">Choose a new password</h1>
                <p className="mt-1 text-sm text-gray-500">At least 6 characters. Use a mix that&apos;s easy to remember.</p>

                {error && (
                  <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{error}</p>
                )}

                <form onSubmit={submit} className="mt-6 space-y-4">
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={show ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="New password"
                      className={field}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      aria-label={show ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy-900"
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={show ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="Confirm new password"
                      className={field}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy-900 text-sm font-bold text-white transition-colors hover:bg-safety-500 disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    {loading ? "Updating…" : "Update password"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
