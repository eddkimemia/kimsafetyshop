"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Building2, ChevronRight, Crown, Download, Gift, KeyRound, Pencil, ShieldPlus, Trash2, User, UserPlus } from "lucide-react";
import { useFetch, AdminCard } from "@/components/admin/ui";

type CorporateInfo = {
  id: string;
  company: string;
  discount_rate: number;
  credit_terms: string;
  status: string;
  account_manager: string | null;
  email: string | null;
} | null;

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "superadmin";
  company: string | null;
  phone: string | null;
  verified: number;
  referral_code?: string | null;
  referred_by?: string | null;
  referred_by_name?: string | null;
  created_at: string;
  corporate?: CorporateInfo;
  isCorporate?: boolean;
};

function CorporateBadge({ corp }: { corp: CorporateInfo }) {
  if (!corp) return null;
  if (corp.status === "Active") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-navy-900 px-2.5 py-1 text-[10px] font-bold text-white">
        <Building2 className="h-3 w-3" /> Corporate · {corp.id}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
      <Building2 className="h-3 w-3" /> {corp.status} · {corp.id}
    </span>
  );
}

const sorts = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name-asc", label: "Name A → Z" },
  { value: "name-desc", label: "Name Z → A" },
] as const;

const selectCls =
  "rounded-lg border border-line bg-white px-2.5 py-2 text-xs font-bold text-navy-900 outline-none focus:border-safety-400";

function RoleBadge({ role }: { role: string }) {
  if (role === "superadmin") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-navy-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
        <Crown className="h-3 w-3" /> Superadmin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-safety-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-safety-700">
      <ShieldPlus className="h-3 w-3" /> Staff
    </span>
  );
}

