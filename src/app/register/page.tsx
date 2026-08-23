"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Building2, Eye, EyeOff, Loader2, Lock, Mail, MailCheck, Phone, User, Gift } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { useSettings } from "@/lib/settings";

const field =
  "w-full rounded-xl border border-line bg-white px-3.5 py-3 pl-11 text-sm outline-none transition-all focus:border-safety-400 focus:ring-4 focus:ring-safety-500/10";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterInner />
    </Suspense>
  );
}

function RegisterInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { whatsapp } = useSettings();
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    password: "",
    referral: params.get("ref") ?? "",
  });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [created, setCreated] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }
    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    // Show a "verify your email" step before entering the account.
    setCreated(true);
    setLoading(false);
  };

  if (created) {
    return (
      <div className="bg-surface pb-20">
        <PageHeader
          bg="/images/hero/hero2.jpg"
          eyebrow="Join KimSafety"
          title="Check Your Email"
          subtitle="One quick click and your account is fully active."
        />
        <div className="mx-auto max-w-shell px-4 pt-8 lg:px-8">
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-line bg-white p-8 text-center shadow-card">
              <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
                <MailCheck className="h-6 w-6 text-emerald-600" />
              </span>
              <h1 className="font-display text-2xl font-extrabold text-navy-900">Verify your email</h1>
              <p className="mt-2 text-sm text-gray-500">
                We sent a verification link to <strong className="text-navy-900">{form.email}</strong>. Tap it to
                activate your account — the link expires in 48 hours.
              </p>
              <p className="mt-3 rounded-xl bg-surface px-4 py-3 text-xs leading-relaxed text-gray-500">
                Didn&apos;t get it? Check your spam folder, or contact us on WhatsApp and we&apos;ll verify you
                manually.
              </p>
              <button
                onClick={() => {
                  router.push("/account");
                  router.refresh();
                }}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy-900 text-sm font-bold text-white transition-colors hover:bg-safety-500"
              >
                Continue to your account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface pb-20">
      <PageHeader
        bg="/images/hero/hero2.jpg"
        eyebrow="Join KimSafety"
        title="Create Your Account"
        subtitle="Register for bulk pricing, saved quotes, order tracking and faster checkout."
      />

      <div className="mx-auto max-w-shell px-4 pt-8 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-line bg-white p-8 shadow-card">
            <h1 className="font-display text-2xl font-extrabold text-navy-900">Create your account</h1>
            <p className="mt-1 text-sm text-gray-500">It takes less than a minute.</p>

            {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{error}</p>}

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input required placeholder="Full name *" className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
              </div>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input required type="email" placeholder="Email address *" className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input placeholder="Company (optional)" className={field} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} autoComplete="organization" />
                </div>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input required type="tel" placeholder="Phone number *" className={field} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
                </div>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  required
                  minLength={6}
                  type={show ? "text" : "password"}
                  placeholder="Password (min 6 characters) *"
                  className={field}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                <Gift className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  placeholder="Referral code (optional, e.g. KS-1234EDW)"
                  className={field}
                  value={form.referral}
                  onChange={(e) => setForm({ ...form, referral: e.target.value })}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy-900 text-sm font-bold text-white transition-colors hover:bg-safety-500 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-safety-600 hover:underline">
                Sign in
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
