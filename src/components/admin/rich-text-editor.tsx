"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Code2,
  Upload,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const buttons = [
  { cmd: "bold", label: "Bold", icon: Bold },
  { cmd: "italic", label: "Italic", icon: Italic },
  { cmd: "underline", label: "Underline", icon: Underline },
  { cmd: "formatBlock", value: "h2", label: "Heading 2", icon: Heading2 },
  { cmd: "formatBlock", value: "h3", label: "Heading 3", icon: Heading3 },
  { cmd: "insertUnorderedList", label: "Bullet list", icon: List },
  { cmd: "insertOrderedList", label: "Numbered list", icon: ListOrdered },
  { cmd: "formatBlock", value: "blockquote", label: "Quote", icon: Quote },
];

export function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef("");
  const [mode, setMode] = useState<"edit" | "html">("edit");
  const [imageMenu, setImageMenu] = useState<"upload" | "link" | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value && lastEmitted.current !== value) {
      el.innerHTML = value;
    }
  }, [value]);

  const emit = () => {
    const html = ref.current?.innerHTML ?? "";
    lastEmitted.current = html;
    onChange(html);
  };

  const exec = (cmd: string, cmdValue?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, cmdValue);
    emit();
  };

  const insertLink = () => {
    const url = prompt("Link URL (e.g. /product/cellotape or https://…)");
    if (!url) return;
    exec("createLink", url);
  };

  const insertImageByUrl = () => {
    const url = imageUrl.trim();
    if (!url) return;
    exec("insertImage", url);
    setImageMenu(null);
    setImageUrl("");
    setImageError(null);
  };

  const onImageFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setUploading(true);
    setImageError(null);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/images", { method: "POST", body: fd });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error ?? "Upload failed");
        exec("insertImage", json.path as string);
      }
      setImageMenu(null);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const htmlMode = mode === "html";

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-surface/60 px-2 py-1.5">
        <button type="button" onClick={() => exec("undo")} aria-label="Undo" title="Undo" className="toolbar-btn">
          <Undo2 className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => exec("redo")} aria-label="Redo" title="Redo" className="toolbar-btn">
          <Redo2 className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-line" />
        {buttons.map((b) => {
          const Icon = b.icon;
          return (
            <button
              key={`${b.cmd}-${b.value ?? ""}`}
              type="button"
              aria-label={b.label}
              title={b.label}
              onClick={() => exec(b.cmd, b.value)}
              className="toolbar-btn"
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
        <span className="mx-1 h-5 w-px bg-line" />
        <button type="button" aria-label="Insert link" title="Insert link" onClick={insertLink} className="toolbar-btn">
          <Link2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Insert image"
          title="Insert image"
          onClick={() => setImageMenu((m) => (m === null ? "upload" : null))}
          className={cn("toolbar-btn", imageMenu && "bg-safety-500/15 text-safety-600")}
        >
          <ImageIcon className="h-4 w-4" />
        </button>
        <span className="ml-auto" />
        <button
          type="button"
          onClick={() => setMode((m) => (m === "edit" ? "html" : "edit"))}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors",
            htmlMode ? "bg-navy-900 text-white" : "text-gray-500 hover:bg-surface hover:text-navy-900"
          )}
        >
          <Code2 className="h-3.5 w-3.5" /> HTML
        </button>
      </div>

      {imageMenu && (
        <div className="border-b border-line bg-white px-3 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex rounded-xl border border-line bg-surface p-1">
              <button
                type="button"
                onClick={() => setImageMenu("upload")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                  imageMenu === "upload" ? "bg-navy-900 text-white" : "text-gray-500"
                )}
              >
                Upload
              </button>
              <button
                type="button"
                onClick={() => setImageMenu("link")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                  imageMenu === "link" ? "bg-navy-900 text-white" : "text-gray-500"
                )}
              >
                Image link
              </button>
            </div>
            <button
              type="button"
              onClick={() => { setImageMenu(null); setImageError(null); }}
              aria-label="Close image menu"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-surface hover:text-navy-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {imageMenu === "upload" ? (
            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-surface/60 px-4 py-5 text-xs font-bold text-gray-500 transition-colors hover:border-safety-400 hover:text-safety-600">
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading… (JPG, PNG, WEBP, GIF — max 8MB each)
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> Click to choose images — they will be inserted at the cursor
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                disabled={uploading}
                className="sr-only"
                onChange={onImageFiles}
              />
            </label>
          ) : (
            <div className="mt-3 flex gap-2">
              <input
                type="url"
                placeholder="Image URL (e.g. /api/uploads/Cellotape.jpg or https://…)"
                className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-safety-400 focus:ring-4 focus:ring-safety-500/10"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertImageByUrl(); } }}
              />
              <button
                type="button"
                onClick={insertImageByUrl}
                className="shrink-0 rounded-xl bg-navy-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-safety-500"
              >
                Insert
              </button>
            </div>
          )}
          {imageError && <p className="mt-2 text-xs font-semibold text-danger">{imageError}</p>}
        </div>
      )}

      {htmlMode ? (
        <textarea
          className="h-72 w-full resize-y bg-white px-4 py-3 font-mono text-xs leading-relaxed outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="<p>Write your article in HTML…</p>"
        />
      ) : (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          data-placeholder="Write your article…"
          className="prose-editor min-h-72 max-h-[28rem] overflow-auto px-4 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-safety-500/20 focus:ring-inset"
        />
      )}
      <p className="border-t border-line bg-surface/40 px-4 py-2 text-[11px] text-gray-400">
        Bold, italic, headings, lists, quotes, links and images. Switch to HTML for fine control — content is
        sanitized before saving.
      </p>
    </div>
  );
}
