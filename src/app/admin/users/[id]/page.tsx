"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  Crown,
  Gift,
  KeyRound,
  Pencil,
  ShieldPlus,
  Trash2,
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Package,
} from "lucide-react";
import { AdminCard, StatusBadge, orderStatusTones, useFetch } from "@/components/admin/ui";
import { formatKES } from "@/lib/utils";

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

type Order = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string;
  address: string;
  items: { productId: string; name: string; sku: string; qty: number; price: number; image?: string | null }[];
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  status: string;
  payment: string;
  paid: number;
  po_ref: string | null;
  company: string | null;
  created_at: string;
};

function RoleBadge({ role }: { role: string }) {
  if (role === "superadmin") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-navy-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
        <Crown className="h-3 w-3" /> Superadmin
      </span>
    );
  }
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-safety-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-safety-700">
        <ShieldPlus className="h-3 w-3" /> Staff
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-600">
      <User className="h-3 w-3" /> Customer
    </span>
  );
}

export default function AdminSingleUserPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id ?? "");
  const router = useRouter();

  const { data: userData, loading: userLoading, error: userError, refresh: refreshUser } = useFetch<{ user: AdminUser }>(
    `/api/admin/users?id=${encodeURIComponent(id)}`
  );
  const { data: ordersData, loading: ordersLoading } = useFetch<{ orders: Order[] }>(
    `/api/admin/orders?userId=${encodeURIComponent(id)}`
  );

  const [me, setMe] = useState<{ id: string; role?: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const user = userData?.user ?? null;
  const orders = useMemo(() => ordersData?.orders ?? [], [ordersData]);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((s) => s?.user && setMe(s.user))
      .catch(() => {});
  }, []);

  const isSuper = me?.role === "superadmin";
  const isSelf = me?.id === user?.id;

  const userSlug = user ? (user.referral_code ?? user.id.slice(0, 8)) : id;
  const editHref = `/admin/users/${encodeURIComponent(userSlug)}/edit`;
  const corpHref = user?.corporate ? `/admin/corporate/${encodeURIComponent(user.corporate.id)}` : null;
  const isCorporate = !!user?.isCorporate;

  const setRole = async (role: "user" | "admin" | "superadmin") => {
    if (!user) return;
    if (isSelf) {
      setNotice("You cannot change your own role.");
      return;
    }
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, role }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "Update failed");
      setNotice(null);
    } else {
      setNotice(`${user.name} is now ${role}`);
      setError(null);
    }
    refreshUser();
  };

  const verify = async () => {
    if (!user) return;
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, verified: true }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "Update failed");
      setNotice(null);
    } else {
      setNotice(`${user.name} verified`);
      setError(null);
    }
    refreshUser();
  };

  const resetPassword = async () => {
    if (!user) return;
    if (!confirm(`Email a password reset link to ${user.email}?`)) return;
    const res = await fetch("/api/admin/users/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "Reset failed");
      setNotice(null);
    } else {
      setNotice(`Password reset link sent to ${user.email}`);
      setError(null);
    }
  };

  const removeUser = async () => {
    if (!user) return;
    if (isSelf) {
      setNotice("You cannot delete your own account.");
      return;
    }
    if (!confirm(`Delete ${user.name} (${user.email})? This cannot be undone. Their orders and quotes are kept on file.`)) return;
    const res = await fetch(`/api/admin/users?id=${encodeURIComponent(user.id)}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "Delete failed");
      return;
    }
    router.push("/admin/users");
    router.refresh();
  };

  if (userLoading) return <p className="py-10 text-center text-sm text-gray-400">Loading user…</p>;
  if (userError || !user) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-navy-900 hover:bg-surface"
        >
          <ArrowLeft className="h-4 w-4" /> Back to users
        </Link>
        <AdminCard title="User not found">
          <p className="py-6 text-center text-sm text-gray-400">{userError || `No user matches ${id}.`}</p>
        </AdminCard>
      </div>
    );
  }

  const totalSpent = orders.reduce((n, o) => n + (o.total ?? 0), 0);
  const totalOrders = orders.length;

  return (
    <div className="space-y-6">
      {/* Header */}
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
            <h1 className="flex flex-wrap items-center gap-2 font-display text-2xl font-extrabold text-navy-900">
              {user.name}
              <RoleBadge role={user.role} />
              {user.isCorporate && user.corporate && (
                <span className="inline-flex items-center gap-1 rounded-full bg-navy-900 px-2.5 py-1 text-[10px] font-bold text-white">
                  <Building2 className="h-3 w-3" /> Corporate · {user.corporate.id}
                </span>
              )}
              {user.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                  <User className="h-3 w-3" /> Unverified
                </span>
              )}
              {isSelf && <span className="text-[10px] font-bold text-gray-400">(you)</span>}
            </h1>
            <p className="text-sm text-gray-500">
              {user.email}
              {user.phone ? ` · ${user.phone}` : ""} · joined{" "}
              {new Date(user.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!user.verified && user.role === "user" && (
            <button
              onClick={verify}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
            >
              <BadgeCheck className="h-4 w-4" /> Verify user
            </button>
          )}
          <button
            onClick={resetPassword}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-safety-600 hover:bg-safety-50"
          >
            <KeyRound className="h-4 w-4" /> Reset password
          </button>
        </div>
      </div>

      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: profile (view) + orders */}
        <div className="space-y-6 lg:col-span-2">
          <AdminCard
            title="Profile"
            subtitle={`${user.name} · ${user.email}${isCorporate ? " · corporate — company managed via Corporate" : ""}`}
            action={
              isCorporate && corpHref ? (
                <Link href={corpHref} className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-safety-500">
                  <Building2 className="h-3.5 w-3.5" /> Manage corporate
                </Link>
              ) : (
                <Link href={editHref} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-navy-900 hover:bg-surface">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
              )
            }
          >
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Full name</dt>
                <dd className="font-semibold text-navy-900">{user.name}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Email</dt>
                <dd className="font-semibold text-navy-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Phone</dt>
                <dd className="font-semibold text-navy-900">{user.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{user.role !== "user" ? "Department" : "Company"}</dt>
                <dd className="font-semibold text-navy-900">
                  {isCorporate && user.corporate ? user.corporate.company : user.company || "—"}
                  {isCorporate && <span className="ml-2 text-[10px] font-bold text-amber-600">(via Corporate)</span>}
                </dd>
              </div>
            </dl>
            {isCorporate && corpHref ? (
              <Link href={corpHref} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-xs font-bold text-white hover:bg-safety-500">
                <Building2 className="h-3.5 w-3.5" /> Manage {user.corporate!.company} in Corporate
              </Link>
            ) : (
              <Link href={editHref} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-xs font-bold text-white hover:bg-safety-500">
                <Pencil className="h-3.5 w-3.5" /> Edit profile
              </Link>
            )}
            {isCorporate && (
              <p className="mt-2 text-xs text-gray-400">Company, KRA PIN, industry, discount and manager are edited only at <Link href={corpHref!} className="font-bold text-safety-600 hover:underline">Corporate → {user.corporate!.id}</Link>.</p>
            )}
          </AdminCard>

          {/* Orders */}
          <AdminCard
            title={`Orders · ${totalOrders}`}
            subtitle={
              totalOrders
                ? `${totalSpent ? formatKES(totalSpent) + " total spent" : ""} · ${orders.filter((o) => o.paid === 1).length} paid · ${orders.filter((o) => o.status === "Delivered").length} delivered`
                : "No orders placed yet"
            }
          >
            {ordersLoading ? (
              <p className="py-8 text-center text-sm text-gray-400">Loading orders…</p>
            ) : orders.length === 0 ? (
              <div className="py-10 text-center">
                <Package className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm font-semibold text-navy-900">No orders yet</p>
                <p className="mt-1 text-xs text-gray-400">Orders placed by {user.name} will appear here.</p>
              </div>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="space-y-3 md:hidden">
                  {orders.map((o) => {
                    const itemCount = o.items.reduce((n, i) => n + i.qty, 0);
                    return (
                      <div key={o.id} className="rounded-xl border border-line bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <Link href={`/admin/orders/${o.id}`} className="font-bold text-navy-900 underline-offset-4 hover:underline">
                            #{o.id}
                          </Link>
                          <StatusBadge status={o.status} map={orderStatusTones} />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {new Date(o.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                          {o.payment.replace("-", " ")} · {o.paid === 1 ? <span className="font-bold text-emerald-600">Paid</span> : <span className="font-bold text-danger">Unpaid</span>}
                        </p>
                        <p className="mt-2 text-sm text-gray-600">
                          {itemCount} item{itemCount === 1 ? "" : "s"} · {o.items.length} line{o.items.length === 1 ? "" : "s"}
                        </p>
                        <p className="truncate text-xs text-gray-400">{o.items.map((i) => `${i.qty}x ${i.name}`).join("; ")}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="font-extrabold text-navy-900">{formatKES(o.total)}</span>
                          <Link
                            href={`/admin/orders/${o.id}`}
                            aria-label={`View order ${o.id}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-500 hover:border-safety-400 hover:text-safety-600"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        <th className="pb-3">Order</th>
                        <th className="pb-3">Items</th>
                        <th className="pb-3 text-right">Total</th>
                        <th className="pb-3">Payment</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => {
                        const itemCount = o.items.reduce((n, i) => n + i.qty, 0);
                        return (
                          <tr key={o.id} className="border-b border-line/60 last:border-0">
                            <td className="py-3.5">
                              <Link href={`/admin/orders/${o.id}`} className="font-bold text-navy-900 underline-offset-4 hover:underline">
                                #{o.id}
                              </Link>
                              <p className="text-[11px] text-gray-400">
                                {new Date(o.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </td>
                            <td className="py-3.5">
                              <p className="text-gray-600">
                                {itemCount} item{itemCount === 1 ? "" : "s"} · {o.items.length} line{o.items.length === 1 ? "" : "s"}
                              </p>
                              <p className="max-w-[260px] truncate text-[11px] text-gray-400">{o.items.map((i) => i.name).join(", ")}</p>
                            </td>
                            <td className="py-3.5 text-right font-extrabold text-navy-900">{formatKES(o.total)}</td>
                            <td className="py-3.5">
                              <span className="capitalize text-gray-600">{o.payment.replace("-", " ")}</span>
                              <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${o.paid === 1 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-danger"}`}>
                                {o.paid === 1 ? "Paid" : "Unpaid"}
                              </span>
                            </td>
                            <td className="py-3.5">
                              <StatusBadge status={o.status} map={orderStatusTones} />
                            </td>
                            <td className="py-3.5 text-right">
                              <Link
                                href={`/admin/orders/${o.id}`}
                                aria-label={`View order ${o.id}`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-400 hover:border-safety-400 hover:text-safety-600"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </AdminCard>
        </div>

        {/* Right: meta + actions */}
        <div className="space-y-6">
          <AdminCard title="Account details">
            <dl className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Email</dt>
                  <dd className="font-semibold text-navy-900">{user.email}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Phone</dt>
                  <dd className="font-semibold text-navy-900">{user.phone || "—"}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{user.role !== "user" ? "Department" : "Company"}</dt>
                  <dd className="font-semibold text-navy-900">{user.company || "—"}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Joined</dt>
                  <dd className="text-gray-600">{new Date(user.created_at).toLocaleString("en-KE")}</dd>
                </div>
              </div>
              {user.referral_code && (
                <div className="flex items-start gap-3">
                  <Gift className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <div>
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Referral code</dt>
                    <dd className="font-mono text-xs font-bold text-navy-900">{user.referral_code}</dd>
                  </div>
                </div>
              )}
              {user.referred_by_name && (
                <div className="flex items-start gap-3">
                  <Gift className="mt-0.5 h-4 w-4 shrink-0 text-safety-600" />
                  <div>
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Referred by</dt>
                    <dd className="inline-flex items-center gap-1 rounded-full bg-safety-50 px-2.5 py-1 text-xs font-bold text-safety-700">
                      <Gift className="h-3 w-3" /> {user.referred_by_name}
                    </dd>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Package className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Orders</dt>
                  <dd className="font-semibold text-navy-900">
                    {totalOrders} order{totalOrders === 1 ? "" : "s"} · {formatKES(totalSpent)} lifetime
                  </dd>
                </div>
              </div>
            </dl>
          </AdminCard>

          {user.corporate ? (
            <AdminCard
              title="Corporate account"
              subtitle={`${user.corporate.company} · ${user.corporate.status}`}
              action={
                <Link href="/admin/corporate" className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 text-[11px] font-bold text-navy-900 hover:bg-surface">
                  <Building2 className="h-3.5 w-3.5" /> Manage
                </Link>
              }
            >
              <dl className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Account ID</dt>
                    <dd className="font-mono text-xs font-bold text-navy-900">{user.corporate.id}</dd>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${user.corporate.status === "Active" ? "bg-emerald-50 text-emerald-700" : user.corporate.status === "Paused" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"}`}>{user.corporate.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Discount</dt>
                    <dd className="font-bold text-navy-900">{user.corporate.discount_rate > 0 ? `${user.corporate.discount_rate}% off` : "Standard"}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Credit terms</dt>
                    <dd className="font-semibold text-navy-900">{user.corporate.credit_terms}</dd>
                  </div>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Company</dt>
                  <dd className="font-semibold text-navy-900">{user.corporate.company}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Account manager</dt>
                  <dd className="font-semibold text-navy-900">{user.corporate.account_manager || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Corporate email</dt>
                  <dd className="text-gray-600">{user.corporate.email || "—"}</dd>
                </div>
                {!user.isCorporate && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">Linked account is {user.corporate.status} — discount not applied at checkout until Active.</p>
                )}
              </dl>
            </AdminCard>
          ) : (
            <AdminCard title="Corporate account" subtitle="No corporate link — retail customer">
              <p className="text-sm text-gray-500">This customer has no corporate account. Create or link one at <Link href="/admin/corporate" className="font-bold text-safety-600 hover:underline">Corporate → New account</Link> to enable negotiated pricing and credit terms.</p>
              {user.company && <p className="mt-2 text-xs text-gray-400">Company field: <span className="font-semibold text-navy-900">{user.company}</span> — not the same as an approved corporate account.</p>}
            </AdminCard>
          )}

          {/* Role mgmt */}
          <AdminCard title="Role & access">
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Current role: <RoleBadge role={user.role} />
              </p>
              {isSuper ? (
                <div className="flex flex-wrap gap-2">
                  {user.role !== "superadmin" && (
                    <button
                      onClick={() => setRole("superadmin")}
                      disabled={isSelf}
                      className="flex items-center gap-1 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-safety-500 disabled:opacity-40"
                    >
                      <Crown className="h-3.5 w-3.5" /> Make superadmin
                    </button>
                  )}
                  {user.role !== "admin" && (
                    <button
                      onClick={() => setRole("admin")}
                      disabled={isSelf}
                      className="flex items-center gap-1 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-safety-500 disabled:opacity-40"
                    >
                      <ShieldPlus className="h-3.5 w-3.5" /> Make staff
                    </button>
                  )}
                  {user.role !== "user" && (
                    <button
                      onClick={() => setRole("user")}
                      disabled={isSelf}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-surface disabled:opacity-40"
                    >
                      Make customer
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400">Only superadmin can change roles.</p>
              )}
              {isSelf && <p className="text-xs font-semibold text-amber-600">You cannot change your own role.</p>}
            </div>
          </AdminCard>

          {isSuper && (
            <AdminCard title="Danger zone">
              <button
                onClick={removeUser}
                disabled={isSelf}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-xs font-bold text-danger hover:bg-red-100 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" /> Delete user
              </button>
              <p className="mt-2 text-[11px] text-gray-400">Orders and quotes are kept on file. This cannot be undone.</p>
            </AdminCard>
          )}
        </div>
      </div>
    </div>
  );
}
