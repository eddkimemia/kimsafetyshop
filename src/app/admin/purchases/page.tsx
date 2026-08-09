"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, PackagePlus, Truck, ChevronRight, Trash2 } from "lucide-react";
import { useFetch, AdminCard, StatusBadge } from "@/components/admin/ui";
import { formatKES } from "@/lib/utils";

type SupplierOrder = {
  id: string;
  supplier: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  items: { name: string; qty: number; unitPrice: number }[];
  subtotal: number;
  shipping: number;
  total: number;
  expected_date: string | null;
  notes: string | null;
  status: string;
  created_by_id: string | null;
  created_at: string;
};

const statuses = ["Draft", "Sent", "Confirmed", "Received", "Cancelled"];

const statusTones: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-600",
  Sent: "bg-sky-50 text-sky-700",
  Confirmed: "bg-violet-50 text-violet-700",
  Received: "bg-emerald-50 text-emerald-700",
  Cancelled: "bg-red-50 text-red-600",
};

export default function AdminPurchasesPage() {
  const { data, loading, refresh } = useFetch<{ orders: SupplierOrder[] }>("/api/admin/supplier-orders");
  const [notice, setNotice] = useState<string | null>(null);
  const [me, setMe] = useState<{ id?: string; role?: string } | null>(null);
  const orders = data?.orders ?? [];

  useEffect(() => {
    fetch("/api/admin/me").then((r) => r.json()).then((s) => s?.user && setMe(s.user));
  }, []);

  const setStatus = async (id: string, status: string) => {
    const res = await fetch("/api/admin/supplier-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const json = await res.json().catch(() => ({}));
    setNotice(res.ok ? `Purchase order ${id} → ${status}` : json.error ?? "Update failed");
    refresh();
  };

  const del = async (id: string) => {
    if (!window.confirm(`Delete purchase order ${id}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/supplier-orders?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    setNotice(res.ok ? `Purchase order ${id} deleted` : json.error ?? "Delete failed");
    refresh();
  };

  const canDelete = (o: SupplierOrder) => me?.role === "superadmin" || (!!o.created_by_id && o.created_by_id === me?.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">Supplier Purchase Orders</h1>
          <p className="text-sm text-gray-500">{orders.length} orders · purchase orders issued to suppliers for stock</p>
        </div>
        <Link
          href="/admin/purchases/new"
          className="flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-3 text-sm font-bold text-white hover:bg-safety-500"
        >
          <Plus className="h-4 w-4" /> New Purchase Order
        </Link>
      </div>

      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>}

      <AdminCard title="Orders">
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-safety-50 text-safety-600">
              <PackagePlus className="h-7 w-7" />
            </span>
            <p className="text-sm text-gray-400">No supplier purchase orders yet.</p>
            <Link href="/admin/purchases/new" className="rounded-xl bg-safety-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-safety-600">
              Create the first one
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {orders.map((o) => (
                <div key={o.id} className="rounded-xl border border-line bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/admin/purchases/${o.id}`} className="min-w-0 font-mono text-xs font-bold text-navy-900 underline-offset-2 hover:text-safety-600 hover:underline">
                      {o.id}
                    </Link>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={o.status} map={statusTones} />
                      {canDelete(o) && (
                        <button
                          onClick={() => del(o.id)}
                          aria-label={`Delete ${o.id}`}
                          className="rounded-lg border border-line bg-white p-1.5 text-gray-400 transition-colors hover:border-danger hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <Link href={`/admin/purchases/${o.id}`} className="mt-1 block font-semibold text-navy-900 underline-offset-2 hover:text-safety-600 hover:underline">
                    {o.supplier}
                  </Link>
                  {o.contact_name && <p className="text-[11px] text-gray-400">{o.contact_name}</p>}
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                    <span>
                      {o.items.length} line{o.items.length === 1 ? "" : "s"} · {o.items.reduce((s, i) => s + i.qty, 0)} units
                      {o.expected_date && <> · due {new Date(o.expected_date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</>}
                    </span>
                    <span className="font-bold text-navy-900">{formatKES(o.total)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-line/60 pt-3">
                    <label className="sr-only" htmlFor={`spo-status-${o.id}`}>Status</label>
                    <select
                      id={`spo-status-${o.id}`}
                      value={o.status}
                      onChange={(e) => setStatus(o.id, e.target.value)}
                      className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-bold text-gray-600 outline-none focus:border-safety-400"
                    >
                      {statuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <span className="text-[11px] text-gray-400">
                      {new Date(o.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <Link
                      href={`/admin/purchases/${o.id}`}
                      aria-label={`View purchase order ${o.id}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-400 transition-colors hover:border-safety-400 hover:text-safety-600"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[620px] text-sm lg:min-w-[820px]">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="pb-3">PO #</th>
                    <th className="pb-3">Supplier</th>
                    <th className="hidden pb-3 lg:table-cell">Items</th>
                    <th className="pb-3">Total</th>
                    <th className="hidden pb-3 xl:table-cell">Expected</th>
                    <th className="pb-3">Status</th>
                    <th className="hidden pb-3 xl:table-cell">Created</th>
                    <th className="pb-3 text-right">View</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-line/60 last:border-0">
                      <td className="py-3.5">
                        <Link href={`/admin/purchases/${o.id}`} className="font-mono text-xs font-bold text-navy-900 underline-offset-2 hover:text-safety-600 hover:underline">
                          {o.id}
                        </Link>
                      </td>
                      <td className="py-3.5">
                        <Link href={`/admin/purchases/${o.id}`} className="font-semibold text-navy-900 underline-offset-2 hover:text-safety-600 hover:underline">
                          {o.supplier}
                        </Link>
                        {o.contact_name && <p className="text-[11px] text-gray-400">{o.contact_name}</p>}
                      </td>
                      <td className="hidden py-3.5 text-gray-500 lg:table-cell">
                        {o.items.length} line{o.items.length === 1 ? "" : "s"} · {o.items.reduce((s, i) => s + i.qty, 0)} units
                      </td>
                      <td className="py-3.5 font-bold text-navy-900">{formatKES(o.total)}</td>
                      <td className="hidden py-3.5 text-gray-500 xl:table-cell">
                        {o.expected_date
                          ? new Date(o.expected_date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={o.status} map={statusTones} />
                          <label className="sr-only" htmlFor={`spo-status-${o.id}`}>Status</label>
                          <select
                            id={`spo-status-${o.id}`}
                            value={o.status}
                            onChange={(e) => setStatus(o.id, e.target.value)}
                            className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-bold text-gray-600 outline-none focus:border-safety-400"
                          >
                            {statuses.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="hidden py-3.5 text-gray-400 xl:table-cell">
                        {new Date(o.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canDelete(o) && (
                            <button
                              onClick={() => del(o.id)}
                              aria-label={`Delete ${o.id}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-400 transition-colors hover:border-danger hover:text-danger"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          <Link
                            href={`/admin/purchases/${o.id}`}
                            aria-label={`View purchase order ${o.id}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-400 transition-colors hover:border-safety-400 hover:text-safety-600"
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

      <p className="flex items-center gap-1.5 text-xs text-gray-400">
        <Truck className="h-3.5 w-3.5" /> Supplier orders track stock KimSafety purchases from vendors — separate from customer purchase orders in Corporate Accounts.
      </p>
    </div>
  );
}
