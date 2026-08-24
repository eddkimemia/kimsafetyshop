"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { AdminCard, adminField } from "@/components/admin/ui";
import { CoverImagePicker } from "@/components/admin/image-picker";

export type Campaign = {
  id: number;
  name: string;
  slug: string;
  description: string;
  discount_label: string;
  image: string | null;
  cta_href: string;
  start_date: string | null;
  end_date: string | null;
  active: boolean;
};

export const emptyCampaign: Campaign = {
  id: 0,
  name: "",
  slug: "",
  description: "",
  discount_label: "",
  image: null,
  cta_href: "/search",
  start_date: null,
  end_date: null,
  active: true,
};

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-gray-500">{label}</span>
      {children}
    </label>
  );
}

export function CampaignEditor({ initial, isNew }: { initial: Campaign; isNew: boolean }) {
  const router = useRouter();
  const [f, setF] = useState<Campaign>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<Campaign>) => setF((x) => ({ ...x, ...patch }));
  const autoSlug = !f.slug.trim();

  const save = async () => {
    if (!f.name.trim()) {
      setError("Campaign name is required.");
      return;
    }
    if (!f.image) {
      setError("Campaign image is required — the card shows the image instead of text.");
      return;
    }
    const href = f.cta_href.trim();
    if (href && /^javascript:/i.test(href)) {
      setError("CTA link cannot be javascript:.");
      return;
    }
    if (href && /^data:/i.test(href)) {
      setError("CTA link cannot be data:.");
      return;
    }
    if (href && href !== "/" && !href.startsWith("/") && !/^https:\/\//i.test(href)) {
      setError("CTA link must start with / or https:// (e.g. /deals or https://example.com).");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      router.push("/admin/marketing");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/marketing"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-gray-500 hover:text-navy-900"
            aria-label="Back to Marketing"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-navy-900">
              {isNew ? "New Promotional Campaign" : `Edit Campaign: ${initial.name}`}
            </h1>
            <p className="text-sm text-gray-500">
              {isNew ? "Create a promotion shown on the homepage" : "Update this promotion"}
            </p>
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-navy-900 px-6 py-3 text-sm font-bold text-white hover:bg-safety-500 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : "Save Campaign"}
        </button>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{error}</p>}

      <AdminCard title="Campaign details" subtitle="Shown as a promotion card on the homepage within the date range">
        <div className="space-y-3.5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Campaign name *">
              <input
                className={adminField}
                value={f.name}
                onChange={(e) => set({ name: e.target.value, slug: autoSlug ? slugifyName(e.target.value) : f.slug })}
                placeholder="e.g. Black Friday"
              />
            </Field>
            <Field label="Slug">
              <input className={adminField} value={f.slug} onChange={(e) => set({ slug: slugifyName(e.target.value) })} placeholder="black-friday" />
            </Field>
          </div>
          <Field label="Discount label (badge)">
            <input
              className={adminField}
              value={f.discount_label}
              onChange={(e) => set({ discount_label: e.target.value })}
              placeholder="e.g. Up to 40% off"
            />
          </Field>
          <Field label="Description">
            <textarea rows={2} className={adminField} value={f.description} onChange={(e) => set({ description: e.target.value })} />
          </Field>
          <Field label="CTA link">
            <input className={adminField} value={f.cta_href} onChange={(e) => set({ cta_href: e.target.value })} placeholder="/deals" />
          </Field>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Starts">
              <input type="date" className={adminField} value={f.start_date ?? ""} onChange={(e) => set({ start_date: e.target.value || null })} />
            </Field>
            <Field label="Ends">
              <input type="date" className={adminField} value={f.end_date ?? ""} onChange={(e) => set({ end_date: e.target.value || null })} />
            </Field>
          </div>
          <Field label="Card image *">
            <CoverImagePicker current={f.image ?? ""} onPick={(path) => set({ image: path })} />
          </Field>
          <label className="flex items-center gap-2.5 rounded-xl border border-line px-4 py-3">
            <input type="checkbox" checked={f.active} onChange={(e) => set({ active: e.target.checked })} />
            <span className="text-xs font-bold text-navy-900">Campaign is active</span>
          </label>
        </div>
      </AdminCard>
    </div>
  );
}
