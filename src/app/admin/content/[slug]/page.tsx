"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Eye, EyeOff } from "lucide-react";
import { AdminCard, adminField, useFetch } from "@/components/admin/ui";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { CoverImagePicker } from "@/components/admin/image-picker";
import { SendNewsletterButton } from "@/components/admin/send-newsletter-button";
import { guideFallbackHtml } from "@/lib/data/guide-fallback";

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

const empty: Guide = {
  slug: "",
  title: "",
  category: "Guide",
  readTime: "5 min read",
  excerpt: "",
  icon: "info",
  image: "",
  content: "",
};

export default function AdminContentEditorPage() {
  const params = useParams<{ slug: string }>();
  const rawSlug = decodeURIComponent(params.slug ?? "");
  const isNew = rawSlug === "new";
  const router = useRouter();

  const { data, loading } = useFetch<{ guides: Guide[] }>("/api/admin/content");
  const [form, setForm] = useState<Guide>(empty);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  const found = (data?.guides ?? []).find((g) => g.slug === rawSlug);

  useEffect(() => {
    if (loaded || loading) return;
    if (isNew) {
      setForm(empty);
      setLoaded(true);
    } else if (found) {
      setForm({
        ...empty,
        ...found,
        // Guides without saved content render the shared fallback sections on
        // the frontend — prefill the editor with that same content so admins
        // see (and can edit) exactly what visitors see instead of a blank body.
        content: found.content?.trim() ? found.content : guideFallbackHtml(),
      });
      setLoaded(true);
    } else if (data) {
      setError(`Guide "${rawSlug}" not found.`);
      setLoaded(true);
    }
  }, [found, loading, data, isNew, rawSlug, loaded]);

  const set = (patch: Partial<Guide>) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/content", {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(json.error ?? "Save failed");
      return;
    }
    router.push("/admin/content");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/content"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-gray-500 hover:text-navy-900"
            aria-label="Back to guides"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-navy-900">
              {isNew ? "New Guide" : `Edit: ${form.title || rawSlug}`}
            </h1>
            <p className="text-sm text-gray-500">{isNew ? "Write a new knowledge guide" : `/${form.slug}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <SendNewsletterButton
            subject={form.title}
            body={form.content}
            disabledReason={isNew ? "Save the guide first" : form.content?.trim() ? undefined : "Guide has no body content"}
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
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Guide"}
          </button>
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{error}</p>}

      {preview ? (
        <AdminCard title="Preview" subtitle="Roughly how the guide will look on /knowledge/[slug]">
          <div className="rounded-2xl border border-line bg-white p-6 lg:p-10">
            {form.image && (
              <div className="mb-5 aspect-[16/8] overflow-hidden rounded-2xl border border-line bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.image} alt={form.title} className="h-full w-full object-cover" />
              </div>
            )}
            <span className="rounded-full bg-safety-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-safety-700">
              {form.category || "Guide"}
            </span>
            <h2 className="mt-3 font-display text-2xl font-extrabold text-navy-900">{form.title}</h2>
            {form.excerpt && (
              <p className="mt-3 border-l-4 border-safety-500 pl-4 text-sm font-medium text-navy-900/80">
                {form.excerpt}
              </p>
            )}
            {form.content ? (
              <div className="mt-5 blog-prose" dangerouslySetInnerHTML={{ __html: form.content }} />
            ) : (
              <p className="mt-5 py-8 text-center text-xs text-gray-400">No content yet — switch to Edit to write the guide.</p>
            )}
          </div>
        </AdminCard>
      ) : (
        <>
          <AdminCard title="Guide details">
            <div className="space-y-3.5">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Title *</span>
                <input
                  className={adminField}
                  value={form.title}
                  onChange={(e) => set({ title: e.target.value })}
                  placeholder="e.g. How to Choose the Right Safety Helmet"
                />
              </label>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-gray-500">Slug (URL) {isNew ? "(blank = auto)" : ""}</span>
                  <input className={adminField} value={form.slug} disabled={!isNew} onChange={(e) => set({ slug: e.target.value })} placeholder="how-to-choose-a-safety-helmet" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-gray-500">Category</span>
                  <input className={adminField} value={form.category} onChange={(e) => set({ category: e.target.value })} placeholder="Buying Guide" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-gray-500">Read time</span>
                  <input className={adminField} value={form.readTime} onChange={(e) => set({ readTime: e.target.value })} placeholder="5 min read" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-gray-500">Icon (list display)</span>
                  <select className={adminField} value={form.icon} onChange={(e) => set({ icon: e.target.value })}>
                    {["info", "helmet", "gloves", "goggles", "fire", "boots", "lab", "firstaid"].map((i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-gray-500">Excerpt (shown on the knowledge grid)</span>
                <textarea rows={3} className={adminField} value={form.excerpt} onChange={(e) => set({ excerpt: e.target.value })} />
              </label>
            </div>
          </AdminCard>

          <AdminCard
            title="Featured image"
            subtitle="Header photo for the guide page and card on the knowledge grid"
            action={
              form.image ? (
                <button
                  onClick={() => set({ image: "" })}
                  className="flex items-center gap-1 rounded-lg border border-danger/30 px-3 py-1.5 text-[11px] font-bold text-danger hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              ) : undefined
            }
          >
            <CoverImagePicker current={form.image} onPick={(path) => set({ image: path })} />
          </AdminCard>

          <AdminCard title="Content" subtitle="Rich text editor with headings, lists, links and images">
            <RichTextEditor value={form.content} onChange={(html) => set({ content: html })} />
          </AdminCard>
        </>
      )}
    </div>
  );
}
