"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Building2, Pencil, Trash2, User, ExternalLink, Mail, Phone, Percent, CreditCard, UserCheck, StickyNote } from "lucide-react";
import { AdminCard, StatusBadge, useFetch } from "@/components/admin/ui";
import { useState } from "react";

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

const tones: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700",
  Paused: "bg-amber-50 text-amber-700",
  Closed: "bg-gray-100 text-gray-500",
};

export default function AdminCorporateViewPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id ?? "");
  const { data, loading, error } = useFetch<{ account: CorporateAccount }>(`/api/admin/corporate/accounts?id=${encodeURIComponent(id)}`);
  const { data: usersData } = useFetch<{ users: StaffUser[] }>("/api/admin/users?staff=1");

  const account = data?.account ?? null;
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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

  const linkedUser = usersData?.users?.find((u) => u.id === account.user_id || (account.email && u.email.toLowerCase() === account.email.toLowerCase())) ?? null;
  const userSlug = linkedUser ? (linkedUser.referral_code ?? linkedUser.id.slice(0, 8)) : null;

  const remove = async () => {
    if (!confirm(`Delete the ${account.company} corporate account? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/corporate/accounts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    setDeleting(false);
    if (!res.ok) {
      setErr(json.error ?? "Delete failed");
      return;
    }
    window.location.href = "/admin/corporate";
  };

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
          <Link href={`/admin/corporate/${encodeURIComponent(id)}/edit`} className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-xs font-bold text-white hover:bg-safety-500">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Link>
          <button onClick={remove} disabled={deleting} className="inline-flex items-center gap-1.5 rounded-lg border border-danger/30 bg-red-50 px-3 py-2 text-xs font-bold text-danger hover:bg-red-100 disabled:opacity-60">
            <Trash2 className="h-3.5 w-3.5" /> {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      {err && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{err}</p>}

      <AdminCard title="Company — primary identifier" subtitle="Company name is the primary display name, not the contact person">
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400"><Building2 className="h-3.5 w-3.5" /> Company</dt>
            <dd className="font-display text-lg font-extrabold text-navy-900">{account.company}</dd>
            <dd className="text-xs text-gray-400">{account.id}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">KRA PIN</dt>
            <dd className="font-semibold text-navy-900">{account.kra_pin || "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Industry</dt>
            <dd className="font-semibold text-navy-900">{account.industry || "—"}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400"><User className="h-3.5 w-3.5" /> Contact person (secondary)</dt>
            <dd className="font-semibold text-navy-900">{account.contact_name || "—"}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400"><Phone className="h-3.5 w-3.5" /> Phone</dt>
            <dd className="font-semibold text-navy-900">{account.phone || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400"><Mail className="h-3.5 w-3.5" /> Email</dt>
            <dd className="font-semibold text-navy-900">{account.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Created</dt>
            <dd className="text-gray-600">{new Date(account.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Updated</dt>
            <dd className="text-gray-600">{new Date(account.updated_at).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}</dd>
          </div>
        </dl>
        <Link href={`/admin/corporate/${encodeURIComponent(id)}/edit`} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-xs font-bold text-white hover:bg-safety-500">
          <Pencil className="h-3.5 w-3.5" /> Edit company
        </Link>
      </AdminCard>

      <AdminCard title="Commercial terms">
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400"><Percent className="h-3.5 w-3.5" /> Discount</dt>
            <dd className="font-bold text-navy-900">{account.discount_rate > 0 ? `${account.discount_rate}% off` : "Standard"}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400"><CreditCard className="h-3.5 w-3.5" /> Credit terms</dt>
            <dd className="font-semibold text-navy-900">{account.credit_terms}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400"><UserCheck className="h-3.5 w-3.5" /> Account manager</dt>
            <dd className="font-semibold text-navy-900">{account.account_manager || "—"}</dd>
            <dd className="text-[11px] text-gray-400">Chosen from existing staff (admin/superadmin)</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Status</dt>
            <dd><StatusBadge status={account.status} map={tones} /></dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400"><StickyNote className="h-3.5 w-3.5" /> Notes</dt>
            <dd className="whitespace-pre-line text-gray-600">{account.notes || "—"}</dd>
          </div>
        </dl>
        <Link href={`/admin/corporate/${encodeURIComponent(id)}/edit`} className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-4 py-2 text-xs font-bold text-navy-900 hover:bg-surface">
          <Pencil className="h-3.5 w-3.5" /> Edit terms
        </Link>
      </AdminCard>

      {account.user_id ? (
        <AdminCard title="Linked customer login" subtitle="Corporate is the single source of truth — user profile is synced from here">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-navy-900">{account.email || linkedUser?.email || "—"}</p>
              <p className="text-xs text-gray-400">User ID: {account.user_id} {linkedUser ? `· ${linkedUser.name}` : ""}</p>
            </div>
            {userSlug ? (
              <Link href={`/admin/users/${userSlug}`} className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-navy-900 hover:bg-surface">
                <ExternalLink className="h-3.5 w-3.5" /> Open customer
              </Link>
            ) : (
              <span className="text-xs text-gray-400">No linked user found</span>
            )}
          </div>
        </AdminCard>
      ) : (
        <AdminCard title="Linked customer" subtitle="No login linked — create one from the edit page or via the account">
          <p className="text-sm text-gray-500">This corporate account has no customer login. Edit the account to provision one if needed.</p>
        </AdminCard>
      )}

      <div className="flex justify-between">
        <Link href="/admin/corporate" className="text-xs font-bold text-gray-500 hover:text-navy-900">← Back to all corporate accounts</Link>
        <Link href={`/admin/corporate/${encodeURIComponent(id)}/edit`} className="text-xs font-bold text-safety-600 hover:underline">Edit →</Link>
      </div>
    </div>
  );
}
