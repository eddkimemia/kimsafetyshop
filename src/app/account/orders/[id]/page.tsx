"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Clock, Download, MapPin, Phone, Truck, X, FileText } from "lucide-react";
import { cn, formatKES } from "@/lib/utils";
import { AccountShell } from "@/components/account/account-shell";
import type { AccountOrder } from "@/components/account/account-shell";

const STATUS_STYLE: Record<string, string> = {
  Delivered: "bg-emerald-50 text-emerald-700",
  "In transit": "bg-safety-50 text-safety-700",
  Processing: "bg-amber-50 text-amber-700",
  Cancelled: "bg-red-50 text-danger",
};

export default function AccountOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<AccountOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/orders?id=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setOrder(d?.order ?? null);
        if (!d?.order) setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <AccountShell>
      <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
        <Link href="/account/orders" className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-safety-600 hover:text-safety-700">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to orders
        </Link>

        {loading ? (
          <p className="py-8 text-center text-sm text-gray-400">Loading order…</p>
        ) : error || !order ? (
          <p className="py-8 text-center text-sm text-gray-400">Order not found.</p>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
              <div>
                <h2 className="font-display text-lg font-extrabold text-navy-900">Order #{order.id}</h2>
                <p className="mt-0.5 text-xs text-gray-400">
                  Placed on {new Date(order.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })} · {order.payment.toUpperCase()} payment
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold", STATUS_STYLE[order.status] ?? "bg-surface text-gray-600")}>
                  {order.status === "Delivered" ? <Check className="h-3 w-3" /> : order.status === "In transit" ? <Truck className="h-3 w-3" /> : order.status === "Cancelled" ? <X className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {order.status}
                </span>
                <a
                  href={`/api/orders/${order.id}/invoice`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-xs font-bold text-navy-900 hover:bg-surface"
                >
                  <Download className="h-3.5 w-3.5" /> Download Invoice
                </a>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="pb-3">Product</th>
                    <th className="pb-3 text-center">Qty</th>
                    <th className="pb-3 text-right">Unit price</th>
                    <th className="pb-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((i, idx) => (
                    <tr key={`${i.productId}-${idx}`} className="border-b border-line/60 last:border-0">
                      <td className="py-3.5">
                        <p className="font-bold text-navy-900">{i.name}</p>
                        {i.sku && <p className="text-[11px] text-gray-400">{i.sku}</p>}
                      </td>
                      <td className="py-3.5 text-center text-gray-500">{i.qty}</td>
                      <td className="py-3.5 text-right text-gray-500">{i.price != null ? formatKES(i.price) : "—"}</td>
                      <td className="py-3.5 text-right font-bold text-navy-900">{formatKES((i.price ?? 0) * i.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-line p-4">
                <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <MapPin className="h-3.5 w-3.5" /> Delivery details
                </h3>
                <p className="text-sm font-bold text-navy-900">{order.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                  <Phone className="h-3 w-3" /> {order.phone}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-gray-500">{order.address}</p>
                {order.company && <p className="mt-2 text-xs text-gray-500">Company: {order.company}{order.po_ref ? ` · PO ${order.po_ref}` : ""}</p>}
              </div>
              <div className="rounded-xl border border-line p-4">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <FileText className="h-3.5 w-3.5" /> Payment summary
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Subtotal (full price)</dt>
                    <dd className="font-semibold text-navy-900">{formatKES(order.subtotal + order.discount)}</dd>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <dt>Discount</dt>
                      <dd className="font-bold">-{formatKES(order.discount)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Delivery</dt>
                    <dd className="font-semibold text-navy-900">{order.shipping === 0 ? "FREE" : formatKES(order.shipping)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-line pt-2 text-base">
                    <dt className="font-bold text-navy-900">Total</dt>
                    <dd className="font-display text-xl font-extrabold text-navy-900">{formatKES(order.total)}</dd>
                  </div>
                  <p className="text-[11px] text-gray-400">Payment: {order.payment.toUpperCase()} · {order.paid === 1 ? "PAID" : "UNPAID"}</p>
                </dl>
              </div>
            </div>
          </div>
        )}
      </section>
    </AccountShell>
  );
}
