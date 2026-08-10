"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useFetch, AdminCard, adminField } from "@/components/admin/ui";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { ProductArt, productImageFor } from "@/components/product/product-art";
import { processImageInBrowser } from "@/lib/client-image-process";
import { categories } from "@/lib/data/catalog";
import { cn } from "@/lib/utils";

type SpecRow = { label: string; value: string };
type BulkTier = { qty: string; price: string; savings: string };
type DownloadRow = { name: string; type: string; file?: string };

type AdminProduct = {
  sku: string;
  name: string;
  brand: string;
  category: string;
  categoryName: string;
  categories?: string[];
  price: number;
  oldPrice?: number;
  stock: number;
  lowStockAt: number;
  rating: number;
  reviews: number;
  sold: number;
  model?: string;
  featured?: boolean;
  bestSeller?: boolean;
  new?: boolean;
  color?: string;
  size?: string;
  material?: string;
  weight?: string;
  certification?: string;
  standard?: string;
  warranty?: string;
  shelfLife?: string;
  country?: string;
  tags: string[];
  description?: string;
  features: string[];
  image?: string;
  gallery?: string[];
  specs: SpecRow[];
  bulk: BulkTier[];
  downloads: DownloadRow[];
  static?: boolean;
};

const empty: AdminProduct = {
  sku: "",
  name: "",
  brand: "KimSafety",
  category: "industrial-safety",
  categoryName: "Industrial Safety",
  categories: ["industrial-safety"],
  price: 0,
  oldPrice: undefined,
  stock: 0,
  lowStockAt: 10,
  rating: 4.5,
  reviews: 0,
  sold: 0,
  featured: false,
  bestSeller: false,
  new: false,
  tags: ["safety"],
  description: "",
  features: [],
  gallery: [],
  specs: [],
  bulk: [],
  downloads: [],
};

function buildSpecs(f: AdminProduct): SpecRow[] {
  return [
    { label: "Brand", value: f.brand },
    { label: "Model", value: f.model || f.sku },
    { label: "SKU", value: f.sku },
    { label: "Material", value: f.material || "Premium-grade materials" },
    { label: "Color", value: f.color || "Varies by option" },
    { label: "Weight", value: f.weight || "Lightweight design" },
    { label: "Size", value: f.size || "One size (adjustable)" },
    { label: "Certification", value: f.certification || "CE · ISO 9001" },
    { label: "Safety Standard", value: f.standard || "EN ISO compliant" },
    { label: "Manufacturer", value: f.brand },
    { label: "Country of Origin", value: f.country || "Import, quality inspected in Kenya" },
    { label: "Shelf Life", value: f.shelfLife || "5 years from manufacture" },
    { label: "Warranty", value: f.warranty || "12-month KimSafety warranty" },
  ];
}

