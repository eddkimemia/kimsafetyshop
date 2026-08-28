"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { AdminCard, adminField, useFetch } from "@/components/admin/ui";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "superadmin";
  company: string | null;
  phone: string | null;
  verified: number;
  referral_code?: string | null;
  created_at: string;
  corporate?: { id: string; company: string; status: string; discount_rate?: number; credit_terms?: string } | null;
  isCorporate?: boolean;
};

function userSlug(u: AdminUser) {
  return u.referral_code ?? u.id.slice(0, 8);
}

export default function AdminUserEditPage() {
  const params = useParams<{ id: string }>();
  const slug = decodeURIComponent(params.id ?? "");
  const router = useRouter();
  const { data, loading, error } = useFetch<{ user: AdminUser }>(`/api/admin/users?id=${encodeURIComponent(slug)}`);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });

  const user = data?.user ?? null;

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        company: user.company ?? "",
      });
    }
  }, [user]);

  const isCorporate = !!user?.isCorporate && !!user?.corporate;

  const save = async () => {
    if (!user) return;
    // Corporate company is single-source via /admin/corporate/* — do not update it from here
    const payload: Record<string, unknown> = { id: user.id, name: form.name, email: form.email, phone: form.phone };
    if (!isCorporate) payload.company = form.company;
    setSaving(true);
    setErr(null);
    setNotice(null);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setErr(json.error ?? "Update failed");
      return;
    }
    setNotice(`${form.name || user.name} updated`);
    router.push(`/admin/users/${encodeURIComponent(userSlug({ ...user, ...form } as AdminUser))}`);
    router.refresh();
  };

  if (loading) return <p className="py-10 text-center text-sm text-gray-400">Loading user…</p>;
  if (error || !user) {
    return (
      <div className="space-y-6">
        <Link href="/admin/users" className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-navy-900 hover:bg-surface">
          <ArrowLeft className="h-4 w-4" /> Back to users
        </Link>
        <AdminCard title="User not found">
          <p className="py-6 text-center text-sm text-gray-400">{error || `No user matches ${slug}.`}</p>
        </AdminCard>
      </div>
    );
  }

  const backHref = `/admin/users/${encodeURIComponent(userSlug(user))}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={backHref} className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-gray-500 hover:text-navy-900" aria-label="Back to user">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">Edit {user.name}</h1>
          <p className="text-sm text-gray-500">{user.email} · {user.role} {user.isCorporate ? "· corporate" : ""}</p>
        </div>
      </div>

      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>}
      {err && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">{err}</p>}

      {isCorporate && user.corporate && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-bold text-amber-800">Corporate account — company details are managed in one place</p>
          <p className="mt-1 text-xs text-amber-700">
            This customer is linked to corporate account{" "}
            <Link href={`/admin/corporate/${encodeURIComponent(user.corporate.id)}`} className="font-bold underline hover:text-amber-900">
              {user.corporate.company} · {user.corporate.id}
            </Link>{" "}
            — company, KRA PIN, industry, discount and manager are edited there. This form only updates the login (name/email/phone) for the corporate contact.
          </p>
        </div>
      )}

      <AdminCard title="Profile" subtitle={isCorporate ? "Corporate — company managed via Corporate account (see above)" : "Update the account's contact details — saved via /api/admin/users"}>
        <div className="space-y-3.5">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-500">Full name * {isCorporate && <span className="font-normal text-amber-600">· via Corporate</span>}</span>
            <input className={`${adminField} ${isCorporate ? "bg-gray-100 text-gray-500" : ""}`} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} disabled={!!isCorporate} title={isCorporate ? "Edit contact name via Corporate account" : undefined} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-gray-500">Email * {isCorporate && <span className="font-normal text-amber-600">· via Corporate</span>}</span>
            <input type="email" className={`${adminField} ${isCorporate ? "bg-gray-100 text-gray-500" : ""}`} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} disabled={!!isCorporate} title={isCorporate ? "Edit email via Corporate account" : undefined} />
          </label>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-gray-500">Phone {isCorporate && <span className="font-normal text-amber-600">· via Corporate</span>}</span>
              <input className={`${adminField} ${isCorporate ? "bg-gray-100 text-gray-500" : ""}`} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+254 7…" disabled={!!isCorporate} title={isCorporate ? "Edit phone via Corporate account" : undefined} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-gray-500">
                {user.role !== "user" ? "Department" : "Company"} {isCorporate && <span className="font-normal text-amber-600">· managed via Corporate</span>}
              </span>
              <input
                className={`${adminField} ${isCorporate ? "bg-gray-100 text-gray-500" : ""}`}
                value={isCorporate && user.corporate ? user.corporate.company : form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                placeholder={user.role !== "user" ? "e.g. Sales" : "e.g. Acme Ltd"}
                disabled={!!isCorporate}
                title={isCorporate ? "Edit company via Corporate account page" : undefined}
              />
              {isCorporate && (
                <p className="mt-1 text-[11px] text-gray-400">
                  To change company, KRA PIN, industry, discount or manager,{" "}
                  <Link href={`/admin/corporate/${encodeURIComponent(user.corporate!.id)}`} className="font-bold text-safety-600 hover:underline">
                    open {user.corporate!.id}
                  </Link>
                  .
                </p>
              )}
            </label>
          </div>
          <div className="flex gap-2">
            <Link href={backHref} className="flex flex-1 items-center justify-center rounded-xl border border-line px-6 py-3 text-sm font-bold text-navy-900 hover:bg-surface">
              Cancel
            </Link>
            {isCorporate ? (
              <Link href={`/admin/corporate/${encodeURIComponent(user.corporate!.id)}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-navy-900 px-6 py-3 text-sm font-bold text-white hover:bg-safety-500">
                <Save className="h-4 w-4" /> Manage in Corporate
              </Link>
            ) : (
              <button onClick={save} disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-navy-900 px-6 py-3 text-sm font-bold text-white hover:bg-safety-500 disabled:opacity-60">
                <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
              </button>
            )}
          </div>
        </div>
      </AdminCard>

      <p className="text-center text-xs text-gray-400">
        Corporate account fields (discount, credit terms, manager) are managed at <Link href="/admin/corporate" className="font-bold text-safety-600 hover:underline">Corporate</Link>.
      </p>
    </div>
  );
}
