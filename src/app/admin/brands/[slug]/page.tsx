"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Upload, Image as ImageIcon, ExternalLink } from "lucide-react";
import { AdminCard, adminField } from "@/components/admin/ui";

type Brand = {
  slug: string;
  name: string;
  tagline: string;
  origin: string;
  image: string;
};

export default function AdminBrandFormPage() {
  const params = useParams<{ slug: string }>();
  const rawSlug = decodeURIComponent(params.slug ?? "");
  const isNew = rawSlug === "new";
  const router = useRouter();

  const [loading, setLoading] = useState(!isNew);
  const [form, setForm] = useState<Brand>({ slug: "", name: "", tagline: "", origin: "Kenya", image: "" });
  const [originalSlug, setOriginalSlug] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/brands");
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Failed to load brand");
        const brands: Brand[] = Array.isArray(json.brands) ? json.brands : [];
        const found = brands.find((b) => b.slug === rawSlug);
        if (!found) {
          setError(`Brand "${rawSlug}" not found`);
          return;
        }
        if (!cancelled) {
          setForm({ ...found });
          setOriginalSlug(found.slug);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load brand");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isNew, rawSlug]);

  const handleUpload = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/images", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Upload failed");
      const path = json.path as string;
      setForm((f) => ({ ...f, image: path }));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Brand name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const method = isNew ? "POST" : "PATCH";
      const payload: Record<string, string> = isNew
        ? {
            slug: form.slug.trim(),
            name: form.name.trim(),
            tagline: form.tagline.trim(),
            origin: form.origin.trim(),
            image: form.image.trim(),
          }
        : {
            slug: originalSlug,
            newSlug: form.slug.trim() || originalSlug,
            name: form.name.trim(),
            tagline: form.tagline.trim(),
            origin: form.origin.trim(),
            image: form.image.trim(),
          };
      const res = await fetch("/api/admin/brands", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Save failed");
      router.push("/admin/brands");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/brands"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-gray-500 hover:text-navy-900"
          aria-label="Back to brands"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">{isNew ? "Add Brand" : `Edit ${originalSlug}`}</h1>
          <p className="text-sm text-gray-500">{isNew ? "Create a new brand for the storefront" : `Editing /brands/${originalSlug} · changes appear on /brands and brand pages`}</p>
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminCard title="Brand details" subtitle="Name, slug, tagline and origin shown on the brand card and brand page">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-gray-500">Brand name *</span>
              <input className={adminField} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. 3M" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-gray-500">Slug {isNew ? "(leave blank to auto-generate)" : "*"}</span>
              <input className={adminField} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="e.g. 3m" />
              {!isNew && <p className="mt-1 text-[11px] text-gray-400">Changing slug will change the brand URL: /brands/{form.slug || originalSlug}</p>}
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-gray-500">Tagline</span>
              <input className={adminField} value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} placeholder="e.g. Global innovation in safety" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-gray-500">Origin</span>
              <input className={adminField} value={form.origin} onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))} placeholder="e.g. USA, Germany, Kenya" />
            </label>
          </div>
        </AdminCard>

        <AdminCard title="Logo image" subtitle="Shown on /brands and brand pages · use /images/brands/... or upload">
          <div className="space-y-4">
            <div>
              <span className="mb-1 block text-xs font-bold text-gray-500">Logo image URL</span>
              <div className="flex gap-2">
                <input className={adminField + " flex-1"} value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} placeholder="/images/brands/3m.jpg or /api/uploads/..." />
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-navy-900 hover:bg-surface"
                  title="Upload logo"
                >
                  <Upload className="h-3.5 w-3.5" /> Upload
                </button>
              </div>
            </div>
            {form.image ? (
              <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-white p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.image} alt="Brand logo preview" className="h-full w-full object-contain" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-gray-500">{form.image}</span>
                <a href={form.image} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-navy-900">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-gray-400">
                <ImageIcon className="h-3.5 w-3.5" /> Use /images/brands/... for committed logos or upload a new one. Preview shows here.
              </p>
            )}
            <div className="rounded-xl bg-surface px-4 py-3 text-xs leading-relaxed text-gray-500">
              <p className="font-bold text-navy-900">Preview</p>
              <p>Logo appears at 96×96 on brand cards. White background with padding works best for dark logos. After saving, the change is live on the storefront immediately.</p>
            </div>
          </div>
        </AdminCard>
      </div>

      <div className="flex justify-end gap-2">
        <Link href="/admin/brands" className="rounded-xl border border-line px-6 py-3 text-sm font-bold text-gray-500 hover:text-navy-900">
          Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-navy-900 px-8 py-3 text-sm font-bold text-white hover:bg-safety-500 disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving…" : isNew ? "Create brand" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
