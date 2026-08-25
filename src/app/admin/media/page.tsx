"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Trash2, Image as ImageIcon, AlertTriangle, Check, Filter, RefreshCw, Eye, ExternalLink, X } from "lucide-react";
import { AdminCard, adminField } from "@/components/admin/ui";

type MediaItem = {
  filename: string;
  url: string;
  encodedUrl: string;
  source: string;
  sources: string[];
  size: number;
  mtime: string | null;
  mime: string | null;
  references: string[];
  referenceDetail: { sku: string; name?: string; field: string }[];
  isDb: boolean;
  isFilesystem: boolean;
};

type ApiResponse = {
  items: MediaItem[];
  stats: { total: number; products: number; uploads: number; filesystem: number; missing: number };
};

function formatBytes(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "unknown";
  try {
    return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function AdminMediaPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  const [showReferencedOnly, setShowReferencedOnly] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState<MediaItem | null>(null);

  const fetchMedia = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/media");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || `Failed: ${res.status}`);
      }
      setData(json as ApiResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const sources = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    for (const item of data.items) {
      for (const s of item.sources) set.add(s);
    }
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.toLowerCase();
    return data.items.filter((item) => {
      if (showMissingOnly && !item.source.includes("missing")) return false;
      if (showReferencedOnly && item.references.length === 0) return false;
      if (sourceFilter !== "all" && !item.sources.includes(sourceFilter)) return false;
      if (q) {
        const hay = `${item.filename} ${item.source} ${item.references.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, query, sourceFilter, showMissingOnly, showReferencedOnly]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((i) => selected.has(i.filename));

  const toggleSelect = (filename: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(filename)) next.delete(filename);
      else next.add(filename);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const item of filtered) next.delete(item.filename);
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const item of filtered) next.add(item.filename);
        return next;
      });
    }
  };

  const deleteFiles = async (filenames: string[]) => {
    if (filenames.length === 0) return;
    const isBulk = filenames.length > 1;
    const confirmMsg = isBulk
      ? `Delete ${filenames.length} images? This will remove them from disk and database and clear any product references. This cannot be undone.`
      : `Delete "${filenames[0]}"? This will remove it from disk and database and clear any product references. This cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    setDeleting(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filenames }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Delete failed");
      const results: { filename: string; deleted: boolean; error?: string; referencesCleared?: number }[] = json.results || [];
      const succeeded = results.filter((r) => r.deleted).length;
      const failed = results.filter((r) => !r.deleted);
      if (failed.length) {
        setNotice(`Deleted ${succeeded} of ${filenames.length}. Failed: ${failed.map((f) => `${f.filename}: ${f.error}`).join(", ")}`);
      } else {
        setNotice(`Deleted ${succeeded} image${succeeded === 1 ? "" : "s"}${results.some((r) => r.referencesCleared) ? ` — cleared ${results.reduce((a, b) => a + (b.referencesCleared || 0), 0)} product reference(s)` : ""}.`);
      }
      setSelected(new Set());
      await fetchMedia();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">Media Library</h1>
          <p className="text-sm text-gray-500">Loading images…</p>
        </div>
        <div className="py-20 text-center text-sm text-gray-400">Loading media library…</div>
      </div>
    );
  }

  if (error) {
    const isForbidden = /forbidden|not.*superadmin/i.test(error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">Media Library</h1>
          <p className="text-sm text-gray-500">Manage all site images — superadmin only</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-10 text-center shadow-card">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
          <h2 className="mt-4 font-display text-lg font-extrabold text-navy-900">{isForbidden ? "Superadmin only" : "Failed to load"}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{error}</p>
          {isForbidden ? (
            <p className="mx-auto mt-2 max-w-md text-xs text-gray-400">Ask a superadmin to grant access or check your account role at /admin/users.</p>
          ) : (
            <button onClick={fetchMedia} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-navy-900 px-6 py-3 text-sm font-bold text-white hover:bg-safety-500">
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">Media Library</h1>
          <p className="text-sm text-gray-500">
            {data?.stats.total ?? 0} images · {data?.stats.products ?? 0} in products · {data?.stats.uploads ?? 0} uploads (DB) ·{" "}
            {data?.stats.missing ?? 0} missing · superadmin only
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchMedia}
            className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-navy-900 hover:bg-surface"
          >
            <RefreshCw className="h-4 w-4 text-gray-500" /> Refresh
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-start gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <Check className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="flex-1">{notice}</span>
          <button onClick={() => setNotice(null)} className="text-emerald-800 hover:text-emerald-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <AdminCard
        title="Filters"
        action={
          <div className="flex items-center gap-2 text-xs">
            <span className="hidden sm:inline text-gray-400">{filtered.length} of {data?.items.length ?? 0} matches</span>
            {selected.size > 0 && (
              <button
                onClick={() => deleteFiles(Array.from(selected))}
                disabled={deleting}
                className="flex items-center gap-1.5 rounded-xl bg-danger px-4 py-2 text-xs font-bold text-white hover:bg-danger/90 disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete {selected.size} selected
              </button>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="relative sm:col-span-2 lg:col-span-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search filename, SKU, source…"
                className={adminField}
                style={{ paddingLeft: "2.5rem" }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className={adminField} aria-label="Filter by source">
              <option value="all">All sources</option>
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-xs font-bold text-gray-600">
              <input type="checkbox" checked={showMissingOnly} onChange={(e) => setShowMissingOnly(e.target.checked)} className="h-4 w-4 accent-danger" />
              Missing only
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-xs font-bold text-gray-600">
              <input type="checkbox" checked={showReferencedOnly} onChange={(e) => setShowReferencedOnly(e.target.checked)} className="h-4 w-4 accent-safety-500" />
              Referenced only
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3 text-xs">
            <label className="flex items-center gap-2 font-semibold text-navy-900">
              <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAllFiltered} className="h-4 w-4 accent-navy-900" />
              Select all {filtered.length} filtered
            </label>
            {selected.size > 0 && (
              <>
                <span className="text-gray-300">·</span>
                <button onClick={() => setSelected(new Set())} className="font-bold text-navy-900 hover:text-safety-600">
                  Clear {selected.size} selected
                </button>
                <span className="text-gray-300">·</span>
                <span className="text-gray-500">{selected.size} selected — old product photos that load first should be deleted here; new uploads via /api/uploads are preferred.</span>
              </>
            )}
          </div>
        </div>
      </AdminCard>

      <AdminCard
        title={`All Images — ${filtered.length} items`}
        subtitle="Thumbnails load from the source URL. Old product photos in /images/products load before DB uploads — delete the stale file to force the new image to be used."
      >
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">No images match. Try clearing filters.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((item) => {
              const isSelected = selected.has(item.filename);
              const isMissing = item.source.includes("missing");
              return (
                <div
                  key={item.filename}
                  className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${isSelected ? "border-safety-500 ring-2 ring-safety-500/20" : "border-line hover:border-safety-200"} ${isMissing ? "opacity-60" : ""}`}
                >
                  <label className="absolute left-2 top-2 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white shadow-md ring-1 ring-line">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(item.filename)}
                      className="h-4 w-4 accent-navy-900"
                      aria-label={`Select ${item.filename}`}
                    />
                  </label>
                  <button
                    onClick={() => setPreview(item)}
                    className="block w-full aspect-square overflow-hidden bg-surface"
                    title={`Preview ${item.filename}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.encodedUrl}
                      alt={item.filename}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </button>
                  <div className="p-2.5">
                    <p className="truncate text-xs font-bold text-navy-900" title={item.filename}>{item.filename}</p>
                    <p className="mt-0.5 flex flex-wrap gap-1">
                      {item.sources.map((s) => (
                        <span
                          key={s}
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${s === "products" ? "bg-navy-900 text-white" : s === "uploads" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : s === "brands" ? "bg-safety-50 text-safety-700 ring-1 ring-safety-200" : isMissing ? "bg-red-50 text-danger ring-1 ring-red-200" : "bg-gray-100 text-gray-600"}`}
                        >
                          {s}
                        </span>
                      ))}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      {formatBytes(item.size)} · {formatDate(item.mtime)}
                    </p>
                    {item.references.length > 0 ? (
                      <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <ImageIcon className="h-3 w-3" /> Used by {item.references.slice(0, 3).join(", ")}{item.references.length > 3 ? ` +${item.references.length - 3}` : ""} ({item.references.length})
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] text-gray-400">Unused — safe to delete</p>
                    )}
                    <div className="mt-2 flex gap-1">
                      <button
                        onClick={() => setPreview(item)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-line bg-white px-2 py-1.5 text-[11px] font-bold text-navy-900 hover:bg-surface"
                        title="Preview"
                      >
                        <Eye className="h-3 w-3" /> View
                      </button>
                      <button
                        onClick={() => deleteFiles([item.filename])}
                        disabled={deleting}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-danger/20 bg-red-50 text-danger hover:bg-danger hover:text-white disabled:opacity-60"
                        title="Delete this image"
                        aria-label={`Delete ${item.filename}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <a
                        href={item.encodedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-white text-gray-500 hover:text-navy-900"
                        title="Open original"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </AdminCard>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/70 p-4 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-soft" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-display text-base font-extrabold text-navy-900">{preview.filename}</h2>
                <p className="truncate text-xs text-gray-500">
                  {preview.sources.join(", ")} · {formatBytes(preview.size)} · {formatDate(preview.mtime)} · {preview.mime || "image"}
                </p>
              </div>
              <button onClick={() => setPreview(null)} className="ml-3 flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-gray-500 hover:bg-surface">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="bg-surface p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview.encodedUrl} alt={preview.filename} className="mx-auto max-h-[60vh] w-auto rounded-xl object-contain shadow-card" />
            </div>
            <div className="space-y-3 p-5">
              <div className="flex flex-wrap gap-1.5">
                {preview.sources.map((s) => (
                  <span key={s} className="rounded-full bg-navy-900 px-2.5 py-1 text-xs font-bold text-white">
                    {s}
                  </span>
                ))}
                {preview.isDb && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">DB-backed</span>}
                {preview.isFilesystem && <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">On disk</span>}
              </div>
              {preview.references.length > 0 ? (
                <div className="rounded-xl border border-line bg-white p-3">
                  <p className="text-xs font-bold text-navy-900">Referenced by {preview.references.length} product(s):</p>
                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                    {preview.referenceDetail.slice(0, 8).map((r, i) => (
                      <li key={`${r.sku}:${r.field}:${i}`} className="flex items-center justify-between gap-2">
                        <span className="truncate font-semibold text-navy-900">
                          {r.sku} {r.name ? `— ${r.name}` : ""} <span className="font-normal text-gray-400">({r.field})</span>
                        </span>
                      </li>
                    ))}
                    {preview.referenceDetail.length > 8 && <li className="text-gray-400">…and {preview.referenceDetail.length - 8} more</li>}
                  </ul>
                  <p className="mt-2 text-[11px] text-amber-600">Deleting will clear these image/gallery references from the product.</p>
                </div>
              ) : (
                <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Unused — safe to delete without affecting products.</p>
              )}
              <div className="flex gap-2">
                <a href={preview.encodedUrl} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-navy-900 hover:bg-surface">
                  <ExternalLink className="h-4 w-4" /> Open original
                </a>
                <button
                  onClick={() => {
                    setPreview(null);
                    deleteFiles([preview.filename]);
                  }}
                  disabled={deleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-danger px-4 py-3 text-sm font-bold text-white hover:bg-danger/90 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" /> Delete this image
                </button>
              </div>
              <p className="text-center text-xs text-gray-400">
                <Filter className="mr-1 inline h-3 w-3" /> Tip: Search for a SKU or old filename to find stale product photos that flash before the new upload.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