export default function AdminUsersPage() {
  const { data, loading, refresh } = useFetch<{ users: AdminUser[] }>("/api/admin/users");
  const [me, setMe] = useState<{ id: string; role?: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<(typeof sorts)[number]["value"]>("newest");
  const users = useMemo(() => data?.users ?? [], [data]);

  useEffect(() => {
    fetch("/api/admin/me").then((r) => r.json()).then((s) => s?.user && setMe(s.user));
  }, []);

  const isSuper = me?.role === "superadmin";

  const sorted = useMemo(() => {
    const arr = [...users];
    switch (sort) {
      case "oldest":
        arr.sort((a, b) => a.created_at.localeCompare(b.created_at));
        break;
      case "name-asc":
        arr.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        arr.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        arr.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    return arr;
  }, [users, sort]);

  const superadmins = sorted.filter((u) => u.role === "superadmin");
  const staff = sorted.filter((u) => u.role === "admin");
  const customers = sorted.filter((u) => u.role === "user");
  const corporateCustomers = useMemo(() => customers.filter((c) => c.isCorporate), [customers]);
  const retailCustomers = useMemo(() => customers.filter((c) => !c.isCorporate), [customers]);

  const call = async (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) => {
    const res = await fn();
    if (res.ok) {
      setError(null);
      setNotice(okMsg);
    } else {
      setNotice(null);
      setError(res.error ?? "Update failed");
    }
    refresh();
  };

  const setRole = (u: AdminUser, role: "user" | "admin" | "superadmin") => {
    if (u.id === me?.id) {
      setNotice("You cannot change your own role.");
      return;
    }
    call(
      () =>
        fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: u.id, role }),
        }).then(async (r) => ({ ok: r.ok, error: (await r.json().catch(() => ({}))).error })),
      `${u.name} is now ${role}`
    );
  };

  const verify = (u: AdminUser) => {
    call(
      () =>
        fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: u.id, verified: true }),
        }).then(async (r) => ({ ok: r.ok, error: (await r.json().catch(() => ({}))).error })),
      `${u.name} verified`
    );
  };

  const resetPassword = (u: AdminUser) => {
    if (!confirm(`Email a password reset link to ${u.email}?`)) return;
    call(
      () =>
        fetch("/api/admin/users/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: u.id }),
        }).then(async (r) => ({ ok: r.ok, error: (await r.json().catch(() => ({}))).error })),
      `Password reset link sent to ${u.email}`
    );
  };

  const removeUser = (u: AdminUser) => {
    if (u.id === me?.id) {
      setNotice("You cannot delete your own account.");
      return;
    }
    if (!confirm(`Delete ${u.name} (${u.email})? This cannot be undone. Their orders and quotes are kept on file.`)) return;
    call(
      () =>
        fetch(`/api/admin/users?id=${encodeURIComponent(u.id)}`, { method: "DELETE" }).then(async (r) => ({
          ok: r.ok,
          error: (await r.json().catch(() => ({}))).error,
        })),
      `${u.name} deleted`
    );
  };

  const unverifiedCount = customers.filter((c) => !c.verified).length;
  const corporateUnverified = corporateCustomers.filter((c) => !c.verified).length;
  const retailUnverified = retailCustomers.filter((c) => !c.verified).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">Users</h1>
          <p className="text-sm text-gray-500">
            {users.length} accounts{isSuper ? ` · ${superadmins.length} superadmin · ${staff.length} staff` : ""} · {customers.length} customers
            <span className="hidden sm:inline"> · {corporateCustomers.length} corporate · {retailCustomers.length} retail</span>
            {unverifiedCount > 0 && <span className="font-bold text-amber-600"> · {unverifiedCount} pending verification</span>}
          </p>
          <p className="text-xs text-gray-400 sm:hidden">{corporateCustomers.length} corporate · {retailCustomers.length} retail</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="block">
            <span className="sr-only">Sort users</span>
            <select className={selectCls} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
              {sorts.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          {isSuper && (
            <a
              href="/api/admin/users/export"
              className="flex items-center gap-2 rounded-xl border border-safety-300 bg-safety-50 px-4 py-2.5 text-xs font-bold text-safety-700 hover:bg-safety-100"
            >
              <Download className="h-4 w-4" /> Export customers
            </a>
          )}
          {isSuper && (
            <Link
              href="/admin/users/new"
              className="flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-safety-500"
            >
              <UserPlus className="h-4 w-4" /> Create staff
            </Link>
          )}
        </div>
      </div>

      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">{error}</p>}

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
      ) : (
        <>
          {isSuper && (
            <AdminCard
              title="Superadmins"
              subtitle={`${superadmins.length} superadmin account${superadmins.length === 1 ? "" : "s"} · full system access · only visible to the superadmin`}
            >
              {superadmins.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">No superadmin accounts yet.</p>
              ) : (
                <>
                  <div className="space-y-3 md:hidden">
                    {superadmins.map((u) => (
                      <div key={u.id} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-white p-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy-700 to-navy-900 text-xs font-bold text-white">
                            {u.name.charAt(0)}
                          </span>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 font-semibold text-navy-900">
                              {u.name}
                              {u.id === me?.id && <span className="text-[10px] font-bold text-gray-400">(you)</span>}
                            </p>
                            <p className="truncate text-[11px] text-gray-400">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                            <p className="mt-0.5 text-[11px] text-gray-400">
                              <span className="font-semibold text-gray-500">Department:</span> {u.company ?? "—"} · {new Date(u.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                            <div className="mt-1.5"><RoleBadge role={u.role} /></div>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          {u.role === "superadmin" ? (
                            <button
                              onClick={() => setRole(u, "admin")}
                              disabled={u.id === me?.id}
                              className="rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-surface disabled:opacity-40"
                            >
                              Make admin
                            </button>
                          ) : (
                            <button
                              onClick={() => setRole(u, "superadmin")}
                              disabled={u.id === me?.id}
                              className="flex items-center gap-1 rounded-lg bg-navy-900 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-safety-500 disabled:opacity-40"
                            >
                              <Crown className="h-3 w-3" /> Make superadmin
                            </button>
                          )}
                          <button
                            onClick={() => setRole(u, "user")}
                            disabled={u.id === me?.id}
                            className="rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-surface disabled:opacity-40"
                          >
                            Make user
                          </button>
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/admin/users/${u.id}`}
                              className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-surface"
                            >
                              <Pencil className="h-3 w-3" /> Edit
                            </Link>
                            <button
                              onClick={() => resetPassword(u)}
                              className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-safety-600 hover:bg-safety-50"
                            >
                              <KeyRound className="h-3 w-3" /> Reset
                            </button>
                            <button
                              onClick={() => removeUser(u)}
                              disabled={u.id === me?.id}
                              className="flex items-center gap-1 rounded-lg border border-danger/30 px-2.5 py-1.5 text-[11px] font-bold text-danger hover:bg-red-50 disabled:opacity-40"
                            >
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                            <Link
                              href={`/admin/users/${u.id}`}
                              aria-label={`View ${u.name}`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line text-gray-400 hover:border-safety-400 hover:text-safety-600"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead>
                        <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          <th className="pb-3">User</th>
                          <th className="hidden pb-3 md:table-cell">Department</th>
                          <th className="pb-3">Role</th>
                          <th className="hidden pb-3 md:table-cell">Joined</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {superadmins.map((u) => (
                          <tr key={u.id} className="border-b border-line/60 last:border-0">
                            <td className="py-3.5">
                              <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy-700 to-navy-900 text-xs font-bold text-white">
                                  {u.name.charAt(0)}
                                </span>
                                <div>
                                  <p className="flex items-center gap-1.5 font-semibold text-navy-900">
                                    {u.name}
                                    {u.id === me?.id && <span className="text-[10px] font-bold text-gray-400">(you)</span>}
                                  </p>
                                  <p className="text-[11px] text-gray-400">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                                </div>
                              </div>
                            </td>
                            <td className="hidden py-3.5 text-gray-500 md:table-cell">{u.company ?? "—"}</td>
                            <td className="py-3.5"><RoleBadge role={u.role} /></td>
                            <td className="hidden py-3.5 text-gray-500 md:table-cell">{new Date(u.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</td>
                            <td className="py-3.5 text-right">
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                {u.role === "superadmin" ? (
                                  <button
                                    onClick={() => setRole(u, "admin")}
                                    disabled={u.id === me?.id}
                                    className="rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-surface disabled:opacity-40"
                                  >
                                    Make admin
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setRole(u, "superadmin")}
                                    disabled={u.id === me?.id}
                                    className="flex items-center gap-1 rounded-lg bg-navy-900 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-safety-500 disabled:opacity-40"
                                  >
                                    <Crown className="h-3 w-3" /> Make superadmin
                                  </button>
                                )}
                                <button
                                  onClick={() => setRole(u, "user")}
                                  disabled={u.id === me?.id}
                                  className="rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-surface disabled:opacity-40"
                                >
                                  Make user
                                </button>
                                <Link
                                  href={`/admin/users/${u.id}`}
                                  className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-surface"
                                >
                                  <Pencil className="h-3 w-3" /> Edit
                                </Link>
                                <button
                                  onClick={() => resetPassword(u)}
                                  className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-safety-600 hover:bg-safety-50"
                                >
                                  <KeyRound className="h-3 w-3" /> Reset
                                </button>
                                <button
                                  onClick={() => removeUser(u)}
                                  disabled={u.id === me?.id}
                                  className="flex items-center gap-1 rounded-lg border border-danger/30 px-2.5 py-1.5 text-[11px] font-bold text-danger hover:bg-red-50 disabled:opacity-40"
                                >
                                  <Trash2 className="h-3 w-3" /> Delete
                                </button>
                                <Link
                                  href={`/admin/users/${u.id}`}
                                  aria-label={`View ${u.name}`}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-400 hover:border-safety-400 hover:text-safety-600"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Link>
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
          )}
          {isSuper && (
            <AdminCard
              title="Staff"
              subtitle={`${staff.length} staff account${staff.length === 1 ? "" : "s"} · product, order & content management`}
            >
              {staff.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">No staff accounts yet.</p>
              ) : (
                <>
                  <div className="space-y-3 md:hidden">
                    {staff.map((u) => (
                      <div key={u.id} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-white p-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-safety-400 to-safety-600 text-xs font-bold text-white">
                            {u.name.charAt(0)}
                          </span>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 font-semibold text-navy-900">
                              {u.name}
                              {u.id === me?.id && <span className="text-[10px] font-bold text-gray-400">(you)</span>}
                            </p>
                            <p className="truncate text-[11px] text-gray-400">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                            <p className="mt-0.5 text-[11px] text-gray-400">
                              <span className="font-semibold text-gray-500">Department:</span> {u.company ?? "—"} · {new Date(u.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                            <div className="mt-1.5"><RoleBadge role={u.role} /></div>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <button
                            onClick={() => setRole(u, "superadmin")}
                            disabled={u.id === me?.id}
                            className="flex items-center gap-1 rounded-lg bg-navy-900 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-safety-500 disabled:opacity-40"
                          >
                            <Crown className="h-3 w-3" /> Make superadmin
                          </button>
                          <button
                            onClick={() => setRole(u, "user")}
                            disabled={u.id === me?.id}
                            className="rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-surface disabled:opacity-40"
                          >
                            Make user
                          </button>
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/admin/users/${u.id}`}
                              className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-surface"
                            >
                              <Pencil className="h-3 w-3" /> Edit
                            </Link>
                            <button
                              onClick={() => resetPassword(u)}
                              className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-safety-600 hover:bg-safety-50"
                            >
                              <KeyRound className="h-3 w-3" /> Reset
                            </button>
                            <button
                              onClick={() => removeUser(u)}
                              disabled={u.id === me?.id}
                              className="flex items-center gap-1 rounded-lg border border-danger/30 px-2.5 py-1.5 text-[11px] font-bold text-danger hover:bg-red-50 disabled:opacity-40"
                            >
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                            <Link
                              href={`/admin/users/${u.id}`}
                              aria-label={`View ${u.name}`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line text-gray-400 hover:border-safety-400 hover:text-safety-600"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead>
                        <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          <th className="pb-3">User</th>
                          <th className="hidden pb-3 md:table-cell">Department</th>
                          <th className="pb-3">Role</th>
                          <th className="hidden pb-3 md:table-cell">Joined</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staff.map((u) => (
                          <tr key={u.id} className="border-b border-line/60 last:border-0">
                            <td className="py-3.5">
                              <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-safety-400 to-safety-600 text-xs font-bold text-white">
                                  {u.name.charAt(0)}
                                </span>
                                <div>
                                  <p className="flex items-center gap-1.5 font-semibold text-navy-900">
                                    {u.name}
                                    {u.id === me?.id && <span className="text-[10px] font-bold text-gray-400">(you)</span>}
                                  </p>
                                  <p className="text-[11px] text-gray-400">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                                </div>
                              </div>
                            </td>
                            <td className="hidden py-3.5 text-gray-500 md:table-cell">{u.company ?? "—"}</td>
                            <td className="py-3.5"><RoleBadge role={u.role} /></td>
                            <td className="hidden py-3.5 text-gray-500 md:table-cell">{new Date(u.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</td>
                            <td className="py-3.5 text-right">
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setRole(u, "superadmin")}
                                  disabled={u.id === me?.id}
                                  className="flex items-center gap-1 rounded-lg bg-navy-900 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-safety-500 disabled:opacity-40"
                                >
                                  <Crown className="h-3 w-3" /> Make superadmin
                                </button>
                                <button
                                  onClick={() => setRole(u, "user")}
                                  disabled={u.id === me?.id}
                                  className="rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-surface disabled:opacity-40"
                                >
                                  Make user
                                </button>
                                <Link
                                  href={`/admin/users/${u.id}`}
                                  className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-surface"
                                >
                                  <Pencil className="h-3 w-3" /> Edit
                                </Link>
                                <button
                                  onClick={() => resetPassword(u)}
                                  className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-safety-600 hover:bg-safety-50"
                                >
                                  <KeyRound className="h-3 w-3" /> Reset
                                </button>
                                <button
                                  onClick={() => removeUser(u)}
                                  disabled={u.id === me?.id}
                                  className="flex items-center gap-1 rounded-lg border border-danger/30 px-2.5 py-1.5 text-[11px] font-bold text-danger hover:bg-red-50 disabled:opacity-40"
                                >
                                  <Trash2 className="h-3 w-3" /> Delete
                                </button>
                                <Link
                                  href={`/admin/users/${u.id}`}
                                  aria-label={`View ${u.name}`}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-400 hover:border-safety-400 hover:text-safety-600"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Link>
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
          )}

          <AdminCard
            title={`Corporate customers · ${corporateCustomers.length}`}
            subtitle={`${corporateCustomers.length} active corporate account${corporateCustomers.length === 1 ? "" : "s"} · linked to corporate_accounts (discount & credit terms)`}
            action={
              <div className="flex items-center gap-2">
                <Link href="/admin/corporate" className="hidden items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-navy-900 hover:bg-surface sm:flex">
                  <Building2 className="h-3.5 w-3.5" /> Manage corporate
                </Link>
                {isSuper && (
                  <a
                    href="/api/admin/users/export"
                    className="flex items-center gap-1.5 rounded-lg border border-safety-300 bg-safety-50 px-3 py-2 text-xs font-bold text-safety-700 hover:bg-safety-100"
                  >
                    <Download className="h-3.5 w-3.5" /> Export
                  </a>
                )}
              </div>
            }
          >
            {corporateCustomers.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">No corporate customers — approve an application at <Link href="/admin/corporate" className="font-bold text-safety-600 hover:underline">Corporate</Link> or create a corporate account.</p>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {corporateCustomers.map((u) => (
                    <div key={u.id} className="rounded-xl border border-navy-900/10 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white">
                            <Building2 className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-navy-900">{u.name}</p>
                            <p className="truncate text-[11px] text-gray-400">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                            <p className="truncate text-[11px] font-semibold text-navy-700">{u.company ?? u.corporate?.company ?? "—"}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <CorporateBadge corp={u.corporate ?? null} />
                          {u.verified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                              <BadgeCheck className="h-3 w-3" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                              <User className="h-3 w-3" /> Unverified
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                        <span>{u.corporate ? `${u.corporate.discount_rate}% off · ${u.corporate.credit_terms}` : "No terms"}</span>
                        {u.corporate?.account_manager && <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold text-gray-600">Mgr: {u.corporate.account_manager}</span>}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400">
                        Joined {new Date(u.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                        {u.referred_by_name && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-safety-50 px-2 py-0.5 text-[11px] font-bold text-safety-700"><Gift className="h-3 w-3" /> {u.referred_by_name}</span>}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {!u.verified && (
                          <button onClick={() => verify(u)} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">
                            <BadgeCheck className="h-3.5 w-3.5" /> Verify
                          </button>
                        )}
                        <Link href={`/admin/users/${u.id}`} className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-surface">
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Link>
                        <button onClick={() => resetPassword(u)} className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-safety-600 hover:bg-safety-50">
                          <KeyRound className="h-3.5 w-3.5" /> Reset
                        </button>
                        <Link href={`/admin/users/${u.id}`} aria-label={`View ${u.name}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-500 hover:border-safety-400 hover:text-safety-600">
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        <th className="pb-3">User</th>
                        <th className="hidden pb-3 lg:table-cell">Company</th>
                        <th className="hidden pb-3 xl:table-cell">Corporate account</th>
                        <th className="hidden pb-3 lg:table-cell">Joined</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {corporateCustomers.map((u) => (
                        <tr key={u.id} className="border-b border-line/60 last:border-0">
                          <td className="py-3.5">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white">
                                <Building2 className="h-4 w-4" />
                              </span>
                              <div>
                                <p className="font-semibold text-navy-900">{u.name}</p>
                                <p className="text-[11px] text-gray-400">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden py-3.5 text-gray-500 lg:table-cell">{u.company ?? u.corporate?.company ?? "—"}</td>
                          <td className="hidden py-3.5 xl:table-cell">
                            {u.corporate ? (
                              <div>
                                <CorporateBadge corp={u.corporate} />
                                <p className="mt-1 text-xs text-gray-500">{u.corporate.discount_rate}% off · {u.corporate.credit_terms}{u.corporate.account_manager ? ` · ${u.corporate.account_manager}` : ""}</p>
                              </div>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="hidden py-3.5 text-gray-500 lg:table-cell">{new Date(u.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</td>
                          <td className="py-3.5">
                            <div className="flex flex-col gap-1">
                              {u.verified ? (
                                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                  <BadgeCheck className="h-3 w-3" /> Verified
                                </span>
                              ) : (
                                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                                  <User className="h-3 w-3" /> Unverified
                                </span>
                              )}
                              {u.referred_by_name && (
                                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-safety-50 px-2 py-0.5 text-[10px] font-bold text-safety-700"><Gift className="h-3 w-3" /> {u.referred_by_name}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              {!u.verified && (
                                <button onClick={() => verify(u)} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">
                                  <BadgeCheck className="h-3.5 w-3.5" /> Verify
                                </button>
                              )}
                              <Link href={`/admin/users/${u.id}`} className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-surface">
                                <Pencil className="h-3.5 w-3.5" /> Edit
                              </Link>
                              <button onClick={() => resetPassword(u)} className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-safety-600 hover:bg-safety-50">
                                <KeyRound className="h-3.5 w-3.5" /> Reset
                              </button>
                              {isSuper && (
                                <button onClick={() => removeUser(u)} className="flex items-center gap-1 rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-bold text-danger hover:bg-red-50">
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </button>
                              )}
                              <Link href={`/admin/users/${u.id}`} aria-label={`View ${u.name}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-400 hover:border-safety-400 hover:text-safety-600">
                                <ChevronRight className="h-4 w-4" />
                              </Link>
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

          <AdminCard
            title={`Retail customers · ${retailCustomers.length}`}
            subtitle={`${retailCustomers.length} individual/retail account${retailCustomers.length === 1 ? "" : "s"} · ${corporateUnverified + retailUnverified > 0 ? `${retailUnverified} pending verification` : "no corporate link"}`}
            action={
              isSuper ? (
                <a
                  href="/api/admin/users/export"
                  className="flex items-center gap-1.5 rounded-lg border border-safety-300 bg-safety-50 px-3 py-2 text-xs font-bold text-safety-700 hover:bg-safety-100"
                >
                  <Download className="h-3.5 w-3.5" /> Export retail
                </a>
              ) : undefined
            }
          >
            {retailCustomers.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">No retail customers — all customers are corporate.</p>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {retailCustomers.map((u) => (
                    <div key={u.id} className="rounded-xl border border-line bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-safety-400 to-safety-600 text-xs font-bold text-white">
                            {u.name.charAt(0)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-navy-900">{u.name}</p>
                            <p className="truncate text-[11px] text-gray-400">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                          </div>
                        </div>
                        {u.verified ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            <BadgeCheck className="h-3 w-3" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                            <User className="h-3 w-3" /> Unverified
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[11px] text-gray-400">
                        {u.company ?? "—"} · {new Date(u.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      {u.referred_by_name && (
                        <p className="mt-1"><span className="inline-flex items-center gap-1 rounded-full bg-safety-50 px-2 py-0.5 text-[11px] font-bold text-safety-700"><Gift className="h-3 w-3" /> {u.referred_by_name}</span></p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {!u.verified && (
                          <button
                            onClick={() => verify(u)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                          >
                            <BadgeCheck className="h-3.5 w-3.5" /> Verify
                          </button>
                        )}
                        {isSuper && (
                          <button onClick={() => setRole(u, "admin")} className="flex items-center gap-1 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-safety-500">
                            <ShieldPlus className="h-3.5 w-3.5" /> Make staff
                          </button>
                        )}
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-surface"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Link>
                        <button
                          onClick={() => resetPassword(u)}
                          className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-safety-600 hover:bg-safety-50"
                        >
                          <KeyRound className="h-3.5 w-3.5" /> Reset password
                        </button>
                        {isSuper && (
                          <button
                            onClick={() => removeUser(u)}
                            className="flex items-center gap-1 rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-bold text-danger hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        )}
                        <Link
                          href={`/admin/users/${u.id}`}
                          aria-label={`View ${u.name}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-500 hover:border-safety-400 hover:text-safety-600"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[700px] text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        <th className="pb-3">User</th>
                        <th className="hidden pb-3 lg:table-cell">Company</th>
                        <th className="hidden pb-3 xl:table-cell">Referred by</th>
                        <th className="hidden pb-3 lg:table-cell">Joined</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {retailCustomers.map((u) => (
                        <tr key={u.id} className="border-b border-line/60 last:border-0">
                          <td className="py-3.5">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-safety-400 to-safety-600 text-xs font-bold text-white">
                                {u.name.charAt(0)}
                              </span>
                              <div>
                                <p className="font-semibold text-navy-900">{u.name}</p>
                                <p className="text-[11px] text-gray-400">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden py-3.5 text-gray-500 lg:table-cell">{u.company ?? "—"}</td>
                          <td className="hidden py-3.5 xl:table-cell">
                            {u.referred_by_name ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-safety-50 px-2.5 py-1 text-[11px] font-bold text-safety-700">
                                <Gift className="h-3 w-3" /> {u.referred_by_name}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="hidden py-3.5 text-gray-500 lg:table-cell">{new Date(u.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</td>
                          <td className="py-3.5">
                            {u.verified ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                <BadgeCheck className="h-3 w-3" /> Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                                <User className="h-3 w-3" /> Unverified
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              {!u.verified && (
                                <button
                                  onClick={() => verify(u)}
                                  className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                                >
                                  <BadgeCheck className="h-3.5 w-3.5" /> Verify
                                </button>
                              )}
                              {isSuper && (
                                <button onClick={() => setRole(u, "admin")} className="flex items-center gap-1 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-safety-500">
                                  <ShieldPlus className="h-3.5 w-3.5" /> Make staff
                                </button>
                              )}
                              <Link
                                href={`/admin/users/${u.id}`}
                                className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-surface"
                              >
                                <Pencil className="h-3.5 w-3.5" /> Edit
                              </Link>
                              <button
                                onClick={() => resetPassword(u)}
                                className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-safety-600 hover:bg-safety-50"
                              >
                                <KeyRound className="h-3.5 w-3.5" /> Reset
                              </button>
                              {isSuper && (
                                <button
                                  onClick={() => removeUser(u)}
                                  className="flex items-center gap-1 rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-bold text-danger hover:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </button>
                              )}
                              <Link
                                href={`/admin/users/${u.id}`}
                                aria-label={`View ${u.name}`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-400 hover:border-safety-400 hover:text-safety-600"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Link>
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
        </>
      )}
    </div>
  );
}
