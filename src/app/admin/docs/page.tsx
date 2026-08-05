"use client";

import { useEffect, useRef, useState } from "react";
import "quill/dist/quill.snow.css";
import { Download, FileText, Pencil, Stamp, Trash2 } from "lucide-react";
import { useFetch, AdminCard } from "@/components/admin/ui";

type Letter = {
  id: string;
  type: string;
  recipient_name: string;
  recipient_title: string | null;
  recipient_company: string | null;
  recipient_address: string | null;
  subject: string;
  salutation: string;
  body: string;
  closing: string;
  sender_name: string;
  sender_title: string | null;
  with_stamp: number;
  created_by: string;
  created_at: string;
};

const field =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm outline-none transition-all focus:border-safety-400 focus:bg-white focus:ring-4 focus:ring-safety-500/10";

const types = ["Official Letter", "Cover Letter", "Complaint Response", "Order Acknowledgement", "Delivery Schedule", "Terms & Conditions", "Business Introduction", "Payment Reminder", "Other"];

const initialForm = {
  type: "Official Letter",
  recipient_name: "",
  recipient_title: "",
  recipient_company: "",
  recipient_address: "",
  subject: "",
  salutation: "Dear Sir/Madam",
  body: "",
  closing: "Yours faithfully",
  sender_name: "",
  sender_title: "",
  with_stamp: false,
};

