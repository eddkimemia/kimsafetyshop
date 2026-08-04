"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, ImagePlus, Search, Save, Trash2, X } from "lucide-react";
import { useFetch, AdminCard, adminField } from "@/components/admin/ui";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { ProductArt, productImageFor } from "@/components/product/product-art";

type AdminProduct = {
  sku: string;
  name: string;
  brand: string;
  category: string;
  categoryName: string;
  price: number;
  oldPrice?: number;
  stock: number;
  lowStockAt: number;
  tags: string[];
  description?: string;
  features?: string[];
  image?: string;
  gallery?: string[];
  static?: boolean;
};

const empty: AdminProduct = {
  sku: "",
  name: "",
  brand: "KimSafety",
  category: "industrial-safety",
  categoryName: "Industrial Safety",
  price: 0,
  oldPrice: undefined,
  stock: 0,
  lowStockAt: 10,
  tags: ["safety"],
  description: "",
  features: [],
  gallery: [],
};

export default function AdminProductEditPage() {
  const params = useParams<{ sku: string }>();
  const rawSku = decodeURIComponent(params.sku ?? "");
  const isNew = rawSku === "new";
  const router = useRouter();

  const { data, loading } = useFetch<{ products: AdminProduct[] }>("/api/admin/products");
  const [form, setForm] = useState<AdminProduct>(empty);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const found = useMemo(
    () => (data?.products ?? []).find((p) => p.sku === rawSku),
    [data, rawSku]
  );

  useEffect(() => {
    if (loaded || loading) return;
    if (isNew) {
      setForm(empty);
      setLoaded(true);
    } else if (found) {
      setForm({ ...empty, ...found, tags: found.tags ?? [], gallery: found.gallery ?? [] });
      setLoaded(true);
    } else if (data) {
      setError(`Product "${rawSku}" not found in the catalog.`);
      setLoaded(true);
    }
  }, [found, loading, data, isNew, rawSku, loaded]);

  const set = (patch: Partial<AdminProduct>) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (!form.name || !form.price) {
      setError("Name and price are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const body = {
      ...form,
      tags: form.tags.filter(Boolean),
      features: (form.features ?? []).filter((l) => l.trim()),
      gallery: (form.gallery ?? []).filter(Boolean),
    };
    const res = await fetch("/api/admin/products", {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(json.error ?? "Save failed");
      return;
    }
    router.push("/admin/products");
    router.refresh();
  };

  const previewSrc = form.image || (form.sku ? productImageFor(form.sku) : undefined);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-gray-500 hover:text-navy-900"
            aria-label="Back to products"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-navy-900">
              {isNew ? "Add Product" : `Edit: ${form.name || rawSku}`}
            </h1>
            <p className="text-sm text-gray-500">
              {isNew ? "Create a new custom product" : `${form.sku} · ${form.static ? "Seed product (editable, not deletable)" : "Custom product"}`}
            </p>
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-navy-900 px-6 py-3 text-sm font-bold text-white hover:bg-safety-500 disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Product"}
        </button>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{error}</p>}

      <div className="space-y-6">
        <ImagePicker
          current={form.image}
          previewSrc={previewSrc}
          gallery={form.gallery ?? []}
          onPick={(path) => set({ image: path })}
          onClear={() => set({ image: undefined })}
          onGalleryChange={(gallery) => set({ gallery })}
        />

        <AdminCard title="Details">
          <div className="space-y-3.5">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-gray-500">Product name *</span>
              <input className={adminField} value={form.name} onChange={(e) => set({ name: e.target.value })} />
            </label>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">SKU {isNew ? "(blank = auto)" : "*"}</span>
                <input className={adminField} value={form.sku} disabled={!isNew} onChange={(e) => set({ sku: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Brand</span>
                <input className={adminField} value={form.brand} onChange={(e) => set({ brand: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Price (KES) *</span>
                <input type="number" className={adminField} value={form.price} onChange={(e) => set({ price: Number(e.target.value) })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Old price (KES, optional)</span>
                <input type="number" className={adminField} value={form.oldPrice ?? ""} onChange={(e) => set({ oldPrice: e.target.value ? Number(e.target.value) : undefined })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Stock</span>
                <input type="number" className={adminField} value={form.stock} onChange={(e) => set({ stock: Number(e.target.value) })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Low-stock threshold</span>
                <input type="number" className={adminField} value={form.lowStockAt} onChange={(e) => set({ lowStockAt: Number(e.target.value) })} />
              </label>
            </div>
          </div>
        </AdminCard>

        <AdminCard title="Catalog & organisation" subtitle="Where the product sits in the storefront">
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Category name</span>
                <input className={adminField} value={form.categoryName} onChange={(e) => set({ categoryName: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Category slug</span>
                <input className={adminField} value={form.category} onChange={(e) => set({ category: e.target.value })} />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-gray-500">Tags (comma separated)</span>
              <input className={adminField} value={form.tags.join(", ")} onChange={(e) => set({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />
            </label>
          </div>
        </AdminCard>

        <AdminCard title="Description" subtitle="Rich text — headings, lists, images and links render on the product page">
          <RichTextEditor value={form.description ?? ""} onChange={(html) => set({ description: html })} />
        </AdminCard>

        <AdminCard title="Features" subtitle="One per line — shown as checkmark bullets">
          <textarea rows={4} className={adminField} value={(form.features ?? []).join("\n")} onChange={(e) => set({ features: e.target.value.split("\n") })} />
        </AdminCard>
      </div>
    </div>
  );
}

function ImagePicker({
  current,
  previewSrc,
  gallery,
  onPick,
  onClear,
  onGalleryChange,
}: {
  current?: string;
  previewSrc?: string;
  gallery: string[];
  onPick: (path: string) => void;
  onClear: () => void;
  onGalleryChange: (gallery: string[]) => void;
}) {
  const { data, loading, refresh } = useFetch<{ products: string[] }>("/api/admin/images");
  const [query, setQuery] = useState("");
  const files = (data?.products ?? []).filter((f) => f.toLowerCase().includes(query.toLowerCase()));

  const toggleInGallery = (path: string) => {
    if (path === current) return;
    onGalleryChange(gallery.includes(path) ? gallery.filter((p) => p !== path) : [...gallery, path]);
  };

  const moveInGallery = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= gallery.length) return;
    const next = [...gallery];
    [next[index], next[to]] = [next[to], next[index]];
    onGalleryChange(next);
  };

  return (
    <AdminCard
      title="Images"
      subtitle="Pick photos from the library — the main image is the product cover, extras form the gallery shown on the product page"
      action={
        current ? (
          <button
            onClick={onClear}
            className="flex items-center gap-1 rounded-lg border border-danger/30 px-3 py-1.5 text-[11px] font-bold text-danger hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Reset to default
          </button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-bold text-gray-500">Main image</p>
            <div className="aspect-[4/3] overflow-hidden rounded-xl border border-line">
              <ProductArt
                tags={["safety"]}
                categoryName="Product"
                brand="KimSafety"
                src={previewSrc}
                alt="Product image preview"
                className="aspect-[4/3]"
              />
            </div>
            {current && (
              <p className="mt-2 truncate rounded-lg bg-safety-50 px-3 py-2 text-[11px] font-semibold text-safety-700">
                Override: {current}
              </p>
            )}
          </div>
          <div className="space-y-4">
            <UploadZone
              onUploaded={(path) => {
                setQuery("");
                refresh();
                onPick(path);
              }}
            />
            <p className="rounded-xl bg-surface px-4 py-3 text-[11px] leading-relaxed text-gray-500">
              Click any photo below to set it as the main image, or to add / remove it from the gallery. The first photo
              in the gallery shows first after the cover.
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold text-gray-500">
            Gallery ({gallery.length})
            {gallery.length > 0 && <span className="font-normal text-gray-400">— extras shown as thumbnails on the product page</span>}
          </p>
          {gallery.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-xs text-gray-400">
              No gallery photos yet — click photos in the library below to add them.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {gallery.map((path, i) => (
                <div key={path + i} className="group relative overflow-hidden rounded-xl border border-line">
                  <img src={path} alt={`Gallery ${i + 1}`} className="aspect-square w-full object-cover" />
                  <div className="absolute inset-0 flex flex-col items-end justify-between bg-black/45 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => onGalleryChange(gallery.filter((_, idx) => idx !== i))}
                      aria-label={`Remove gallery image ${i + 1}`}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-600 hover:bg-red-500 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveInGallery(i, -1)}
                        disabled={i === 0}
                        aria-label="Move earlier"
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-600 hover:text-navy-900 disabled:opacity-30"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => moveInGallery(i, 1)}
                        disabled={i === gallery.length - 1}
                        aria-label="Move later"
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-600 hover:text-navy-900 disabled:opacity-30"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <span className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search images…"
              className={adminField}
              style={{ paddingLeft: "2.5rem" }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="mt-3 grid max-h-72 grid-cols-3 gap-2 overflow-auto pr-1 sm:grid-cols-4 md:grid-cols-6">
            {loading && <p className="col-span-full py-8 text-center text-xs text-gray-400">Loading library…</p>}
            {!loading && files.length === 0 && (
              <p className="col-span-full py-8 text-center text-xs text-gray-400">No images match.</p>
            )}
            {files.slice(0, 96).map((file) => {
              const path = `/api/uploads/${encodeURIComponent(file)}`;
              const selected = current === path || gallery.includes(path);
              return (
                <button
                  key={file}
                  onClick={() => {
                    if (current !== path) toggleInGallery(path);
                    if (gallery.includes(path)) onPick(path);
                  }}
                  title={file}
                  className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                    selected ? "border-safety-500 ring-2 ring-safety-500/30" : "border-line hover:border-safety-300"
                  }`}
                >
                  {current === path && (
                    <span className="absolute left-1 top-1 rounded-md bg-navy-900 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      MAIN
                    </span>
                  )}
                  <ImagePlus className="pointer-events-none absolute inset-0 m-auto h-6 w-6 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
                  <img
                    src={path}
                    alt={file}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </AdminCard>
  );
}

function UploadZone({ onUploaded }: { onUploaded: (path: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/admin/images", { method: "POST", body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Upload failed");
        return;
      }
      onUploaded(json.path as string);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-safety-300 bg-safety-50/50 px-4 py-5 text-center transition-colors hover:border-safety-400 hover:bg-safety-50 disabled:opacity-60"
      >
        <ImagePlus className="h-6 w-6 text-safety-600" />
        <span className="text-xs font-bold text-navy-900">
          {uploading ? "Uploading…" : "Upload a new image"}
        </span>
        <span className="text-[11px] text-gray-400">JPG, PNG, WEBP or GIF · max 8 MB</span>
      </button>
      {error && <p className="mt-2 text-[11px] font-semibold text-danger">{error}</p>}
    </div>
  );
}
