"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Package, ShoppingCart, Users, ClipboardList, AlertTriangle, TrendingUp } from "lucide-react";
import { useFetch, AdminCard, StatusBadge, orderStatusTones } from "@/components/admin/ui";
import { formatKES } from "@/lib/utils";

type Stats = {
  revenue: number;
  orders: number;
  pendingOrders: number;
  users: number;
  quotes: number;
  lowStock: number;
  products: number;
};

type Order = {
  id: string;
  name: string;
  email: string;
  items: { productId: string; name: string; qty: number; price: number }[];
  total: number;
  status: string;
  payment: string;
  created_at: string;
};

export default function AdminDashboardPage() {
  const { data: statsData, loading, refresh } = useFetch<{ stats: Stats }>("/api/admin/stats");
  const { data: ordersData } = useFetch<{ orders: Order[] }>("/api/admin/orders");
  const stats = statsData?.stats;
  const [sort, setSort] = useState("newest");

  const orders = useMemo(() => {
    const arr = [...(ordersData?.orders ?? [])];
    switch (sort) {
      case "oldest":
        arr.sort((a, b) => a.created_at.localeCompare(b.created_at));
        break;
      case "total-desc":
        arr.sort((a, b) => b.total - a.total);
        break;
      case "total-asc":
        arr.sort((a, b) => a.total - b.total);
        break;
      case "status":
        arr.sort((a, b) => a.status.localeCompare(b.status));
        break;
      default:
        arr.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    return arr;
  }, [ordersData, sort]);

  const recentOrders = orders.slice(0, 6);

  if (loading || !stats) {
    return <div className="py-20 text-center text-sm text-gray-400">Loading dashboard…</div>;
  }

  const cards = [
    [TrendingUp, "Total revenue", formatKES(stats.revenue), "Non-cancelled orders", "/admin/orders", "text-emerald-600"],
    [ShoppingCart, "Orders", String(stats.orders), `${stats.pendingOrders} pending`, "/admin/orders", "text-safety-500"],
    [Users, "Customers", String(stats.users), "Registered accounts", "/admin/users", "text-navy-800"],
    [ClipboardList, "Quotes", String(stats.quotes), "Requested quotations", "/admin/quotes", "text-amber-600"],
    [Package, "Products", String(stats.products), "Live catalog items", "/admin/products", "text-slate-600"],
    [AlertTriangle, "Low stock", String(stats.lowStock), "At or below threshold", "/admin/products", "text-danger"],
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-navy-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Store overview — refresh to pull the latest numbers.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([Icon, label, value, sub, href, tone]) => (
          <Link key={label} href={href} className="rounded-2xl border border-line bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover">
            <Icon className={`mb-3 h-5 w-5 ${tone}`} />
            <p className="text-xs text-gray-400">{label}</p>
            <p className="font-display text-2xl font-extrabold text-navy-900">{value}</p>
            <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-safety-600">
              {sub} <ArrowRight className="h-3 w-3" />
            </p>
          </Link>
        ))}
      </div>

      <AdminCard
        title="Recent orders"
        subtitle="Latest 6 across the store"
        action={
          <div className="flex items-center gap-2">
            <label className="block">
              <span className="sr-only">Sort recent orders</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-bold text-navy-900 outline-none focus:border-safety-400"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="total-desc">Highest total</option>
                <option value="total-asc">Lowest total</option>
                <option value="status">Status A → Z</option>
              </select>
            </label>
            <button onClick={refresh} className="text-xs font-bold text-safety-600">Refresh</button>
          </div>
        }
      >
        {!ordersData?.orders?.length ? (
          <p className="py-8 text-center text-sm text-gray-400">No orders yet — they appear here as customers check out.</p>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {recentOrders.map((o) => (
                <Link key={o.id} href={`/admin/orders/${encodeURIComponent(o.id)}`} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-white p-4 transition-colors hover:border-safety-400">
                  <div className="min-w-0">
                    <p className="font-bold text-navy-900">#{o.id}</p>
                    <p className="truncate text-sm text-gray-500">{o.name}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {o.items.reduce((s, i) => s + i.qty, 0)} units · {formatKES(o.total)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={o.status} map={orderStatusTones} />
                    <ArrowRight className="h-4 w-4 text-safety-500" />
                  </div>
                </Link>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="pb-3">Order</th>
                    <th className="pb-3">Customer</th>
                    <th className="hidden pb-3 md:table-cell">Items</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-line/60 last:border-0">
                      <td className="py-3 font-bold text-navy-900">
                        <Link href={`/admin/orders/${encodeURIComponent(o.id)}`} className="hover:text-safety-600">#{o.id}</Link>
                      </td>
                      <td className="py-3 text-gray-500">{o.name}</td>
                      <td className="hidden py-3 text-gray-500 md:table-cell">{o.items.reduce((s, i) => s + i.qty, 0)} units</td>
                      <td className="py-3 font-bold text-navy-900">{formatKES(o.total)}</td>
                      <td className="py-3"><StatusBadge status={o.status} map={orderStatusTones} /></td>
                      <td className="py-3 text-right">
                        <Link href={`/admin/orders/${encodeURIComponent(o.id)}`} aria-label={`Open order ${o.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-gray-500 transition-colors hover:border-safety-400 hover:text-safety-600">
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </AdminCard>
    </div>
  );
}
