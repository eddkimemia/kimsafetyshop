"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Eye, EyeOff, Trash2 } from "lucide-react";
import { AdminCard, adminField, useFetch } from "@/components/admin/ui";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { CoverImagePicker } from "@/components/admin/image-picker";
import { SendNewsletterButton } from "@/components/admin/send-newsletter-button";

type AdminPost = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  cover: string | null;
  author: string;
  read_time: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

const empty: AdminPost = {
  id: "",
  slug: "",
  title: "",
  category: "News",
  excerpt: "",
  content: "",
  cover: null,
  author: "KimSafety Team",
  read_time: "5 min read",
  published: true,
  created_at: "",
  updated_at: "",
};

export default function AdminBlogEditorPage() {
  const params = useParams<{ slug: string }>();
  const rawSlug = decodeURIComponent(params.slug ?? "");
  const isNew = rawSlug === "new";
  const router = useRouter();

  const { data, loading } = useFetch<{ posts: AdminPost[] }>("/api/admin/posts");
  const [form, setForm] = useState<AdminPost>(empty);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const found = (data?.posts ?? []).find((p) => p.slug === rawSlug);

  useEffect(() => {
    if (loaded || loading) return;
    if (isNew) {
      setForm(empty);
      setLoaded(true);
    } else if (found) {
      setForm(found);
      setLoaded(true);
    } else if (data) {
      setError(`Post "${rawSlug}" not found.`);
      setLoaded(true);
    }
  }, [found, loading, data, isNew, rawSlug, loaded]);

  const set = (patch: Partial<AdminPost>) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/posts", {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        published: form.published !== false,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(json.error ?? "Save failed");
      return;
    }
    router.push("/admin/blog");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blog"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-gray-500 hover:text-navy-900"
            aria-label="Back to posts"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-navy-900">
              {isNew ? "New Post" : `Edit: ${form.title || rawSlug}`}
            </h1>
            <p className="text-sm text-gray-500">{isNew ? "Draft a new article" : `/${form.slug}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <SendNewsletterButton
            subject={form.title}
            body={form.content}
            disabledReason={isNew ? "Save the post first" : form.content?.trim() ? undefined : "Post has no body content"}
          />
          <button
            onClick={() => setPreview((p) => !p)}
            className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-navy-900 hover:bg-surface"
          >
            {preview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {preview ? "Edit" : "Preview"}
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-navy-900 px-6 py-3 text-sm font-bold text-white hover:bg-safety-500 disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Post"}
          </button>
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{error}</p>}

      {preview ? (
        <AdminCard title="Preview" subtitle="Roughly how the article will look on /blog/[slug]">
          <div className="rounded-2xl border border-line bg-white p-6 lg:p-10">
            <span className="rounded-full bg-safety-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-safety-700">
              {form.category || "News"}
            </span>
            <h2 className="mt-3 font-display text-2xl font-extrabold text-navy-900">{form.title}</h2>
            {form.excerpt && (
              <p className="mt-3 border-l-4 border-safety-500 pl-4 text-sm font-medium text-navy-900/80">
                {form.excerpt}
              </p>
            )}
            <div className="mt-5 blog-prose" dangerouslySetInnerHTML={{ __html: form.content }} />
          </div>
        </AdminCard>
      ) : (
        <>
          <AdminCard title="Article details">
            <div className="space-y-3.5">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Title *</span>
                <input
                  className={adminField}
                  value={form.title}
                  onChange={(e) => set({ title: e.target.value })}
                  placeholder="e.g. How to Inspect a Safety Harness"
                />
              </label>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-gray-500">Slug (URL) {isNew ? "(blank = auto)" : ""}</span>
                  <input className={adminField} value={form.slug} onChange={(e) => set({ slug: e.target.value })} placeholder="how-to-inspect-a-safety-harness" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-gray-500">Category</span>
                  <input className={adminField} value={form.category} onChange={(e) => set({ category: e.target.value })} placeholder="News" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-gray-500">Author</span>
                  <input className={adminField} value={form.author} onChange={(e) => set({ author: e.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-gray-500">Read time</span>
                  <input className={adminField} value={form.read_time} onChange={(e) => set({ read_time: e.target.value })} placeholder="5 min read" />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Excerpt (shown on the blog grid)</span>
                <textarea rows={3} className={adminField} value={form.excerpt} onChange={(e) => set({ excerpt: e.target.value })} />
              </label>
              <button
                onClick={() => set({ published: !form.published })}
                className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${
                  form.published
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-line bg-white text-gray-500"
                }`}
              >
                {form.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {form.published ? "Published — visible on /blog" : "Draft — hidden from /blog"}
              </button>
            </div>
          </AdminCard>

          <AdminCard
            title="Cover image"
            subtitle="Featured photo for the blog grid and article header"
            action={
              form.cover ? (
                <button
                  onClick={() => set({ cover: null })}
                  className="flex items-center gap-1 rounded-lg border border-danger/30 px-3 py-1.5 text-[11px] font-bold text-danger hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              ) : undefined
            }
          >
            <CoverImagePicker
              current={form.cover ?? ""}
              onPick={(path) => set({ cover: path })}
            />
          </AdminCard>

          <AdminCard title="Content" subtitle="Rich text editor with headings, lists, links and images">
            <RichTextEditor value={form.content} onChange={(html) => set({ content: html })} />
          </AdminCard>
        </>
      )}
    </div>
  );
}