const plainText = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export default function AdminDocsPage() {
  const { data, loading, refresh } = useFetch<{ letters: Letter[] }>("/api/admin/letters");
  const [me, setMe] = useState<{ name?: string | null; role?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Letter | null>(null);
  const [sortBy, setSortBy] = useState("newest");
  const [form, setForm] = useState(initialForm);
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<import("quill").default | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => s?.user && setMe(s.user));
  }, []);

  useEffect(() => {
    if (!editorRef.current || quillRef.current || typeof window === "undefined") return;
    let cancelled = false;
    import("quill").then(({ default: Quill }) => {
      if (cancelled || !editorRef.current || quillRef.current) return;
      const q = new Quill(editorRef.current, {
        theme: "snow",
        placeholder: "Write the letter body here…",
        modules: {
          toolbar: [
            [{ header: [2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["blockquote", "code-block", "clean"],
          ],
        },
      });
      q.on("text-change", () => setForm((f) => ({ ...f, body: q.getSemanticHTML() })));
      quillRef.current = q;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (key: keyof typeof form, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const resetEditor = () => {
    setForm(initialForm);
    setEditing(null);
    if (quillRef.current) quillRef.current.root.innerHTML = "";
  };

  const startEdit = (l: Letter) => {
    setEditing(l);
    setForm({
      type: l.type,
      recipient_name: l.recipient_name,
      recipient_title: l.recipient_title ?? "",
      recipient_company: l.recipient_company ?? "",
      recipient_address: l.recipient_address ?? "",
      subject: l.subject,
      salutation: l.salutation,
      body: l.body,
      closing: l.closing,
      sender_name: l.sender_name,
      sender_title: l.sender_title ?? "",
      with_stamp: l.with_stamp === 1,
    });
    requestAnimationFrame(() => {
      if (quillRef.current) quillRef.current.root.innerHTML = l.body;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quillRef.current) return;
    const bodyHtml = quillRef.current.getSemanticHTML();
    if (!plainText(bodyHtml)) {
      setError("Letter body is required");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const payload = {
        ...form,
        body: bodyHtml,
        sender_name: form.sender_name || me?.name || "",
        subject: form.subject,
      };
      const res = editing
        ? await fetch(`/api/admin/letters?id=${encodeURIComponent(editing.id)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/letters", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Failed to save letter");
      const which = editing ? "updated" : "created";
      setNotice(`Letter ${json.letter?.id} ${which} — download the PDF below.`);
      resetEditor();
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save letter");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/admin/letters?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    setNotice(res.ok ? `Letter ${id} deleted` : json.error ?? "Delete failed");
    refresh();
  };

  const letters = data?.letters ?? [];

  const sorted = [...letters].sort((a, b) => {
    switch (sortBy) {
      case "oldest":
        return a.created_at.localeCompare(b.created_at);
      case "type":
        return a.type.localeCompare(b.type) || b.created_at.localeCompare(a.created_at);
      case "recipient":
        return a.recipient_name.localeCompare(b.recipient_name) || b.created_at.localeCompare(a.created_at);
      default:
        return b.created_at.localeCompare(a.created_at);
    }
  });

  const isSuperAdmin = me?.role === "superadmin";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold text-navy-900">
            <FileText className="h-5 w-5 text-safety-600" /> Official Documents
          </h1>
          <p className="text-sm text-gray-500">
            Compose letters on the company letterhead — recipient, reference, subject, body, signature and stamp are rendered into a PDF.
          </p>
        </div>
      </div>
      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{error}</p>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AdminCard
          title={editing ? `Edit letter ${editing.id}` : "New letter"}
          subtitle={editing ? "Changes replace the saved letter" : "All fields render on the letterhead PDF"}
        >
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="type" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">Letter type</label>
                <select id="type" value={form.type} onChange={(e) => set("type", e.target.value)} className={field}>
                  {types.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="salutation" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">Salutation</label>
                <input id="salutation" value={form.salutation} onChange={(e) => set("salutation", e.target.value)} className={field} />
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Recipient</p>
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-line bg-surface/50 p-3 sm:grid-cols-2">
                <input required placeholder="Recipient name *" value={form.recipient_name} onChange={(e) => set("recipient_name", e.target.value)} className={field} />
                <input placeholder="Recipient title / position" value={form.recipient_title} onChange={(e) => set("recipient_title", e.target.value)} className={field} />
                <input placeholder="Company / organization" value={form.recipient_company} onChange={(e) => set("recipient_company", e.target.value)} className={field} />
                <input placeholder="Address" value={form.recipient_address} onChange={(e) => set("recipient_address", e.target.value)} className={field} />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">Subject</label>
              <input
                id="subject"
                placeholder="Re: subject of the letter (shown in capitals)"
                value={form.subject}
                onChange={(e) => set("subject", e.target.value)}
                className={field}
              />
              <p className="mt-1 text-[11px] text-gray-400">Automatically converted to capital letters on the PDF.</p>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Body (rich text)</p>
              <div className="letter-editor overflow-hidden rounded-xl border border-line bg-white">
                <div ref={editorRef} className="min-h-[240px]" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="closing" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">Closing</label>
                <input id="closing" value={form.closing} onChange={(e) => set("closing", e.target.value)} className={field} />
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Sender / signatory</p>
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-line bg-surface/50 p-3 sm:grid-cols-2">
                <input placeholder={`Sender name (default: ${me?.name ?? "logged-in staff"})`} value={form.sender_name} onChange={(e) => set("sender_name", e.target.value)} className={field} />
                <input placeholder="Sender title (e.g. Sales Manager)" value={form.sender_title} onChange={(e) => set("sender_title", e.target.value)} className={field} />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-navy-900">
              <input
                type="checkbox"
                checked={form.with_stamp}
                onChange={(e) => set("with_stamp", e.target.checked)}
                className="h-4 w-4 accent-safety-500"
              />
              <Stamp className="h-4 w-4 text-safety-600" /> Print company stamp with issue date (off by default)
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-navy-900 py-3 text-sm font-bold text-white transition-colors hover:bg-safety-500 disabled:opacity-60"
              >
                <FileText className="h-4 w-4" />
                {saving ? "Saving…" : editing ? `Update letter ${editing.id}` : "Create letter"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={resetEditor}
                  className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-gray-500 hover:bg-surface"
                >
                  Cancel
                </button>
              )}
            </div>
            <p className="text-center text-[11px] text-gray-400">Reference and issue date are recorded automatically; the stamp is printed only when enabled.</p>
          </form>
        </AdminCard>

        <AdminCard
          title="Created letters"
          subtitle={
            isSuperAdmin
              ? `${letters.length} letter${letters.length === 1 ? "" : "s"} on record — all staff, edit, download or delete`
              : `${letters.length} letter${letters.length === 1 ? "" : "s"} you created — edit, download or delete`
          }
          action={
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500">
              Sort
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-bold text-navy-900 outline-none focus:border-safety-400"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="type">Type A–Z</option>
                <option value="recipient">Recipient A–Z</option>
              </select>
            </label>
          }
        >
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
          ) : letters.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No letters yet — compose one on the left.</p>
          ) : (
            <div className="space-y-2.5">
              {sorted.map((l) => (
                <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-bold text-navy-900">
                      <span className="truncate">{l.id}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-safety-700 ring-1 ring-safety-200">
                        {l.type}
                      </span>
                      {l.with_stamp === 1 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-gray-500 ring-1 ring-line">
                          <Stamp className="h-3 w-3" /> stamped
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      To: {l.recipient_name}
                      {l.recipient_company ? ` · ${l.recipient_company}` : ""} — {l.subject ? `RE: ${l.subject}` : "no subject"}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {new Date(l.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })} · signed {l.sender_name}
                      {isSuperAdmin && <span className="text-safety-600"> · by {l.created_by}</span>}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <a
                      href={`/api/admin/letters/pdf?id=${encodeURIComponent(l.id)}`}
                      download={`${l.id}.pdf`}
                      className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-navy-900 hover:bg-surface"
                    >
                      <Download className="h-3.5 w-3.5" /> Letter
                    </a>
                    <button
                      onClick={() => startEdit(l)}
                      aria-label={`Edit ${l.id}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-gray-500 hover:bg-navy-50 hover:text-navy-900"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(l.id)}
                      aria-label={`Delete ${l.id}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-gray-400 hover:bg-red-50 hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      </div>

      <style>{`
        .letter-editor .ql-toolbar { border: none; border-bottom: 1px solid var(--color-line, #e5e7eb); background: #f8fafc; border-radius: 0; }
        .letter-editor .ql-container { border: none; font-family: inherit; font-size: 14px; }
        .letter-editor .ql-editor { min-height: 240px; font-size: 14px; line-height: 1.6; }
        .letter-editor .ql-editor.ql-blank::before { font-style: italic; color: #9ca3af; }
      `}</style>
    </div>
  );
}
