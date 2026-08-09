"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Crown, KeyRound, ShieldPlus, User, UserPlus } from "lucide-react";
import { useFetch, AdminCard } from "@/components/admin/ui";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "superadmin";
  company: string | null;
  phone: string | null;
  verified: number;
  created_at: string;
};

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

  const staff = sorted.filter((u) => u.role === "admin" || u.role === "superadmin");
  const customers = sorted.filter((u) => u.role === "user");

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

  const unverifiedCount = customers.filter((c) => !c.verified).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">Users</h1>
          <p className="text-sm text-gray-500">
            {users.length} accounts{isSuper ? ` · ${staff.length} staff` : ""} · {customers.length} customers
            {unverifiedCount > 0 && <span className="font-bold text-amber-600"> · {unverifiedCount} pending verification</span>}
          </p>
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
              title="Staff & admins"
              subtitle={`${staff.length} account${staff.length === 1 ? "" : "s"} · only visible to the superadmin`}
            >
              {staff.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">No staff accounts yet.</p>
              ) : (
                <>
                  <div className="space-y-3 md:hidden">
                    {staff.map((u) => (
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
                          <button
                            onClick={() => resetPassword(u)}
                            className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-safety-600 hover:bg-safety-50"
                          >
                            <KeyRound className="h-3 w-3" /> Reset password
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[680px] text-sm">
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
                                <button
                                  onClick={() => resetPassword(u)}
                                  className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-safety-600 hover:bg-safety-50"
                                >
                                  <KeyRound className="h-3 w-3" /> Reset password
                                </button>
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
            title="Customers"
            subtitle={`${customers.length} account${customers.length === 1 ? "" : "s"} · verify new signups to mark them approved`}
          >
            {customers.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">No customer accounts yet.</p>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {customers.map((u) => (
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
                        <button
                          onClick={() => resetPassword(u)}
                          className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-safety-600 hover:bg-safety-50"
                        >
                          <KeyRound className="h-3.5 w-3.5" /> Reset password
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        <th className="pb-3">User</th>
                        <th className="hidden pb-3 lg:table-cell">Company</th>
                        <th className="hidden pb-3 lg:table-cell">Joined</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((u) => (
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
                              <button
                                onClick={() => resetPassword(u)}
                                className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-safety-600 hover:bg-safety-50"
                              >
                                <KeyRound className="h-3.5 w-3.5" /> Reset password
                              </button>
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
