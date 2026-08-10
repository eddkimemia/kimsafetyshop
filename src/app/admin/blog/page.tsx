"use client";

import { useRouter } from "next/navigation";
import { ExternalLink, Pencil, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { useFetch, AdminCard } from "@/components/admin/ui";

type AdminPost = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  cover: string | null;
  author: string;
  read_time: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export default function AdminBlogPage() {
  const { data, loading, refresh } = useFetch<{ posts: AdminPost[] }>("/api/admin/posts");
  const router = useRouter();
  const posts = data?.posts ?? [];

  const remove = async (p: AdminPost) => {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/posts?slug=${encodeURIComponent(p.slug)}`, { method: "DELETE" });
    if (res.ok) refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">Blog Posts</h1>
          <p className="text-sm text-gray-500">{posts.length} posts · published articles appear on /blog</p>
        </div>
        <button
          onClick={() => router.push("/admin/blog/new")}
          className="flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-3 text-sm font-bold text-white hover:bg-safety-500"
        >
          <Plus className="h-4 w-4" /> New Post
        </button>
      </div>

      <AdminCard title="All posts">
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
        ) : posts.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-400">No posts yet.</p>
            <button
              onClick={() => router.push("/admin/blog/new")}
              className="mt-3 text-xs font-bold text-safety-600 hover:text-safety-700"
            >
              Write your first post →
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {posts.map((p) => (
                <div key={p.id} className="rounded-xl border border-line bg-white p-4">
                  <div className="flex items-start gap-3">
                    <span className="h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-navy-700 to-navy-900">
                      {p.cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.cover} alt={p.title} className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white/50">
                          {p.category.slice(0, 3).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-navy-900">{p.title}</p>
                      <p className="font-mono text-[11px] text-gray-400">/{p.slug}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {p.category} ·{" "}
                        {new Date(p.updated_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${p.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {p.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {p.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <div className="mt-3 flex justify-end gap-1.5 border-t border-line/60 pt-3">
                    {p.published && (
                      <a
                        href={`/blog/${encodeURIComponent(p.slug)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View ${p.title}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-500 hover:border-safety-300 hover:text-safety-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={() => router.push(`/admin/blog/${encodeURIComponent(p.slug)}`)}
                      aria-label={`Edit ${p.title}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-500 hover:border-safety-300 hover:text-safety-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => remove(p)}
                      aria-label={`Delete ${p.title}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-500 hover:border-danger/40 hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="pb-3">Post</th>
                    <th className="hidden pb-3 md:table-cell">Category</th>
                    <th className="pb-3">Status</th>
                    <th className="hidden pb-3 md:table-cell">Updated</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr key={p.id} className="border-b border-line/60 last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <span className="h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-navy-700 to-navy-900">
                            {p.cover ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.cover} alt={p.title} className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white/50">
                                {p.category.slice(0, 3).toUpperCase()}
                              </span>
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-navy-900">{p.title}</p>
                            <p className="font-mono text-[11px] text-gray-400">/{p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden py-3 text-xs text-gray-500 md:table-cell">{p.category}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${p.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {p.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          {p.published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="hidden py-3 text-xs text-gray-400 md:table-cell">
                        {new Date(p.updated_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-1.5">
                          {p.published && (
                            <a
                              href={`/blog/${encodeURIComponent(p.slug)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`View ${p.title}`}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-500 hover:border-safety-300 hover:text-safety-600"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            onClick={() => router.push(`/admin/blog/${encodeURIComponent(p.slug)}`)}
                            aria-label={`Edit ${p.title}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-500 hover:border-safety-300 hover:text-safety-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => remove(p)}
                            aria-label={`Delete ${p.title}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-500 hover:border-danger/40 hover:text-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
