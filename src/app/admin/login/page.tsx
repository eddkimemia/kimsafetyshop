"use client";

import { useState, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Lock, LogIn, Mail, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { useSettings } from "@/lib/settings";

const field =
  "w-full rounded-xl border border-line bg-white px-3.5 py-3 pl-11 text-sm outline-none transition-all focus:border-safety-400 focus:ring-4 focus:ring-safety-500/10";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const { whatsapp } = useSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setLoading(false);
      setError("Invalid email or password. Please try again.");
      return;
    }
    // The session may take a moment to propagate after a successful sign-in.
    let session = await getSession();
    if (!session) {
      await new Promise((r) => setTimeout(r, 400));
      session = await getSession();
    }
    const role = session?.user?.role;
    if (!session) {
      setLoading(false);
      setError("Sign-in took too long. Please try again.");
      return;
    }
    // Customers get signed in but are not staff — send them to their account.
    if (role !== "admin" && role !== "superadmin") {
      setLoading(false);
      router.push("/account");
      return;
    }
    router.push(callbackUrl.startsWith("/admin") ? callbackUrl : "/admin");
    router.refresh();
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-navy-900 px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-safety-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-navy-700/60 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
            <Logo light />
          </div>
          <div>
            <p className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-safety-400">
              <ShieldCheck className="h-3.5 w-3.5" /> KimSafety Admin Panel
            </p>
            <h1 className="mt-1 font-display text-2xl font-extrabold text-white">Staff sign in</h1>
            <p className="mt-1 text-sm text-white/50">Use your staff account to manage the store.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white p-8 shadow-soft">
          {error && (
            <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{error}</p>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                placeholder="Work email"
                className={field}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type={show ? "text" : "password"}
                required
                placeholder="Password"
                className={field}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy-900 text-sm font-bold text-white transition-colors hover:bg-safety-500 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-safety-200 bg-safety-50 p-4">
            <p className="flex items-center gap-2 text-xs font-bold text-safety-700">
              <KeyRound className="h-4 w-4 shrink-0" /> Forgot your password?
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-safety-700/80">
              Request a reset link by email — staff accounts can reset their own password, so you&apos;re never
              locked out.
            </p>
            <Link
              href="/forgot-password"
              className="mt-2 inline-flex items-center gap-1 rounded-lg bg-navy-900 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-safety-500"
            >
              Reset my password <ArrowLeft className="h-3 w-3 rotate-180" />
            </Link>
          </div>

          <p className="mt-5 text-center text-xs text-gray-400">
            Not staff?{" "}
            <Link href="/login" className="font-bold text-safety-600 hover:underline">
              Customer sign in
            </Link>
          </p>
        </div>

        <a
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Hello! I need help signing in to the KimSafety admin panel.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center justify-center gap-1.5 text-xs text-white/40 transition-colors hover:text-[#25D366]"
        >
          <WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366]" />
          Locked out? WhatsApp support — replies within the hour.
        </a>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
