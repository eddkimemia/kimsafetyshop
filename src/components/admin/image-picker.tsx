"use client";

import { useState } from "react";
import { Search, Upload, Loader2 } from "lucide-react";
import { adminField, useFetch } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { processImageInBrowser } from "@/lib/client-image-process";

type Tab = "upload" | "products" | "hero";

export function CoverImagePicker({
  current,
  onPick,
}: {
  current: string;
  onPick: (path: string) => void;
}) {
  const { data, loading, refresh } = useFetch<{ products: string[]; hero: string[] }>("/api/admin/images");
  const [tab, setTab] = useState<Tab>("products");
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pool = tab === "products" ? data?.products ?? [] : (data?.hero ?? []).map((f) => `hero/${f}`);
  const files = pool.filter((f) => f.toLowerCase().includes(query.toLowerCase()));

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      // Process in the browser (background-removed product on the KimSafety
      // product template) so the result is identical on Vercel, where the
      // Python pipeline can't run, and stays under Vercel's 4.5MB
      // serverless body limit.
      const finalFile = await processImageInBrowser(file);
      const fd = new FormData();
      fd.append("file", finalFile);
      fd.append("processed", "1");
      const res = await fetch("/api/admin/images", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      onPick(json.path as string);
      refresh();
      setTab("products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {current && (
        <div className="aspect-[16/8] overflow-hidden rounded-xl border border-line bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current} alt="Cover preview" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-line bg-surface p-1">
          {(
            [
              ["upload", "Upload new"],
              ["products", "Product photos"],
              ["hero", "Hero photos"],
            ] as [Tab, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                tab === value ? "bg-navy-900 text-white" : "text-gray-500"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {tab !== "upload" && (
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search images…"
              className={adminField}
              style={{ paddingLeft: "2.5rem" }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      {tab === "upload" ? (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-surface/60 px-4 py-10 text-center text-xs font-bold text-gray-500 transition-colors hover:border-safety-400 hover:text-safety-600">
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Uploading… (JPG, PNG, WEBP — max 8MB)
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" /> Click to upload an image — it will be set as the cover
            </>
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} className="sr-only" onChange={onFiles} />
        </label>
      ) : (
        <div className="grid max-h-64 grid-cols-4 gap-2 overflow-auto pr-1 sm:grid-cols-6">
          {loading && <p className="col-span-full py-8 text-center text-xs text-gray-400">Loading library…</p>}
          {!loading && files.length === 0 && <p className="col-span-full py-8 text-center text-xs text-gray-400">No images match.</p>}
          {files.slice(0, 60).map((file) => {
            const path = file.startsWith("hero/") ? `/images/hero/${encodeURIComponent(file.slice(5))}` : `/api/uploads/${encodeURIComponent(file)}`;
            const selected = current === path;
            return (
              <button
                key={path}
                onClick={() => onPick(path)}
                title={path}
                className={`group relative aspect-video overflow-hidden rounded-lg border-2 transition-all ${
                  selected ? "border-safety-500 ring-2 ring-safety-500/30" : "border-line hover:border-safety-300"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={path} alt={file} loading="lazy" className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs font-semibold text-danger">{error}</p>}
    </div>
  );
}