function buildBulk(f: AdminProduct): BulkTier[] {
  const tiers = [
    { qty: "1 – 9", price: f.price.toLocaleString(), savings: "Standard" },
    { qty: "10 – 49", price: Math.round(f.price * 0.95).toLocaleString(), savings: "5% off" },
    { qty: "50 – 199", price: Math.round(f.price * 0.91).toLocaleString(), savings: "9% off" },
    { qty: "200+", price: Math.round(f.price * 0.87).toLocaleString(), savings: "13% off" },
  ];
  return tiers;
}

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
      setForm({
        ...empty,
        ...found,
        categories: found.categories?.length ? found.categories : [found.category],
        tags: found.tags ?? [],
        features: found.features ?? [],
        gallery: found.gallery ?? [],
        specs: found.specs ?? [],
        bulk: found.bulk ?? [],
        downloads: found.downloads ?? [],
      });
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
    const body: Partial<AdminProduct> = {
      ...form,
      tags: form.tags.filter(Boolean),
      features: (form.features ?? []).filter((l) => l.trim()),
      gallery: (form.gallery ?? []).filter(Boolean),
      downloads: (form.downloads ?? []).filter((d) => d.name.trim()),
      specs: form.specs?.length ? form.specs.filter((s) => s.label.trim() || s.value.trim()) : buildSpecs(form),
      bulk: form.bulk?.length ? form.bulk.filter((b) => b.qty.trim()) : buildBulk(form),
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

  const number = (v: string) => (v === "" ? undefined : Number(v));

  return (
    <div className="w-full space-y-6">
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
              {isNew
                ? "Create a new custom product"
                : `${form.sku} · ${form.static ? "Seed product (editable, not deletable)" : "Custom product"}`}
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
                  <span className="mb-1 block text-xs font-bold text-gray-500">Model</span>
                  <input className={adminField} value={form.model ?? ""} onChange={(e) => set({ model: e.target.value })} placeholder="e.g. Microflex 93-260" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-gray-500">Brand</span>
                  <input className={adminField} value={form.brand} onChange={(e) => set({ brand: e.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-gray-500">Country of origin</span>
                  <input className={adminField} value={form.country ?? ""} onChange={(e) => set({ country: e.target.value })} placeholder="e.g. Malaysia" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-gray-500">Price (KES) *</span>
                  <input type="number" className={adminField} value={form.price} onChange={(e) => set({ price: Number(e.target.value) })} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-gray-500">Old price (KES, optional)</span>
                  <input type="number" className={adminField} value={form.oldPrice ?? ""} onChange={(e) => set({ oldPrice: number(e.target.value) })} />
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

          <AdminCard title="Stats" subtitle="Shown on the product page — rating, review count and units sold">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Rating (0 – 5)</span>
                <input type="number" min={0} max={5} step={0.1} className={adminField} value={form.rating} onChange={(e) => set({ rating: Number(e.target.value) })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Reviews</span>
                <input type="number" min={0} className={adminField} value={form.reviews} onChange={(e) => set({ reviews: Number(e.target.value) })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Units sold</span>
                <input type="number" min={0} className={adminField} value={form.sold} onChange={(e) => set({ sold: Number(e.target.value) })} />
              </label>
            </div>
          </AdminCard>

          <AdminCard title="Attributes" subtitle="Material, size, weight, colour and finish details">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Material</span>
                <input className={adminField} value={form.material ?? ""} onChange={(e) => set({ material: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Colour</span>
                <input className={adminField} value={form.color ?? ""} onChange={(e) => set({ color: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Size</span>
                <input className={adminField} value={form.size ?? ""} onChange={(e) => set({ size: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Weight</span>
                <input className={adminField} value={form.weight ?? ""} onChange={(e) => set({ weight: e.target.value })} />
              </label>
            </div>
          </AdminCard>

          <AdminCard title="Compliance & warranty" subtitle="Certifications, standards, shelf life and warranty shown on the product page">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Certification</span>
                <input className={adminField} value={form.certification ?? ""} onChange={(e) => set({ certification: e.target.value })} placeholder="e.g. EN 397 · KSA 1559" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Safety standard</span>
                <input className={adminField} value={form.standard ?? ""} onChange={(e) => set({ standard: e.target.value })} placeholder="e.g. EN ISO 20345" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Shelf life</span>
                <input className={adminField} value={form.shelfLife ?? ""} onChange={(e) => set({ shelfLife: e.target.value })} placeholder="e.g. 5 years" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Warranty</span>
                <input className={adminField} value={form.warranty ?? ""} onChange={(e) => set({ warranty: e.target.value })} placeholder="e.g. 12-month KimSafety warranty" />
              </label>
            </div>
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard title="Catalog & organisation" subtitle="Where the product sits in the storefront">
            <div className="space-y-3.5">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">
                  Categories (a product can be in several)
                </span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {categories.map((c) => {
                    const selected = (form.categories ?? []).includes(c.slug);
                    return (
                      <button
                        key={c.slug}
                        type="button"
                        onClick={() => {
                          const cur = form.categories?.length ? form.categories : [form.category];
                          const next = selected
                            ? cur.filter((s) => s !== c.slug)
                            : [...cur, c.slug];
                          const primary = next[0] ?? c.slug;
                          set({
                            categories: next,
                            category: primary,
                            categoryName: categories.find((x) => x.slug === primary)?.name ?? "",
                          });
                        }}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-colors",
                          selected
                            ? "border-navy-900 bg-navy-900 text-white"
                            : "border-line bg-white text-navy-800 hover:border-navy-300"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {selected ? <Check className="h-3.5 w-3.5 shrink-0" /> : <span className="h-3.5 w-3.5 shrink-0 rounded-sm border border-line" />}
                          {c.name}
                          {c.slug === form.category && (
                            <span className="ml-auto rounded-full bg-safety-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                              Primary
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[11px] text-gray-400">
                  The first selected category is primary — used for the breadcrumb and related products.
                </p>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Tags (comma separated)</span>
                <input className={adminField} value={form.tags.join(", ")} onChange={(e) => set({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />
              </label>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line px-4 py-3">
                  <span className="text-xs font-bold text-gray-500">Featured</span>
                  <input type="checkbox" checked={Boolean(form.featured)} onChange={(e) => set({ featured: e.target.checked })} className="h-4 w-4 accent-safety-500" />
                </label>
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line px-4 py-3">
                  <span className="text-xs font-bold text-gray-500">Best seller</span>
                  <input type="checkbox" checked={Boolean(form.bestSeller)} onChange={(e) => set({ bestSeller: e.target.checked })} className="h-4 w-4 accent-safety-500" />
                </label>
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line px-4 py-3">
                  <span className="text-xs font-bold text-gray-500">New badge</span>
                  <input type="checkbox" checked={Boolean(form.new)} onChange={(e) => set({ new: e.target.checked })} className="h-4 w-4 accent-safety-500" />
                </label>
              </div>
            </div>
          </AdminCard>

          <AdminCard
            title="Specifications"
            subtitle="Rows shown under the Specifications tab — generated from attributes when left blank"
            action={
              <button
                onClick={() => set({ specs: [...(form.specs ?? []), { label: "", value: "" }] })}
                className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-[11px] font-bold text-navy-900 hover:bg-surface"
              >
                <Plus className="h-3.5 w-3.5" /> Add row
              </button>
            }
          >
            <div className="space-y-2.5">
              {form.specs?.map((spec, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <input
                    className={adminField}
                    placeholder="Label (e.g. Material)"
                    value={spec.label}
                    onChange={(e) => set({ specs: (form.specs ?? []).map((s, idx) => (idx === i ? { ...s, label: e.target.value } : s)) })}
                  />
                  <input
                    className={adminField}
                    placeholder="Value (e.g. HDPE shell)"
                    value={spec.value}
                    onChange={(e) => set({ specs: (form.specs ?? []).map((s, idx) => (idx === i ? { ...s, value: e.target.value } : s)) })}
                  />
                  <button
                    onClick={() => set({ specs: (form.specs ?? []).filter((_, idx) => idx !== i) })}
                    aria-label={`Remove specification ${i + 1}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-gray-400 hover:border-danger/40 hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {(!form.specs || form.specs.length === 0) && (
                <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-xs text-gray-400">
                  No custom specifications — standard rows are generated from the attributes above.
                </p>
              )}
            </div>
          </AdminCard>

          <AdminCard
            title="Bulk pricing"
            subtitle="Tiered prices shown on the product page — generated from the price when left blank"
            action={
              <button
                onClick={() => set({ bulk: [...(form.bulk ?? []), { qty: "", price: "", savings: "" }] })}
                className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-[11px] font-bold text-navy-900 hover:bg-surface"
              >
                <Plus className="h-3.5 w-3.5" /> Add tier
              </button>
            }
          >
            <div className="space-y-2.5">
              {form.bulk?.map((tier, i) => (
                <div key={i} className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_1fr_1fr_auto]">
                  <input
                    className={adminField}
                    placeholder="Qty (e.g. 10 – 49)"
                    value={tier.qty}
                    onChange={(e) => set({ bulk: (form.bulk ?? []).map((b, idx) => (idx === i ? { ...b, qty: e.target.value } : b)) })}
                  />
                  <input
                    className={adminField}
                    placeholder="Price (e.g. 1,750)"
                    value={tier.price}
                    onChange={(e) => set({ bulk: (form.bulk ?? []).map((b, idx) => (idx === i ? { ...b, price: e.target.value } : b)) })}
                  />
                  <input
                    className={adminField}
                    placeholder="Savings (e.g. 5% off)"
                    value={tier.savings}
                    onChange={(e) => set({ bulk: (form.bulk ?? []).map((b, idx) => (idx === i ? { ...b, savings: e.target.value } : b)) })}
                  />
                  <button
                    onClick={() => set({ bulk: (form.bulk ?? []).filter((_, idx) => idx !== i) })}
                    aria-label={`Remove bulk tier ${i + 1}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-gray-400 hover:border-danger/40 hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {(!form.bulk || form.bulk.length === 0) && (
                <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-xs text-gray-400">
                  No custom tiers — standard tiers (5% / 9% / 13% off) are generated from the price.
                </p>
              )}
            </div>
          </AdminCard>

          <AdminCard
            title="Downloads & documents"
            subtitle="Files shown under the Downloads & Documents tab — upload a real file per document"
            action={
              <button
                onClick={() => set({ downloads: [...(form.downloads ?? []), { name: "", type: "PDF" }] })}
                className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-[11px] font-bold text-navy-900 hover:bg-surface"
              >
                <Plus className="h-3.5 w-3.5" /> Add document
              </button>
            }
          >
            <div className="space-y-2.5">
              {form.downloads?.map((d, i) => (
                <DocumentRow
                  key={i}
                  doc={d}
                  onChange={(patch) =>
                    set({ downloads: (form.downloads ?? []).map((x, idx) => (idx === i ? { ...x, ...patch } : x)) })
                  }
                  onRemove={() => set({ downloads: (form.downloads ?? []).filter((_, idx) => idx !== i) })}
                />
              ))}
              {(!form.downloads || form.downloads.length === 0) && (
                <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-xs text-gray-400">
                  No documents yet — add datasheets, certification files and user guides.
                </p>
              )}
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
      subtitle="Click any photo to set it as the main (cover) image — use +/− to add or remove gallery extras"
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
              Click any photo in the library to make it the main cover. Use the +/− button on a photo to add or remove
              it from the gallery. The first gallery photo shows first after the cover.
            </p>
          </div>
        </div>

          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold text-gray-500">
              Gallery ({gallery.length})
              {gallery.length > 0 && <span className="font-normal text-gray-400">— extras shown as thumbnails on the product page</span>}
            </p>
            {gallery.length === 0 ? (
              <div className="space-y-3">
                <UploadZone
                  variant="gallery"
                  gallery={gallery}
                  onGalleryChange={onGalleryChange}
                  onUploaded={() => refresh()}
                />
                <p className="rounded-xl border border-dashed border-line px-4 py-4 text-center text-xs text-gray-400">
                  Upload a photo above — it is added to the gallery and auto-processed — or click + on photos in the
                  library below.
                </p>
              </div>
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
                <UploadZone
                  tile
                  variant="gallery"
                  gallery={gallery}
                  onGalleryChange={onGalleryChange}
                  onUploaded={() => refresh()}
                />
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
              const isCurrent = current === path;
              const inGallery = gallery.includes(path);
              return (
                <button
                  key={file}
                  onClick={() => onPick(path)}
                  title={file}
                  className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                    isCurrent ? "border-safety-500 ring-2 ring-safety-500/30" : "border-line hover:border-safety-300"
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute left-1 top-1 z-10 rounded-md bg-navy-900 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      MAIN
                    </span>
                  )}
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label={inGallery ? "Remove from gallery" : "Add to gallery"}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleInGallery(path);
                    }}
                    className={`absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shadow-sm transition-colors ${
                      inGallery ? "bg-safety-500 text-white" : "bg-white text-navy-900 hover:bg-safety-500 hover:text-white"
                    }`}
                  >
                    {inGallery ? "−" : "+"}
                  </span>
                  <ImagePlus className="pointer-events-none absolute inset-0 m-auto h-6 w-6 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
                  <img src={path} alt={file} loading="lazy" className="h-full w-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </AdminCard>
  );
}

function DocumentRow({
  doc,
  onChange,
  onRemove,
}: {
  doc: DownloadRow;
  onChange: (patch: Partial<DownloadRow>) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/admin/documents", { method: "POST", body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Upload failed");
        return;
      }
      const type = file.name.split(".").pop()?.toUpperCase() ?? "PDF";
      onChange({ file: json.path as string, type });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const fileName = doc.file ? decodeURIComponent(doc.file.split("/").pop() ?? "") : "";

  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <input
          className={adminField}
          placeholder="Name (e.g. Product Datasheet)"
          value={doc.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <input
          className={`${adminField} w-24`}
          placeholder="Type"
          value={doc.type}
          onChange={(e) => onChange({ type: e.target.value })}
        />
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt"
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
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 text-[11px] font-bold text-navy-900 hover:bg-surface disabled:opacity-60"
        >
          <Upload className="h-3.5 w-3.5 text-safety-600" />
          {uploading ? "Uploading…" : doc.file ? "Replace file" : "Upload file"}
        </button>
        <button
          onClick={onRemove}
          aria-label={`Remove document ${doc.name || "row"}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-gray-400 hover:border-danger/40 hover:text-danger"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {doc.file ? (
        <p className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
          <span className="truncate">
            <FileText className="mr-1 inline h-3 w-3" />
            {fileName}
          </span>
          <button
            onClick={() => onChange({ file: undefined })}
            className="shrink-0 rounded-md px-2 py-0.5 font-bold text-emerald-800 hover:bg-emerald-100"
            aria-label="Remove uploaded file"
          >
            <X className="h-3 w-3" />
          </button>
        </p>
      ) : (
        <p className="mt-2 text-[11px] text-gray-400">
          No file yet — visitors will get an auto-generated summary PDF until you upload the real document.
        </p>
      )}
      {error && <p className="mt-2 text-[11px] font-semibold text-danger">{error}</p>}
    </div>
  );
}

function UploadZone({
  onUploaded,
  variant = "cover",
  tile = false,
  gallery,
  onGalleryChange,
}: {
  onUploaded?: (path: string) => void;
  variant?: "cover" | "gallery";
  tile?: boolean;
  gallery?: string[];
  onGalleryChange?: (gallery: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      // Process in the browser (background-removed product on the KimSafety
      // product template) so the result is identical on Vercel, where the
      // Python pipeline can't run, and stays under Vercel's 4.5MB
      // serverless body limit.
      const finalFile = await processImageInBrowser(file);
      const form = new FormData();
      form.append("file", finalFile);
      form.append("processed", "1");
      const res = await fetch("/api/admin/images", { method: "POST", body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Upload failed");
        return;
      }
      if (variant === "gallery") {
        onGalleryChange?.([...(gallery ?? []), json.path as string]);
      } else {
        onUploaded?.(json.path as string);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={tile ? "h-full" : undefined}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
      {tile ? (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-safety-300 bg-safety-50/40 text-center transition-colors hover:border-safety-400 hover:bg-safety-50 disabled:opacity-60"
          title="Upload an image to the gallery"
        >
          <Loader2 className={`h-5 w-5 text-safety-600 ${uploading ? "animate-spin" : "hidden"}`} />
          <ImagePlus className={`h-5 w-5 text-safety-600 ${uploading ? "hidden" : ""}`} />
          <span className="text-[10px] font-bold text-navy-900">{uploading ? "Uploading…" : "Upload image"}</span>
        </button>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-safety-300 bg-safety-50/50 px-4 py-5 text-center transition-colors hover:border-safety-400 hover:bg-safety-50 disabled:opacity-60"
        >
          <ImagePlus className="h-6 w-6 text-safety-600" />
          <span className="text-xs font-bold text-navy-900">
            {uploading ? "Uploading…" : variant === "gallery" ? "Upload an image to the gallery" : "Upload a new image"}
          </span>
          <span className="text-[11px] text-gray-400">JPG, PNG or WEBP · max 8 MB</span>
        </button>
      )}
      {error && <p className="mt-2 text-[11px] font-semibold text-danger">{error}</p>}
    </div>
  );
}
