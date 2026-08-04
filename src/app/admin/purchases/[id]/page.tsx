"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, FileText, Mail, Phone, CalendarClock, User, Truck, CircleDollarSign } from "lucide-react";
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

const fmtDate = (d: string | null, withYear = true) =>
  d
    ? new Date(d).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "long",
        year: withYear ? "numeric" : undefined,
      })
    : "—";

export default function AdminPurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, refresh } = useFetch<{ orders: SupplierOrder[] }>("/api/admin/supplier-orders");
  const [notice, setNotice] = useState<string | null>(null);
  const order = data?.orders.find((o) => o.id === id);

  const setStatus = async (status: string) => {
    if (!order) return;
    const res = await fetch("/api/admin/supplier-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: order.id, status }),
    });
    const json = await res.json().catch(() => ({}));
    setNotice(res.ok ? `${order.id} → ${status}` : json.error ?? "Update failed");
    refresh();
  };

  if (!loading && !order) {
    return (
      <div className="space-y-6">
        <Link href="/admin/purchases" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-safety-600">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to purchases
        </Link>
        <AdminCard title="Purchase order">
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <FileText className="h-7 w-7" />
            </span>
            <p className="text-sm text-gray-400">Purchase order {id} was not found.</p>
            <Link href="/admin/purchases" className="rounded-xl bg-safety-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-safety-600">
              View all purchase orders
            </Link>
          </div>
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/purchases" className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-safety-600">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to purchases
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Supplier purchase order</p>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="font-display text-2xl font-extrabold text-navy-900">{order?.id}</h1>
            {order && <StatusBadge status={order.status} map={statusTones} />}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {order?.supplier}
            {order?.contact_name ? ` · ${order.contact_name}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {order && (
            <select
              value={order.status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-line bg-white px-3 py-2.5 text-xs font-bold text-gray-600 outline-none focus:border-safety-400"
            >
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          )}
          {order && (
            <a
              href={`/api/admin/supplier-orders/${order.id}/pdf`}
              download={`kimsafety-supplier-po-${order.id}.pdf`}
              className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-navy-900 hover:bg-surface"
            >
              <Download className="h-4 w-4" /> Purchase order
            </a>
          )}
        </div>
      </div>

      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <AdminCard title="Supplier">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-safety-50 text-safety-600">
                  <Truck className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-bold text-navy-900">{order?.supplier}</p>
                  {order?.contact_name && <p className="text-xs text-gray-500">{order.contact_name}</p>}
                </div>
              </div>
              {order?.phone && (
                <div className="flex items-center gap-2.5 text-gray-600">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs">{order.phone}</span>
                </div>
              )}
              {order?.email && (
                <div className="flex items-center gap-2.5 text-gray-600">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  <a href={`mailto:${order.email}`} className="text-xs hover:text-safety-600">
                    {order.email}
                  </a>
                </div>
              )}
            </div>
          </AdminCard>

          <AdminCard title="Order details">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5 text-gray-600">
                <CalendarClock className="h-3.5 w-3.5 text-gray-400" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Expected delivery</p>
                  <p className="text-xs">{fmtDate(order?.expected_date ?? null)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-gray-600">
                <CircleDollarSign className="h-3.5 w-3.5 text-gray-400" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Issued</p>
                  <p className="text-xs">{fmtDate(order?.created_at ?? null)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-gray-600">
                <User className="h-3.5 w-3.5 text-gray-400" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Created</p>
                  <p className="text-xs">
                    {order
                      ? new Date(order.created_at).toLocaleDateString("en-KE", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "—"}
                  </p>
                </div>
              </div>
              {order?.notes && (
                <div className="rounded-xl bg-amber-50 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Notes</p>
                  <p className="mt-1 text-xs text-amber-800">{order.notes}</p>
                </div>
              )}
            </div>
          </AdminCard>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <AdminCard title={`Items (${order?.items.length ?? 0})`}>
            {loading ? (
              <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {order?.items.map((it, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-white p-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-navy-900">{it.name}</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {it.qty} × {formatKES(it.unitPrice)}
                        </p>
                      </div>
                      <p className="shrink-0 font-bold text-navy-900">{formatKES(it.unitPrice * it.qty)}</p>
                    </div>
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        <th className="pb-3">Item</th>
                        <th className="pb-3 text-right">Qty</th>
                        <th className="pb-3 text-right">Unit price</th>
                        <th className="pb-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order?.items.map((it, i) => (
                        <tr key={i} className="border-b border-line/60 last:border-0">
                          <td className="py-3 font-semibold text-navy-900">{it.name}</td>
                          <td className="py-3 text-right text-gray-500">{it.qty}</td>
                          <td className="py-3 text-right text-gray-500">{formatKES(it.unitPrice)}</td>
                          <td className="py-3 text-right font-bold text-navy-900">{formatKES(it.unitPrice * it.qty)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-5 space-y-2 text-sm">
                  <div className="flex items-center justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatKES(order?.subtotal ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500">
                    <span>Delivery / freight</span>
                    <span>{formatKES(order?.shipping ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-line pt-3 text-base font-extrabold text-navy-900">
                    <span>TOTAL</span>
                    <span>{formatKES(order?.total ?? 0)}</span>
                  </div>
                </div>
              </>
            )}
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
