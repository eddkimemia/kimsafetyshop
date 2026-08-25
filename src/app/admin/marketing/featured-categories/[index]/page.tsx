"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { AdminCard, adminField } from "@/components/admin/ui";
import { CoverImagePicker } from "@/components/admin/image-picker";

type FeaturedItem = { name: string; caption: string; image: string; category: string; sort: number };
type CategoryOption = { slug: string; name: string };

export default function FeaturedCategoryEditPage() {
  const params = useParams<{ index: string }>();
  const rawIndex = params.index ?? "";
  const index = Number(rawIndex);
  const router = useRouter();

  const [items, setItems] = useState<FeaturedItem[] | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", caption: "", image: "", category: "" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/marketing/featured-categories");
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Failed to load featured categories");
        const fetchedItems: FeaturedItem[] = Array.isArray(json.items) ? json.items : [];
        const fetchedCats: CategoryOption[] = Array.isArray(json.categories) ? json.categories : [];
        if (cancelled) return;
        setItems(fetchedItems);
        setCategories(fetchedCats);
        if (Number.isNaN(index) || index < 0 || index >= fetchedItems.length) {
          setError(`Featured tile #${rawIndex} not found`);
        } else {
          const item = fetchedItems[index];
          setForm({ name: item.name, caption: item.caption, image: item.image, category: item.category });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [index, rawIndex]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Display name is required");
      return;
    }
    if (!form.category) {
      setError("Category is required");
      return;
    }
    if (!items) return;
    setSaving(true);
    setError(null);
    try {
      const updated = items.map((it, idx) =>
        idx === index ? { ...it, name: form.name.trim(), caption: form.caption.trim(), image: form.image.trim(), category: form.category } : it
      );
      const res = await fetch("/api/admin/marketing/featured-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: updated }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Save failed");
      router.push("/admin/marketing");
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

  if (error && !items) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/marketing" className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-gray-500 hover:text-navy-900">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-xl font-extrabold text-navy-900">Edit featured tile</h1>
        </div>
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-danger">{error}</p>
        <Link href="/admin/marketing" className="inline-flex items-center gap-2 rounded-xl border border-line px-5 py-2.5 text-sm font-bold text-navy-900 hover:bg-surface">
          <ArrowLeft className="h-4 w-4" /> Back to Marketing
        </Link>
      </div>
    );
  }

  if (Number.isNaN(index) || !items || index < 0 || index >= items.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/marketing" className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-gray-500 hover:text-navy-900">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-xl font-extrabold text-navy-900">Tile not found</h1>
        </div>
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-danger">Featured tile #{rawIndex} does not exist.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/marketing" className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-gray-500 hover:text-navy-900" aria-label="Back to marketing">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">Edit featured tile #{index + 1}</h1>
          <p className="text-sm text-gray-500">Update the homepage “Featured Categories” tile — name, caption, category and image</p>
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{error}</p>}

      <AdminCard title="Tile details" subtitle="Shown on the homepage Featured Categories grid">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-gray-500">Display name *</span>
              <input className={adminField} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Safety Helmets" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-gray-500">Category *</span>
              <select className={adminField} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-500">Caption (small text under the name)</span>
            <input className={adminField} value={form.caption} onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))} placeholder="e.g. Construction Helmets" />
          </label>
          <div>
            <span className="mb-1 block text-xs font-bold text-gray-500">Tile image</span>
            <CoverImagePicker current={form.image} onPick={(path) => setForm((f) => ({ ...f, image: path }))} />
          </div>
        </div>
      </AdminCard>

      <div className="flex justify-end gap-2">
        <Link href="/admin/marketing" className="rounded-xl border border-line px-6 py-3 text-sm font-bold text-gray-500 hover:text-navy-900">
          Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={saving || !form.name.trim()}
          className="flex items-center gap-2 rounded-xl bg-navy-900 px-8 py-3 text-sm font-bold text-white hover:bg-safety-500 disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save tile"}
        </button>
      </div>
    </div>
  );
}
