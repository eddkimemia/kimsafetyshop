"use client";

import { useState, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Lock, LogIn, Mail } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { useSettings } from "@/lib/settings";

const field =
  "w-full rounded-xl border border-line bg-white px-3.5 py-3 pl-11 text-sm outline-none transition-all focus:border-safety-400 focus:ring-4 focus:ring-safety-500/10";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
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
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password. Please try again.");
      return;
    }
    const session = await getSession();
    const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin";
    const isAdminPage = callbackUrl.startsWith("/admin");
    router.push(isAdmin ? (isAdminPage ? callbackUrl : "/admin") : callbackUrl);
    router.refresh();
  };

  return (
    <div className="bg-surface pb-20">
      <PageHeader
        bg="/images/hero/hero3.jpg"
        eyebrow="Customer Portal"
        title="Welcome Back"
        subtitle="Sign in to track orders, request quotes and manage your KimSafety account."
      />

      <div className="mx-auto max-w-shell px-4 pt-8 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-line bg-white p-8 shadow-card">
            <h1 className="font-display text-2xl font-extrabold text-navy-900">Welcome back</h1>
            <p className="mt-1 text-sm text-gray-500">Enter your credentials to continue.</p>

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

            <p className="mt-6 text-center text-sm text-gray-500">
              New to KimSafety?{" "}
              <Link href="/register" className="font-bold text-safety-600 hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Hello! I have a question.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-[#25D366]"
          >
            <WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366]" />
            Questions? Chat with us on WhatsApp — replies within the hour.
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
