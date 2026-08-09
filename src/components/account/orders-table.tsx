"use client";

import Link from "next/link";
import { Check, ChevronRight, Truck, X } from "lucide-react";
import { cn, formatKES } from "@/lib/utils";
import type { AccountOrder } from "@/components/account/account-shell";

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold",
        status === "Delivered" && "bg-emerald-50 text-emerald-700",
        status === "In transit" && "bg-safety-50 text-safety-700",
        status === "Processing" && "bg-amber-50 text-amber-700",
        status === "Cancelled" && "bg-red-50 text-danger"
      )}
    >
      {status === "Delivered" ? <Check className="h-3 w-3" /> : status === "In transit" ? <Truck className="h-3 w-3" /> : status === "Cancelled" ? <X className="h-3 w-3" /> : null}
      {status}
    </span>
  );
}

export function OrdersTable({ orders, loading, limit }: { orders: AccountOrder[]; loading: boolean; limit?: number }) {
  const rows = limit ? orders.slice(0, limit) : orders;
  if (loading) return <p className="py-8 text-center text-sm text-gray-400">Loading orders…</p>;
  if (orders.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        No orders yet — <Link href="/search" className="font-bold text-safety-600 hover:underline">start shopping</Link> and your orders will appear here.
      </p>
    );
  }
  return (
    <>
      {/* Card layout — no horizontal scroll on small/medium screens */}
      <div className="space-y-3 lg:hidden">
        {rows.map((o) => (
          <Link
            key={o.id}
            href={`/account/orders/${o.id}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-4 transition-colors hover:border-safety-400"
          >
            <div className="min-w-0">
              <p className="font-bold text-navy-900">#{o.id}</p>
              <p className="text-[11px] text-gray-400">
                {new Date(o.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })} · {(() => {
                  const count = o.items.reduce((s, i) => s + (i.qty || 0), 0);
                  return `${count} item${count === 1 ? "" : "s"}`;
                })()}
              </p>
              <div className="mt-1.5"><StatusBadge status={o.status} /></div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <p className="font-extrabold text-navy-900">{formatKES(o.total)}</p>
              <ChevronRight className="h-4 w-4 text-safety-500" />
            </div>
          </Link>
        ))}
      </div>

      {/* Table layout on large screens */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <th className="pb-3">Order</th>
              <th className="pb-3">Date</th>
              <th className="pb-3">Total</th>
              <th className="pb-3">Status</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-b border-line/60 last:border-0">
                <td className="py-3.5 font-bold text-navy-900">#{o.id}</td>
                <td className="py-3.5 text-gray-500">{new Date(o.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</td>
                <td className="py-3.5 font-bold text-navy-900">{formatKES(o.total)}</td>
                <td className="py-3.5"><StatusBadge status={o.status} /></td>
                <td className="py-3.5">
                  <Link href={`/account/orders/${o.id}`} className="flex items-center gap-1 text-xs font-bold text-safety-600 hover:text-safety-700">
                    Details <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
