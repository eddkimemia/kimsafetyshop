"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { AdminCard, adminField } from "@/components/admin/ui";
import { CoverImagePicker } from "@/components/admin/image-picker";

export type Banner = {
  id: number;
  title: string;
  subtitle: string;
  kicker: string;
  cta: string;
  cta_href: string;
  cta2: string;
  image: string;
  card_kicker: string;
  card_title: string;
  card_subtitle: string;
  stat1_label: string;
  stat1_value: string;
  stat2_label: string;
  stat2_value: string;
  sort: number;
  active: boolean;
};

export const emptyBanner: Banner = {
  id: 0,
  title: "",
  subtitle: "",
  kicker: "KimSafety",
  cta: "Shop Now",
  cta_href: "/search",
  cta2: "Request a Quote",
  image: "",
  card_kicker: "KimSafety",
  card_title: "",
  card_subtitle: "",
  stat1_label: "Trusted by",
  stat1_value: "1,200+ Organizations",
  stat2_label: "Delivered to",
  stat2_value: "47 Counties",
  sort: 0,
  active: true,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-gray-500">{label}</span>
      {children}
    </label>
  );
}

export function BannerEditor({ initial, isNew }: { initial: Banner; isNew: boolean }) {
  const router = useRouter();
  const [f, setF] = useState<Banner>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<Banner>) => setF((x) => ({ ...x, ...patch }));

  const save = async () => {
    if (!f.title.trim() || !f.image.trim()) {
      setError("Headline and background image are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/marketing/banners", {
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
              {isNew ? "New Homepage Banner" : `Edit Banner: ${initial.title}`}
            </h1>
            <p className="text-sm text-gray-500">
              {isNew ? "Create a hero slide for the homepage" : "Update this hero slide"}
            </p>
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-navy-900 px-6 py-3 text-sm font-bold text-white hover:bg-safety-500 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : "Save Banner"}
        </button>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{error}</p>}

      <AdminCard title="Banner content" subtitle="Shown as a slide in the homepage hero slider">
        <div className="space-y-3.5">
          <Field label="Kicker (small badge text)">
            <input
              className={adminField}
              value={f.kicker}
              onChange={(e) => set({ kicker: e.target.value })}
              placeholder="e.g. Black Friday · Up to 40% off"
            />
          </Field>
          <Field label="Headline *">
            <input
              className={adminField}
              value={f.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="e.g. Mega Black Friday Sale"
            />
          </Field>
          <Field label="Subtitle">
            <textarea rows={2} className={adminField} value={f.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Button label">
              <input className={adminField} value={f.cta} onChange={(e) => set({ cta: e.target.value })} />
            </Field>
            <Field label="Button link">
              <input className={adminField} value={f.cta_href} onChange={(e) => set({ cta_href: e.target.value })} placeholder="/search" />
            </Field>
          </div>
          <Field label="Secondary button label (Request a Quote)">
            <input className={adminField} value={f.cta2} onChange={(e) => set({ cta2: e.target.value })} />
          </Field>
          <Field label="Background image *">
            <CoverImagePicker current={f.image} onPick={(path) => set({ image: path })} />
          </Field>

          <div className="rounded-xl border border-safety-100 bg-safety-50/40 p-4">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-safety-700">
              Small card on the right (own content)
            </p>
            <div className="space-y-3">
              <Field label="Card badge text">
                <input
                  className={adminField}
                  value={f.card_kicker}
                  onChange={(e) => set({ card_kicker: e.target.value })}
                  placeholder="KimSafety"
                />
              </Field>
              <Field label="Card headline">
                <input
                  className={adminField}
                  value={f.card_title}
                  onChange={(e) => set({ card_title: e.target.value })}
                  placeholder="Your Trusted Safety Partner"
                />
              </Field>
              <Field label="Card subtitle">
                <textarea
                  rows={2}
                  className={adminField}
                  value={f.card_subtitle}
                  onChange={(e) => set({ card_subtitle: e.target.value })}
                  placeholder="Genuine & certified PPE, delivered nationwide within 24–72 hours."
                />
              </Field>
              <p className="text-[11px] text-gray-400">
                Leave a field empty to reuse the matching main banner line.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Stat 1 label">
              <input className={adminField} value={f.stat1_label} onChange={(e) => set({ stat1_label: e.target.value })} placeholder="Trusted by" />
            </Field>
            <Field label="Stat 1 value">
              <input className={adminField} value={f.stat1_value} onChange={(e) => set({ stat1_value: e.target.value })} placeholder="1,200+ Organizations" />
            </Field>
            <Field label="Stat 2 label">
              <input className={adminField} value={f.stat2_label} onChange={(e) => set({ stat2_label: e.target.value })} placeholder="Delivered to" />
            </Field>
            <Field label="Stat 2 value">
              <input className={adminField} value={f.stat2_value} onChange={(e) => set({ stat2_value: e.target.value })} placeholder="47 Counties" />
            </Field>
          </div>
          <p className="rounded-xl bg-surface px-4 py-3 text-[11px] leading-relaxed text-gray-500">
            These two statistics appear in the card on the right side of the hero slide.
          </p>
          <label className="flex items-center gap-2.5 rounded-xl border border-line px-4 py-3">
            <input type="checkbox" checked={f.active} onChange={(e) => set({ active: e.target.checked })} />
            <span className="text-xs font-bold text-navy-900">Show this banner on the homepage</span>
          </label>
        </div>
      </AdminCard>
    </div>
  );
}
