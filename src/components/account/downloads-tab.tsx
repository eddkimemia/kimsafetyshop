"use client";

import { useEffect, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import type { OrderItem } from "@/components/account/account-shell";

type Order = { id: string; items: OrderItem[]; created_at: string };

type DatasheetRow = {
  orderId: string;
  productId: string;
  name: string;
  sku?: string;
  datasheetIndex?: number;
  orderDate: string;
};

export function DownloadsTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((d) => setOrders(d.orders ?? []))
      .finally(() => setLoading(false));
  }, []);

  const datasheets: DatasheetRow[] = [];
  const seen = new Set<string>();
  for (const o of orders) {
    for (const i of o.items) {
      const key = `${i.productId}-${i.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      datasheets.push({
        orderId: o.id,
        productId: i.productId,
        name: i.name ?? i.productId,
        sku: i.sku,
        datasheetIndex: i.datasheetIndex ?? -1,
        orderDate: o.created_at,
      });
    }
  }

  const datasheetUrl = (d: DatasheetRow) =>
    d.sku && d.datasheetIndex != null && d.datasheetIndex >= 0
      ? `/api/documents/${encodeURIComponent(d.sku)}/${d.datasheetIndex}`
      : `/api/documents/datasheet?sku=${encodeURIComponent(d.productId)}`;

  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
      <h2 className="font-display text-lg font-extrabold text-navy-900">Downloads</h2>
      <p className="text-xs text-gray-400">
        Product datasheets for everything you&apos;ve ordered.
      </p>

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading documents…</p>
      ) : datasheets.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          Datasheets appear here for products in your order history.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {datasheets.map((d) => (
            <div key={`${d.orderId}-${d.productId}-${d.name}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 shrink-0 text-safety-500" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-navy-900">{d.name}</p>
                  <p className="text-[11px] text-gray-400">
                    Datasheet · from order #{d.orderId} ·{" "}
                    {new Date(d.orderDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
              <a
                href={datasheetUrl(d)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-xs font-bold text-navy-900 transition-colors hover:bg-surface"
              >
                <Download className="h-3.5 w-3.5" /> Product Datasheet
              </a>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
