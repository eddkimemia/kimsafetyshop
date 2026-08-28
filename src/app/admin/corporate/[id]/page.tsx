"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, Save, Trash2, User, ExternalLink } from "lucide-react";
import { AdminCard, adminField, StatusBadge, useFetch } from "@/components/admin/ui";

type CorporateAccount = {
  id: string;
  user_id: string | null;
  application_id: string | null;
  company: string;
  kra_pin: string | null;
  industry: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  discount_rate: number;
  credit_terms: string;
  account_manager: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type StaffUser = { id: string; name: string; email: string; role: string; referral_code?: string | null };

const accountStatuses = ["Active", "Paused", "Closed"];

const tones: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700",
  Paused: "bg-amber-50 text-amber-700",
  Closed: "bg-gray-100 text-gray-500",
};

export default function AdminCorporateDetailPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id ?? "");
  const router = useRouter();
  const { data, loading, error } = useFetch<{ account: CorporateAccount }>(`/api/admin/corporate/accounts?id=${encodeURIComponent(id)}`);
  const { data: usersData } = useFetch<{ users: StaffUser[] }>("/api/admin/users?staff=1");
  const staff = (usersData?.users ?? []).filter((u) => u.role === "admin" || u.role === "superadmin");

  const account = data?.account ?? null;

  const [form, setForm] = useState({
    company: "",
    kra_pin: "",
    industry: "",
    contact_name: "",
    phone: "",
    email: "",
    discount_rate: 0,
    credit_terms: "30 days",
    account_manager: "",
    notes: "",
    status: "Active",
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (account && !loaded) {
      setForm({
        company: account.company ?? "",
        kra_pin: account.kra_pin ?? "",
        industry: account.industry ?? "",
        contact_name: account.contact_name ?? "",
        phone: account.phone ?? "",
        email: account.email ?? "",
        discount_rate: account.discount_rate ?? 0,
        credit_terms: account.credit_terms ?? "30 days",
        account_manager: account.account_manager ?? "",
        notes: account.notes ?? "",
        status: account.status ?? "Active",
      });
      setLoaded(true);
    }
  }, [account, loaded]);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (!form.company.trim()) {
      setErr("Company name is required");
      return;
    }
    setSaving(true);
    setErr(null);
    const res = await fetch("/api/admin/corporate/accounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        company: form.company,
        kra_pin: form.kra_pin || null,
        industry: form.industry || null,
        contact_name: form.contact_name || null,
        phone: form.phone || null,
        email: form.email || null,
        discount_rate: Number(form.discount_rate) || 0,
        credit_terms: form.credit_terms || "30 days",
        account_manager: form.account_manager || null,
        notes: form.notes || null,
        status: form.status,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setErr(json.error ?? "Save failed");
      return;
    }
    setNotice(`${form.company} updated`);
    setTimeout(() => setNotice(null), 4000);
  };

  const remove = async () => {
    if (!account) return;
    if (!confirm(`Delete the ${account.company} corporate account? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/corporate/accounts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(json.error ?? "Delete failed");
      return;
    }
    router.push("/admin/corporate");
    router.refresh();
  };

  if (loading) return <p className="py-10 text-center text-sm text-gray-400">Loading corporate account…</p>;
  if (error || !account) {
    return (
      <div className="space-y-6">
        <Link href="/admin/corporate" className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-navy-900 hover:bg-surface">
          <ArrowLeft className="h-4 w-4" /> Back to corporate
        </Link>
        <AdminCard title="Not found">
          <p className="py-6 text-center text-sm text-gray-400">{error || `No corporate account ${id}.`}</p>
        </AdminCard>
      </div>
    );
  }

  // Find linked user slug for link
  const linkedUser = usersData?.users?.find((u) => u.id === account.user_id || (account.email && u.email.toLowerCase() === account.email.toLowerCase())) ?? null;
  const userSlug = linkedUser ? (linkedUser.referral_code ?? linkedUser.id.slice(0, 8)) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/corporate" className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-gray-500 hover:text-navy-900" aria-label="Back to corporate">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="flex flex-wrap items-center gap-2 font-display text-2xl font-extrabold text-navy-900">
              <Building2 className="h-5 w-5 text-safety-600" /> {account.company}
              <StatusBadge status={account.status} map={tones} />
            </h1>
            <p className="text-sm text-gray-500">{account.id} · {account.industry || "—"} {account.kra_pin ? `· PIN ${account.kra_pin}` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {userSlug && (
            <Link href={`/admin/users/${userSlug}`} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-navy-900 hover:bg-surface">
              <User className="h-3.5 w-3.5" /> View customer
            </Link>
          )}
          <button onClick={remove} className="inline-flex items-center gap-1.5 rounded-lg border border-danger/30 bg-red-50 px-3 py-2 text-xs font-bold text-danger hover:bg-red-100">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>

      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>}
      {err && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{err}</p>}

      <AdminCard title="Company — primary identifier" subtitle="Company name is the primary display name, not the contact person — all edits to the company are here">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-bold text-gray-500">Company name *</span>
            <input className={adminField} value={form.company} onChange={(e) => set({ company: e.target.value })} placeholder="e.g. Acme Construction Ltd" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-500">KRA PIN</span>
            <input className={adminField} value={form.kra_pin} onChange={(e) => set({ kra_pin: e.target.value })} placeholder="P000000000X" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-500">Industry</span>
            <input className={adminField} value={form.industry} onChange={(e) => set({ industry: e.target.value })} placeholder="e.g. Construction" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-500">Contact person (secondary)</span>
            <input className={adminField} value={form.contact_name} onChange={(e) => set({ contact_name: e.target.value })} placeholder="e.g. Jane Wanjiru" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-500">Phone</span>
            <input className={adminField} value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+254 7…" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-bold text-gray-500">Email</span>
            <input type="email" className={adminField} value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="procurement@acme.co.ke" />
          </label>
        </div>
      </AdminCard>

      <AdminCard title="Commercial terms">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-500">Discount %</span>
            <input type="number" min={0} max={100} className={adminField} value={form.discount_rate} onChange={(e) => set({ discount_rate: Number(e.target.value) })} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-bold text-gray-500">Credit terms</span>
            <input className={adminField} value={form.credit_terms} onChange={(e) => set({ credit_terms: e.target.value })} placeholder="30 days" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-bold text-gray-500">Account manager — choose from existing staff</span>
            <select className={adminField} value={form.account_manager} onChange={(e) => set({ account_manager: e.target.value })}>
              <option value="">— No manager —</option>
              {staff.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} — {s.email} ({s.role})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-gray-400">If the desired manager is not listed, type a custom name via API or add the staff at /admin/users.</p>
            {form.account_manager && !staff.some((s) => s.name === form.account_manager) && (
              <p className="mt-1 text-[11px] font-semibold text-amber-600">Current value “{form.account_manager}” is custom — not in staff list.</p>
            )}
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-500">Status</span>
            <select className={adminField} value={form.status} onChange={(e) => set({ status: e.target.value })}>
              {accountStatuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-3">
            <span className="mb-1 block text-xs font-bold text-gray-500">Notes</span>
            <textarea className={adminField} rows={3} value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Pricing notes, tender terms…" />
          </label>
        </div>
        <button onClick={save} disabled={saving} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-6 py-3 text-sm font-bold text-white hover:bg-safety-500 disabled:opacity-60">
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
        </button>
      </AdminCard>

      {account.user_id && (
        <AdminCard title="Linked customer login" subtitle="This corporate account is linked to a customer account for online ordering">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-navy-900">{account.email || linkedUser?.email || "—"}</p>
              <p className="text-xs text-gray-400">User ID: {account.user_id}</p>
            </div>
            {userSlug && (
              <Link href={`/admin/users/${userSlug}`} className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-navy-900 hover:bg-surface">
                <ExternalLink className="h-3.5 w-3.5" /> Open customer
              </Link>
            )}
          </div>
        </AdminCard>
      )}

      <div className="flex justify-between">
        <Link href="/admin/corporate" className="text-xs font-bold text-gray-500 hover:text-navy-900">← Back to all corporate accounts</Link>
        <Link href="/admin/corporate/new" className="text-xs font-bold text-safety-600 hover:underline">+ New corporate account</Link>
      </div>
    </div>
  );
}
