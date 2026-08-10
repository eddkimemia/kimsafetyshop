"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Check,
  FileText,
  Percent,
  ShieldCheck,
  Truck,
  Users,
  ArrowRight,
  Wallet,
  Package,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

const perks = [
  {
    icon: Percent,
    title: "Negotiated pricing",
    text: "Lock in contracted rates across your whole catalogue with tiered volume discounts up to 30%.",
  },
  {
    icon: Wallet,
    title: "Flexible payment",
    text: "Monthly credit terms, purchase orders and consolidated monthly invoicing for approved firms.",
  },
  {
    icon: Users,
    title: "Dedicated account manager",
    text: "One contact who knows your sites, your standards and your deadlines — WhatsApp-first response.",
  },
  {
    icon: FileText,
    title: "Tender-ready documentation",
    text: "Certificates, tax invoices, ETR receipts and compliance files prepared for every order.",
  },
  {
    icon: Truck,
    title: "Project delivery schedules",
    text: "Stock reservation and scheduled site deliveries — to Mombasa, Eldoret, Kisumu and beyond.",
  },
  {
    icon: ShieldCheck,
    title: "Quality assurance",
    text: "Every batch quality-inspected with certificates of conformance on file for your audits.",
  },
];

export default function CorporatePage() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docs, setDocs] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    company: "",
    kra_pin: "",
    industry: "",
    contact_name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const field =
    "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none transition-all focus:border-safety-400 focus:ring-4 focus:ring-safety-500/10";
  const errField =
    "w-full rounded-xl border border-danger bg-white px-3.5 py-3 text-sm outline-none transition-all focus:border-danger focus:ring-4 focus:ring-danger/10";

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  };
  const fieldCls = (k: string) => (errors[k] ? errField : field);
  const errMsg = (k: string) =>
    errors[k] ? <p className="text-xs font-semibold text-danger">{errors[k]}</p> : null;

  const continueToContact = () => {
    const errs: Record<string, string> = {};
    if (!form.company.trim()) errs.company = "Company legal name is required";
    if (!form.kra_pin.trim()) errs.kra_pin = "KRA PIN is required";
    else if (!/^[A-Z0-9]{9,12}$/i.test(form.kra_pin.trim())) errs.kra_pin = "Enter a valid KRA PIN, e.g. A123456789X";
    if (!form.industry) errs.industry = "Industry is required";
    setErrors(errs);
    if (Object.keys(errs).length === 0) setStep(1);
  };

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const res = await fetch("/api/uploads/documents", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setDocs((prev) => [...prev, ...(json.urls as string[])]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.contact_name.trim()) errs.contact_name = "Contact person full name is required";
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    else if (!/^(\+?\d{9,13})$/.test(form.phone.replace(/[\s-]/g, ""))) errs.phone = "Enter a valid phone number";
    if (!form.email.trim()) errs.email = "Work email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Enter a valid email address";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/corporate/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, documents: docs }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Submission failed");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <PageHeader
        bg="/images/hero/hero3.jpg"
        eyebrow={
          <>
            <Building2 className="h-3.5 w-3.5" /> KimSafety Corporate Portal
          </>
        }
        title="Procurement built for Kenyan organizations"
        subtitle="Hospitals, factories, contractors, schools, government agencies and NGOs — one supplier, one invoice, zero headaches. Join 1,200+ organizations that procure with KimSafety."
      >
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/quote"
            className="inline-flex items-center gap-2 rounded-xl bg-safety-500 px-8 py-4 text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(245,124,0,0.4)] transition-colors hover:bg-safety-600"
          >
            Request Corporate Quotation <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#apply"
            className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-8 py-4 text-[15px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
          >
            Open Corporate Account
          </a>
        </div>
        <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-white/10 pt-8 sm:grid-cols-4">
          {[
            ["1,200+", "Active clients"],
            ["47/47", "Counties served"],
            ["30%", "Max bulk discount"],
            ["4 hrs", "Quote response time"],
          ].map(([value, label]) => (
            <div key={label}>
              <dt className="font-display text-2xl font-extrabold text-white">{value}</dt>
              <dd className="text-xs text-white/50">{label}</dd>
            </div>
          ))}
        </dl>
      </PageHeader>

      <section className="bg-surface py-16 lg:py-20">
        <div className="mx-auto max-w-shell px-4 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-navy-900">
              Everything your procurement team needs
            </h2>
            <p className="mt-3 text-sm text-gray-500">
              Built for the way Kenyan organizations actually buy — quotes, tenders, approvals and invoices.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {perks.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-line bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-cardHover"
              >
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-safety-50 text-safety-600">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="font-display text-base font-extrabold text-navy-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-shell px-4 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-navy-900">
                How corporate onboarding works
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                From first quotation to an approved account in under 48 hours.
              </p>
              <ol className="mt-8 space-y-6">
                {[
                  ["Submit company details", "Share your KRA PIN, industry and annual volume — we respond within 4 business hours."],
                  ["Receive negotiated pricing", "Your account manager sends a custom price list with tiered volume discounts."],
                  ["Place orders your way", "Online, WhatsApp, phone or purchase order — with approvals for your team."],
                  ["Monthly consolidated invoice", "One tax invoice for the month, paid on credit terms."],
                ].map(([title, text], i) => (
                  <li key={title} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-900 font-display text-sm font-extrabold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-display text-base font-extrabold text-navy-900">{title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div id="apply" className="rounded-3xl border border-line bg-surface p-8 shadow-card lg:p-10">
              {done ? (
                <div className="py-10 text-center">
                  <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                    <Check className="h-8 w-8 text-emerald-600" />
                  </span>
                  <h3 className="font-display text-xl font-extrabold text-navy-900">Application received</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                    Our corporate team will review your application and documents, then call you within 4 business hours to finalize your account and pricing.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="font-display text-xl font-extrabold text-navy-900">Open a corporate account</h3>
                  <p className="mt-1 text-sm text-gray-500">Free to join · No minimum order to register</p>
                  <form onSubmit={submit} className="mt-6 space-y-3.5">
                    {step === 0 ? (
                      <>
                        <div className="space-y-1.5">
                          <input required placeholder="Company legal name *" className={fieldCls("company")} value={form.company} onChange={set("company")} />
                          {errMsg("company")}
                        </div>
                        <div className="space-y-1.5">
                          <input required placeholder="KRA PIN *" className={fieldCls("kra_pin")} value={form.kra_pin} onChange={set("kra_pin")} />
                          {errMsg("kra_pin")}
                        </div>
                        <div className="space-y-1.5">
                          <select required className={fieldCls("industry")} value={form.industry} onChange={set("industry")}>
                            <option value="" disabled>Industry *</option>
                            {["Hospital / Clinic", "Construction", "Manufacturing", "School / University", "Government", "NGO", "Hotel / Hospitality", "Other"].map((i) => (
                              <option key={i}>{i}</option>
                            ))}
                          </select>
                          {errMsg("industry")}
                        </div>
                        <div>
                          <p className="mb-1.5 text-xs font-bold text-navy-900">
                            Company documents <span className="font-normal text-gray-400">(certificate of incorporation, KRA PIN certificate, etc.)</span>
                          </p>
                          <label
                            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-white px-4 py-4 text-xs font-bold text-gray-500 transition-colors hover:border-safety-400 hover:text-safety-600"
                          >
                            <Upload className="h-4 w-4" />
                            {uploading ? "Uploading…" : "Upload documents (PDF, JPG, PNG — max 10MB each)"}
                            <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" className="sr-only" onChange={onFiles} disabled={uploading} />
                          </label>
                          {docs.length > 0 && (
                            <ul className="mt-2 space-y-1.5">
                              {docs.map((url) => (
                                <li key={url} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs text-gray-600">
                                  <FileText className="h-3.5 w-3.5 shrink-0 text-safety-600" />
                                  <span className="min-w-0 flex-1 truncate">{url.split("/").pop()}</span>
                                  <button
                                    type="button"
                                    onClick={() => setDocs((prev) => prev.filter((d) => d !== url))}
                                    aria-label="Remove document"
                                    className="text-gray-400 transition-colors hover:text-danger"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-4 pt-2">
                          <Link
                            href="/corporate/purchase"
                            className="text-xs font-bold text-gray-400 transition-colors hover:text-navy-900"
                          >
                            Have a PO already? <span className="text-safety-600">Submit it here →</span>
                          </Link>
                          <button
                            type="button"
                            onClick={continueToContact}
                            className="rounded-xl bg-navy-900 px-7 py-3 text-sm font-bold text-white hover:bg-navy-800"
                          >
                            Continue
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <input required placeholder="Contact person full name *" className={fieldCls("contact_name")} value={form.contact_name} onChange={set("contact_name")} />
                          {errMsg("contact_name")}
                        </div>
                        <div className="space-y-1.5">
                          <input required type="tel" placeholder="Phone (WhatsApp) *" className={fieldCls("phone")} value={form.phone} onChange={set("phone")} />
                          {errMsg("phone")}
                        </div>
                        <div className="space-y-1.5">
                          <input required type="email" placeholder="Work email *" className={fieldCls("email")} value={form.email} onChange={set("email")} />
                          {errMsg("email")}
                        </div>
                        <textarea placeholder="Estimated annual purchase volume & key products (optional)" rows={3} className={field} value={form.notes} onChange={set("notes")} />
                        {error && (
                          <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{error}</p>
                        )}
                        <div className="flex items-center justify-between gap-4 pt-2">
                          <button type="button" onClick={() => setStep(0)} className="text-xs font-bold text-gray-400 hover:text-navy-900">
                            ← Back
                          </button>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-2 rounded-xl bg-safety-500 px-7 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(245,124,0,0.35)] transition-colors hover:bg-safety-600 disabled:opacity-60"
                          >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                            {submitting ? "Submitting…" : "Submit Application"}
                          </button>
                        </div>
                      </>
                    )}
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
