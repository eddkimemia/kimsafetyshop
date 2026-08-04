"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { AdminCard, adminField } from "@/components/admin/ui";

export default function AdminCreateStaffPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", company: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(json.error ?? "Create failed");
      return;
    }
    router.push("/admin/users");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-gray-500 hover:text-navy-900"
            aria-label="Back to users"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-navy-900">Create staff account</h1>
            <p className="text-sm text-gray-500">New staff get admin access and are marked verified immediately</p>
          </div>
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{error}</p>}

      <AdminCard title="Staff details">
        <div className="space-y-3.5">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-500">Full name *</span>
            <input className={adminField} value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Jane Wanjiru" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-500">Email *</span>
            <input type="email" className={adminField} value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="jane@kimsafety.co.ke" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-500">Temporary password * (min 6 characters)</span>
            <input type="text" className={adminField} value={form.password} onChange={(e) => set({ password: e.target.value })} placeholder="Share securely with the staff member" />
          </label>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-gray-500">Phone</span>
              <input className={adminField} value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+254 7…" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-gray-500">Company / department</span>
              <input className={adminField} value={form.company} onChange={(e) => set({ company: e.target.value })} placeholder="KimSafety Ltd" />
            </label>
          </div>
        </div>
        <button
          onClick={submit}
          disabled={saving}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-6 py-3 text-sm font-bold text-white hover:bg-safety-500 disabled:opacity-60"
        >
          <ShieldCheck className="h-4 w-4" /> {saving ? "Creating…" : "Create staff account"}
        </button>
      </AdminCard>
    </div>
  );
}
