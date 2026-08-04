"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ClipboardList,
  Check,
  Send,
  ShieldCheck,
  FileText,
  Clock,
  BadgeCheck,
  Phone,
  Mail,
  MessageCircle,
  ArrowRight,
  Paperclip,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { formatKES } from "@/lib/utils";
import { ProductArt } from "@/components/product/product-art";
import { PageHeader } from "@/components/layout/page-header";

const field =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm outline-none transition-all focus:border-safety-400 focus:bg-white focus:ring-4 focus:ring-safety-500/10";

export function QuoteForm() {
  const params = useSearchParams();
  const { cart, liveProduct, liveBySlug } = useStore();

  const productId = params.get("product");
  const product = useMemo(() => (productId ? liveBySlug(productId) : undefined), [productId, liveBySlug]);

  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [includeCart, setIncludeCart] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState(() => ({
    company: "",
    contact: "",
    phone: "",
    email: "",
    items: product ? `${product.name} (${product.sku})` : "",
    budget: "",
  }));

  const cartLines = useMemo(
    () =>
      cart
        .map((i) => liveProduct(i.productId))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .map((p) => `${p.name} (${p.sku}) x${cart.find((i) => i.productId === p.id)?.qty ?? 1}`),
    [cart, liveProduct]
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parts = [form.items.trim()];
    if (includeCart && cartLines.length > 0) parts.push(...cartLines);
    const itemsText = parts.filter(Boolean).join("\n");
    if (!itemsText) {
      setError("Please describe the products and quantities you need.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let attachment: string | undefined;
      if (file) {
        const fd = new FormData();
        fd.append("files", file);
        const up = await fetch("/api/uploads/documents", { method: "POST", body: fd });
        const upJson = await up.json().catch(() => ({}));
        if (!up.ok) throw new Error(upJson.error ?? "File upload failed");
        attachment = upJson.urls?.[0];
      }
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.contact,
          company: form.company,
          email: form.email,
          phone: form.phone,
          total: 0,
          attachment,
          items: [
            {
              productId: "quote-request",
              name: `${itemsText}${form.budget ? ` (est. ${form.budget})` : ""}`,
              qty: 1,
              price: 0,
            },
          ],
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Failed to submit request");
      setQuoteId(json.quote?.id ?? null);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-surface pb-24">
        <PageHeader bg="/images/hero/hero3.jpg" title="Request a Quotation" />
        <div className="mx-auto max-w-xl px-4 pt-12 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
            <Check className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="font-display text-2xl font-extrabold text-navy-900">Request received!</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            {quoteId ? (
              <>
                Your reference is <strong className="text-navy-900">{quoteId}</strong> — our corporate
                sales team will send your quotation to {form.email || "your email"} within 4 business
                hours.
              </>
            ) : (
              "Our corporate sales team will send your quotation within 4 business hours."
            )}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-safety-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-safety-600"
            >
              Continue Shopping <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => {
                setSent(false);
                setFile(null);
                setForm((f) => ({ ...f, items: product ? `${product.name} (${product.sku})` : "" }));
              }}
              className="rounded-xl border border-line px-6 py-3 text-sm font-bold text-navy-900 transition-colors hover:bg-surface"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface pb-20">
      <PageHeader
        bg="/images/hero/hero3.jpg"
        eyebrow={
          <>
            <ClipboardList className="h-3.5 w-3.5" /> Quotations
          </>
        }
        title="Request a Quotation"
        subtitle="Tiered pricing, negotiated rates and dedicated account managers. Response within 4 business hours."
      />

      <div className="mx-auto grid max-w-shell grid-cols-1 gap-8 px-4 pt-8 lg:grid-cols-3 lg:px-8">
        <div className="lg:col-span-2">
          {product && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-safety-200 bg-safety-50 px-4 py-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white">
                <ProductArt
                  tags={product.tags}
                  categoryName={product.categoryName}
                  brand={product.brand}
                  sku={product.sku}
                  className="h-full w-full"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-safety-600">
                  Quoting for
                </p>
                <p className="truncate text-sm font-bold text-navy-900">
                  {product.name}{" "}
                  <span className="font-mono text-xs font-normal text-gray-400">{product.sku}</span>
                </p>
              </div>
              <Link
                href={`/product/${product.slug}`}
                className="ml-auto hidden shrink-0 text-xs font-bold text-safety-600 hover:underline sm:block"
              >
                View product
              </Link>
            </div>
          )}

          {cart.length > 0 && (
            <div className="mb-4 rounded-2xl border border-line bg-white p-4 shadow-card">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={includeCart}
                  onChange={(e) => setIncludeCart(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-safety-500"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between text-sm font-bold text-navy-900">
                    <span>
                      Include my cart ({cart.length} item{cart.length > 1 ? "s" : ""}) in this
                      request
                    </span>
                    <span className="font-mono text-xs font-normal text-gray-400">
                      {formatKES(
                        cart.reduce(
                          (sum, i) => sum + (liveProduct(i.productId)?.price ?? 0) * i.qty,
                          0
                        )
                      )}
                    </span>
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {cart.map((i) => {
                      const p = liveProduct(i.productId);
                      if (!p) return null;
                      return (
                        <Link
                          key={i.productId}
                          href={`/product/${p.slug}`}
                          className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-gray-600 transition-colors hover:bg-safety-50 hover:text-safety-700"
                        >
                          {p.name} ×{i.qty}
                        </Link>
                      );
                    })}
                  </span>
                </span>
              </label>
            </div>
          )}

          <form onSubmit={submit} className="space-y-3.5 rounded-2xl border border-line bg-white p-6 shadow-card">
            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">
                {error}
              </p>
            )}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <input
                required
                placeholder="Company / Organization *"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className={field}
              />
              <input
                required
                placeholder="Contact person *"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                className={field}
              />
              <input
                required
                type="tel"
                placeholder="Phone number *"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={field}
              />
              <input
                required
                type="email"
                placeholder="Business email *"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={field}
              />
            </div>
            <textarea
              required
              rows={5}
              placeholder="Products and quantities (e.g. 200 helmets, 50 coveralls, 30 first aid kits) *"
              value={form.items}
              onChange={(e) => setForm({ ...form, items: e.target.value })}
              className={field}
            />
            <select
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              className={field}
            >
              <option value="">Estimated order value (optional)</option>
              <option>Under KES 50,000</option>
              <option>KES 50,000 – 250,000</option>
              <option>KES 250,000 – 1,000,000</option>
              <option>Above KES 1,000,000</option>
            </select>
            <div className="rounded-xl border border-dashed border-safety-300 bg-safety-50/50 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex flex-1 cursor-pointer items-center gap-2 text-xs font-bold text-navy-900">
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  <Paperclip className="h-4 w-4 text-safety-600" />
                  {file ? file.name : "Attach your RFQ / specification PDF or drawing (optional, max 10MB)"}
                </label>
                {file && (
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    aria-label="Remove attachment"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-400 ring-1 ring-line hover:text-danger"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="mt-1 text-[11px] text-gray-400">PDF, JPG, PNG or WEBP — upload your RFQ or spec sheet so we quote accurately.</p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-safety-500 py-3.5 text-sm font-bold text-white transition-colors hover:bg-safety-600 disabled:opacity-60"
            >
              <Send className="h-4 w-4" /> {saving ? "Submitting…" : "Submit Request"}
            </button>
            <p className="text-center text-[11px] text-gray-400">
              Tender-ready documentation & tax invoices available on request.
            </p>
          </form>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-28">
          <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
            <h2 className="font-display text-lg font-extrabold text-navy-900">
              Why request a quotation?
            </h2>
            <ul className="mt-5 space-y-4 text-sm text-gray-600">
              <li className="flex gap-3">
                <BadgeCheck className="h-5 w-5 shrink-0 text-safety-500" />
                <span>
                  <strong className="text-navy-900">Tiered bulk pricing</strong> — the more you
                  order, the less you pay per unit.
                </span>
              </li>
              <li className="flex gap-3">
                <FileText className="h-5 w-5 shrink-0 text-safety-500" />
                <span>
                  <strong className="text-navy-900">Tender & tax documents</strong> — quotations,
                  delivery notes and ETR invoices for procurement.
                </span>
              </li>
              <li className="flex gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                <span>
                  <strong className="text-navy-900">Certified products</strong> — KEBS and
                  internationally certified safety equipment.
                </span>
              </li>
              <li className="flex gap-3">
                <Clock className="h-5 w-5 shrink-0 text-safety-500" />
                <span>
                  <strong className="text-navy-900">Fast turnaround</strong> — responses within 4
                  business hours, quotes valid 14 days.
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-navy-800 to-navy-900 p-6 text-white">
            <h2 className="font-display text-lg font-extrabold">Prefer to talk?</h2>
            <p className="mt-1 text-xs text-white/70">
              Our corporate sales desk is available Mon–Sat, 8:00–18:00.
            </p>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a
                  href="https://wa.me/254712345678"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 font-bold transition-colors hover:text-safety-300"
                >
                  <MessageCircle className="h-4.5 w-4.5 text-safety-400" /> +254 712 345 678
                </a>
              </li>
              <li>
                <a
                  href="tel:+254712345678"
                  className="flex items-center gap-3 font-bold transition-colors hover:text-safety-300"
                >
                  <Phone className="h-4.5 w-4.5 text-safety-400" /> +254 712 345 678
                </a>
              </li>
              <li>
                <a
                  href="mailto:corporate@kimsafety.co.ke"
                  className="flex items-center gap-3 font-bold transition-colors hover:text-safety-300"
                >
                  <Mail className="h-4.5 w-4.5 text-safety-400" /> corporate@kimsafety.co.ke
                </a>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
