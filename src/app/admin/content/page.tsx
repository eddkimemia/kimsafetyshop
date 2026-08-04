"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2, BookOpen } from "lucide-react";
import { useFetch, AdminCard } from "@/components/admin/ui";

type Guide = {
  slug: string;
  title: string;
  category: string;
  readTime: string;
  excerpt: string;
  icon: string;
  image: string;
  content: string;
  static?: boolean;
};

export default function AdminContentPage() {
  const { data, loading, refresh } = useFetch<{ guides: Guide[] }>("/api/admin/content");
  const [notice, setNotice] = useState<string | null>(null);
  const guides = data?.guides ?? [];

  const remove = async (g: Guide) => {
    if (!confirm(`Delete "${g.title}"?`)) return;
    const res = await fetch(`/api/admin/content?slug=${encodeURIComponent(g.slug)}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    setNotice(res.ok ? `Deleted ${g.title}` : json.error ?? "Delete failed");
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">Knowledge Content</h1>
          <p className="text-sm text-gray-500">{guides.length} guides · titles, categories and excerpts shown on the Knowledge Center</p>
        </div>
        <Link
          href="/admin/content/new"
          className="flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-3 text-sm font-bold text-white hover:bg-safety-500"
        >
          <Plus className="h-4 w-4" /> Add Guide
        </Link>
      </div>

      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>}

      <AdminCard title="Guides">
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
        ) : guides.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">No guides yet.</p>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {guides.map((g) => (
                <div key={g.slug} className="rounded-xl border border-line bg-white p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-safety-50 text-safety-600">
                      <BookOpen className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-navy-900">{g.title}</p>
                      <p className="text-[11px] text-gray-400">{g.category} · {g.readTime}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-gray-400">/{g.slug}</p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <Link
                        href={`/admin/content/${encodeURIComponent(g.slug)}`}
                        aria-label={`Edit ${g.title}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-500 hover:border-safety-300 hover:text-safety-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      {!g.static && (
                        <button
                          onClick={() => remove(g)}
                          aria-label={`Delete ${g.title}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-500 hover:border-danger/40 hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="pb-3">Title</th>
                    <th className="hidden pb-3 md:table-cell">Slug</th>
                    <th className="hidden pb-3 md:table-cell">Category</th>
                    <th className="hidden pb-3 md:table-cell">Read time</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {guides.map((g) => (
                    <tr key={g.slug} className="border-b border-line/60 last:border-0">
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-safety-50 text-safety-600">
                            <BookOpen className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-semibold text-navy-900">{g.title}</p>
                            <p className="max-w-md truncate text-[11px] text-gray-400">{g.excerpt}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden py-3.5 font-mono text-xs text-gray-500 md:table-cell">{g.slug}</td>
                      <td className="hidden py-3.5 text-gray-500 md:table-cell">{g.category}</td>
                      <td className="hidden py-3.5 text-gray-500 md:table-cell">{g.readTime}</td>
                      <td className="py-3.5">
                        <div className="flex justify-end gap-1.5">
                          <Link
                            href={`/admin/content/${encodeURIComponent(g.slug)}`}
                            aria-label={`Edit ${g.title}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-500 hover:border-safety-300 hover:text-safety-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          {!g.static && (
                            <button
                              onClick={() => remove(g)}
                              aria-label={`Delete ${g.title}`}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-500 hover:border-danger/40 hover:text-danger"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </AdminCard>
    </div>
  );
}
