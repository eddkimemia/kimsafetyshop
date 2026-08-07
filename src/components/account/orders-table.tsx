"use client";

import Link from "next/link";
import { Check, ChevronRight, Truck, X } from "lucide-react";
import { cn, formatKES } from "@/lib/utils";
import { getProduct } from "@/lib/data/products";
import { ProductArt } from "@/components/product/product-art";
import type { AccountOrder } from "@/components/account/account-shell";

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
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
            <th className="pb-3">Order</th>
            <th className="pb-3">Date</th>
            <th className="pb-3">Items</th>
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
              <td className="py-3.5">
                <div className="flex -space-x-2">
                  {o.items.slice(0, 4).map((i) => {
                    const p = getProduct(i.productId);
                    if (!p) return null;
                    return (
                      <span key={`${o.id}-${i.productId}`} className="h-9 w-9 overflow-hidden rounded-lg border-2 border-white shadow-sm">
                        <ProductArt tags={p.tags} categoryName={p.categoryName} brand={p.brand} sku={p.sku} className="h-full w-full" />
                      </span>
                    );
                  })}
                </div>
              </td>
              <td className="py-3.5 font-bold text-navy-900">{formatKES(o.total)}</td>
              <td className="py-3.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold",
                    o.status === "Delivered" && "bg-emerald-50 text-emerald-700",
                    o.status === "In transit" && "bg-safety-50 text-safety-700",
                    o.status === "Processing" && "bg-amber-50 text-amber-700",
                    o.status === "Cancelled" && "bg-red-50 text-danger"
                  )}
                >
                  {o.status === "Delivered" ? <Check className="h-3 w-3" /> : o.status === "In transit" ? <Truck className="h-3 w-3" /> : o.status === "Cancelled" ? <X className="h-3 w-3" /> : null}
                  {o.status}
                </span>
              </td>
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
  );
}
