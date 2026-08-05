"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, FileText, Package, Upload, X, Loader2, Building2, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

const field =
  "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none transition-all focus:border-safety-400 focus:ring-4 focus:ring-safety-500/10";

export default function PurchaseOrderPage() {
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poFile, setPoFile] = useState<string | null>(null);
  const [form, setForm] = useState({
    company: "",
    contact_name: "",
    phone: "",
    email: "",
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onPoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/uploads/documents", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setPoFile((json.urls as string[])[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poFile) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, po_file: poFile }),
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
        title="Submit a purchase order"
        subtitle="Upload your company's purchase order and our team will confirm pricing and delivery within 4 business hours."
      />

      <section className="bg-surface py-16 lg:py-20">
        <div className="mx-auto max-w-2xl px-4 lg:px-8">
          {done ? (
            <div className="rounded-3xl border border-line bg-white p-8 text-center shadow-card lg:p-10">
              <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <Check className="h-8 w-8 text-emerald-600" />
              </span>
              <h2 className="font-display text-xl font-extrabold text-navy-900">Purchase order received</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                Our team will review your PO and confirm pricing and delivery within 4 business hours.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/corporate"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-900 px-6 py-3 text-sm font-bold text-white hover:bg-navy-800"
                >
                  Back to corporate portal <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/search"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-6 py-3 text-sm font-bold text-navy-900 transition-colors hover:border-safety-400 hover:text-safety-600"
                >
                  Browse the shop
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-line bg-white p-8 shadow-card lg:p-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-extrabold text-navy-900">Purchase order details</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Have a PO already? Upload it here — or{" "}
                    <Link href="/corporate" className="font-bold text-safety-600 hover:text-safety-700">
                      apply for a corporate account
                    </Link>{" "}
                    first for contracted pricing.
                  </p>
                </div>
              </div>

              <form onSubmit={submit} className="mt-6 space-y-3.5">
                <input required placeholder="Company legal name *" className={field} value={form.company} onChange={set("company")} />
                <input placeholder="Contact person (optional)" className={field} value={form.contact_name} onChange={set("contact_name")} />
                <input type="tel" placeholder="Phone (WhatsApp, optional)" className={field} value={form.phone} onChange={set("phone")} />
                <input type="email" placeholder="Work email (optional)" className={field} value={form.email} onChange={set("email")} />

                <div>
                  <p className="mb-1.5 text-xs font-bold text-navy-900">
                    Purchase order file <span className="font-normal text-gray-400">(PDF, JPG, PNG — max 10MB, keeps its original filename)</span>
                  </p>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-surface px-4 py-5 text-xs font-bold text-gray-500 transition-colors hover:border-safety-400 hover:text-safety-600">
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading…" : poFile ? "Replace PO file" : "Upload PO file"}
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="sr-only" onChange={onPoFile} disabled={uploading} />
                  </label>
                  {poFile && (
                    <p className="mt-2 flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs text-gray-600">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-safety-600" />
                      <span className="min-w-0 flex-1 truncate">{decodeURIComponent(poFile.split("/").pop() ?? "")}</span>
                      <button type="button" onClick={() => setPoFile(null)} aria-label="Remove PO file" className="text-gray-400 transition-colors hover:text-danger">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </p>
                  )}
                </div>

                {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{error}</p>}

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <button
                    type="submit"
                    disabled={submitting || !poFile}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-safety-500 px-6 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(245,124,0,0.35)] transition-colors hover:bg-safety-600 disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                    {submitting ? "Submitting…" : "Submit PO"}
                  </button>
                  <Link
                    href="/search"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-line px-6 py-3 text-sm font-bold text-navy-900 transition-colors hover:border-safety-400 hover:text-safety-600"
                  >
                    Browse the shop <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </form>

              <p className="mt-6 flex items-center gap-2 text-[11px] text-gray-400">
                <ShieldCheck className="h-3.5 w-3.5 text-safety-600" /> Your documents are stored securely and only shared with the KimSafety procurement team.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
