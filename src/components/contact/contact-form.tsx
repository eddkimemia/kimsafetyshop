"use client";

import { useState } from "react";
import { Send, Check, Loader2 } from "lucide-react";

const field =
  "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none transition-all focus:border-safety-400 focus:ring-4 focus:ring-safety-500/10";

const TOPICS = ["Sales & quotations", "Order status", "Bulk / corporate", "Technical advice", "Returns", "Other"];

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", topic: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Failed to send your message");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-7 py-14 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white">
          <Check className="h-7 w-7 text-emerald-600" />
        </div>
        <h2 className="font-display text-xl font-extrabold text-navy-900">Message sent!</h2>
        <p className="mt-2 max-w-md text-sm text-gray-500">
          Thanks, {form.name.split(" ")[0] || "there"} — a real human will reply to{" "}
          <strong className="text-navy-900">{form.email}</strong> within the hour during business
          time.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger sm:col-span-2">
          {error}
        </p>
      )}
      <input
        required
        placeholder="Full name *"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className={field}
      />
      <input
        required
        type="email"
        placeholder="Email address *"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className={field}
      />
      <input
        type="tel"
        placeholder="Phone number"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className={field}
      />
      <select
        required
        value={form.topic}
        onChange={(e) => setForm({ ...form, topic: e.target.value })}
        className={field}
      >
        <option value="" disabled>Topic *</option>
        {TOPICS.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>
      <textarea
        required
        rows={5}
        placeholder="How can we help? *"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className={`${field} sm:col-span-2`}
      />
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-safety-500 px-8 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(245,124,0,0.35)] transition-colors hover:bg-safety-600 disabled:opacity-60 sm:col-span-2"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {saving ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}