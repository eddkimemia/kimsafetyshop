"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { ChevronRight, Download } from "lucide-react";
import { useFetch, AdminCard, StatusBadge, orderStatusTones } from "@/components/admin/ui";
import { formatKES } from "@/lib/utils";

type Order = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string;
  address: string;
  items: { productId: string; name: string; sku: string; qty: number; price: number }[];
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  status: string;
  payment: string;
  po_ref: string | null;
  company: string | null;
  po_file: string | null;
  created_at: string;
};

const statuses = ["Processing", "In transit", "Delivered", "Cancelled"];

const periods = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
] as const;

const customerTypes = [
  { value: "all", label: "All customers" },
  { value: "registered", label: "Registered accounts" },
  { value: "guest", label: "Guests" },
] as const;

const payments = [
  { value: "all", label: "All payment methods" },
  { value: "mpesa", label: "M-Pesa" },
  { value: "card", label: "Card (Paystack)" },
  { value: "bank", label: "Bank Transfer" },
  { value: "po", label: "Purchase Order" },
] as const;

const sorts = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "total-desc", label: "Total: high → low" },
  { value: "total-asc", label: "Total: low → high" },
  { value: "items-desc", label: "Most items first" },
] as const;

const selectCls =
  "rounded-lg border border-line bg-white px-2.5 py-2 text-xs font-bold text-navy-900 outline-none focus:border-safety-400";

function downloadXlsx(filename: string, sheetName: string, headers: string[], rows: (string | number)[][]) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = headers.map((h, i) => {
    let max = h.length;
    for (const r of rows) {
      const len = String(r[i] ?? "").length;
      if (len > max) max = len;
    }
    return { wch: Math.min(Math.max(max + 2, 10), 60) };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export default function AdminOrdersPage() {
  const { data, loading, refresh } = useFetch<{ orders: Order[] }>("/api/admin/orders");
  const [notice, setNotice] = useState<string | null>(null);
  const [period, setPeriod] = useState<(typeof periods)[number]["value"]>("today");
  const [customer, setCustomer] = useState<(typeof customerTypes)[number]["value"]>("all");
  const [payment, setPayment] = useState<(typeof payments)[number]["value"]>("all");
  const [status, setStatus] = useState<string>("all");
  const [sort, setSort] = useState<(typeof sorts)[number]["value"]>("newest");
  const [bestSort, setBestSort] = useState<"qty" | "revenue" | "name">("qty");
  const [bestPeriod, setBestPeriod] = useState<"today" | "7d" | "30d" | "all">("today");
  const [bestUsers, setBestUsers] = useState<"all" | "registered" | "guest">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const orders = data?.orders ?? [];

  const filtered = useMemo(() => {
    const now = Date.now();
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (payment !== "all" && o.payment !== payment) return false;
      if (customer === "registered" && !o.user_id) return false;
      if (customer === "guest" && o.user_id) return false;
      const t = new Date(o.created_at).getTime();
      if (period === "today" && new Date(o.created_at).toDateString() !== new Date().toDateString()) return false;
      if (period === "7d" && now - t > 7 * 86400000) return false;
      if (period === "30d" && now - t > 30 * 86400000) return false;
      return true;
    });
  }, [orders, status, payment, customer, period]);

  const visible = useMemo(() => {
    const arr = [...filtered];
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
      case "items-desc":
        arr.sort((a, b) => b.items.reduce((n, i) => n + i.qty, 0) - a.items.reduce((n, i) => n + i.qty, 0));
        break;
      default:
        arr.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    return arr;
  }, [filtered, sort]);

  useEffect(() => {
    setSelected((s) => {
      if (s.size === 0) return s;
      const vis = new Set(filtered.map((o) => o.id));
      const ids = Array.from(s);
      const kept = ids.filter((id) => vis.has(id));
      return kept.length === ids.length ? s : new Set(kept);
    });
  }, [filtered]);

  const allSelected = visible.length > 0 && selected.size === visible.length;

  const toggleOrder = (id: string) =>
    setSelected((s) => {
      const n = new Set(Array.from(s));
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(visible.map((o) => o.id)));

  const stats = useMemo(() => {
    const revenue = filtered.reduce((n, o) => n + o.total, 0);
    const units = filtered.reduce((n, o) => n + o.items.reduce((u, i) => u + i.qty, 0), 0);
    return { count: filtered.length, revenue, units, avg: filtered.length ? revenue / filtered.length : 0 };
  }, [filtered]);

  const bestSellers = useMemo(() => {
    const now = Date.now();
    const inBest = orders.filter((o) => {
      if (bestUsers === "registered" && !o.user_id) return false;
      if (bestUsers === "guest" && o.user_id) return false;
      const t = new Date(o.created_at).getTime();
      if (bestPeriod === "today" && new Date(o.created_at).toDateString() !== new Date().toDateString()) return false;
      if (bestPeriod === "7d" && now - t > 7 * 86400000) return false;
      if (bestPeriod === "30d" && now - t > 30 * 86400000) return false;
      return true;
    });
    const bySku = new Map<string, { name: string; sku: string; qty: number; revenue: number }>();
    for (const o of inBest) {
      for (const i of o.items) {
        const sku = i.sku ?? i.productId;
        const cur = bySku.get(sku) ?? { name: i.name ?? sku, sku, qty: 0, revenue: 0 };
        cur.qty += i.qty;
        cur.revenue += (i.price ?? 0) * i.qty;
        bySku.set(sku, cur);
      }
    }
    const arr = Array.from(bySku.values());
    arr.sort((a, b) =>
      bestSort === "revenue" ? b.revenue - a.revenue
      : bestSort === "name" ? a.name.localeCompare(b.name)
      : b.qty - a.qty
    );
    return arr;
  }, [orders, bestPeriod, bestUsers, bestSort]);

  const setOrderStatus = async (id: string, s: string) => {
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: s }),
    });
    const json = await res.json().catch(() => ({}));
    setNotice(res.ok ? `Order #${id} → ${s}` : json.error ?? "Update failed");
    refresh();
  };

  const exportOrders = () => {
    const chosen = selected.size > 0 ? visible.filter((o) => selected.has(o.id)) : visible;
    downloadXlsx(
      `kimsafety-orders-${new Date().toISOString().slice(0, 10)}.xlsx`,
      "Orders",
      ["Order ID", "Date", "Customer", "Email", "Phone", "Address", "Payment", "Status", "Items", "Units", "Subtotal", "Discount", "Shipping", "Total"],
      chosen.map((o) => [
        o.id,
        new Date(o.created_at).toLocaleString("en-KE"),
        o.name,
        o.email,
        o.phone,
        o.address,
        o.payment,
        o.status,
        o.items.map((i) => `${i.qty}x ${i.name}`).join("; "),
        o.items.reduce((n, i) => n + i.qty, 0),
        o.subtotal + o.discount,
        o.discount,
        o.shipping,
        o.total,
      ])
    );
  };

  const exportBestSellers = () => {
    downloadXlsx(
      `kimsafety-best-sellers-${new Date().toISOString().slice(0, 10)}.xlsx`,
      "Best sellers",
      ["Product", "SKU", "Units sold", "Revenue"],
      bestSellers.map((b) => [b.name, b.sku, b.qty, b.revenue])
    );
  };

  const maxQty = bestSellers[0]?.qty ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">Orders</h1>
          <p className="text-sm text-gray-500">
            Filter, sort and export · click an order to view items & details · tick rows to export exactly those orders
          </p>
        </div>
        <button
          onClick={exportOrders}
          disabled={visible.length === 0}
          className="flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-safety-500 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {selected.size > 0
            ? `Export ${selected.size} selected to Excel`
            : `Export to Excel (${visible.length})`}
        </button>
      </div>

      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>}

      <AdminCard title="Filters & view" subtitle="All filters apply to the table, summary, best sellers and export">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-400">Period</span>
            <select className={`${selectCls} w-full`} value={period} onChange={(e) => setPeriod(e.target.value as typeof period)}>
              {periods.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-400">Customer type</span>
            <select className={`${selectCls} w-full`} value={customer} onChange={(e) => setCustomer(e.target.value as typeof customer)}>
              {customerTypes.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-400">Payment</span>
            <select className={`${selectCls} w-full`} value={payment} onChange={(e) => setPayment(e.target.value as typeof payment)}>
              {payments.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-400">Status</span>
            <select className={`${selectCls} w-full`} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option>
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-gray-400">Sort by</span>
            <select className={`${selectCls} w-full`} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
              {sorts.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>
      </AdminCard>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Orders</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-navy-900">{stats.count}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Revenue</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-navy-900">{formatKES(stats.revenue)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Avg order value</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-navy-900">{formatKES(stats.avg)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Units sold</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-navy-900">{stats.units}</p>
        </div>
      </div>

      <AdminCard title="All orders">
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">No orders match the current filters.</p>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {visible.map((o) => {
                const itemCount = o.items.reduce((n, i) => n + i.qty, 0);
                return (
                  <div key={o.id} className="rounded-xl border border-line bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <label className="mt-0.5 flex shrink-0 cursor-pointer items-center" title={`Select order ${o.id}`}>
                        <span className="sr-only">Select order {o.id}</span>
                        <input
                          type="checkbox"
                          checked={selected.has(o.id)}
                          onChange={() => toggleOrder(o.id)}
                          className="h-4 w-4 accent-safety-500"
                        />
                      </label>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="font-bold text-navy-900 underline-offset-4 hover:underline"
                        >
                          #{o.id}
                        </Link>
                        <p className="text-[11px] text-gray-400">
                          {new Date(o.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <StatusBadge status={o.status} map={orderStatusTones} />
                    </div>
                    <p className="mt-2 font-semibold text-navy-900">{o.name}</p>
                    <p className="text-[11px] text-gray-400">{o.email}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                      <span>
                        {itemCount} item{itemCount === 1 ? "" : "s"} · {o.items.length} line{o.items.length === 1 ? "" : "s"} ·{" "}
                        {o.payment.replace("-", " ")}
                        {o.po_ref ? <span className="font-bold text-navy-900"> · PO: {o.po_ref}</span> : null}
                        {o.company ? <span> · {o.company}</span> : null}
                        {o.po_file ? (
                          <a href={o.po_file} target="_blank" rel="noopener noreferrer" className="font-bold text-safety-600 underline hover:text-safety-700"> · View PO file</a>
                        ) : null}
                      </span>
                      <span className="font-extrabold text-navy-900">{formatKES(o.total)}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <label className="sr-only" htmlFor={`status-${o.id}`}>Order status</label>
                      <select
                        id={`status-${o.id}`}
                        value={o.status}
                        onChange={(e) => setOrderStatus(o.id, e.target.value)}
                        className="rounded-lg border border-line px-2 py-1.5 text-[11px] font-bold text-navy-900 outline-none focus:border-safety-400"
                      >
                        {statuses.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                      <Link
                        href={`/admin/orders/${o.id}`}
                        aria-label={`View order ${o.id}`}
                        className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-400 transition-colors hover:border-safety-400 hover:text-safety-600"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="w-10 pb-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        aria-label="Select all visible orders"
                        title="Select all visible orders"
                        className="h-4 w-4 accent-safety-500"
                      />
                    </th>
                    <th className="pb-3">Order</th>
                    <th className="pb-3">Customer</th>
                    <th className="hidden pb-3 md:table-cell">Items</th>
                    <th className="pb-3 text-right">Total</th>
                    <th className="hidden pb-3 lg:table-cell">Payment</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((o) => {
                    const itemCount = o.items.reduce((n, i) => n + i.qty, 0);
                    return (
                      <tr key={o.id} className={`border-b border-line/60 last:border-0 ${selected.has(o.id) ? "bg-safety-50/60" : ""}`}>
                        <td className="py-3.5">
                          <input
                            type="checkbox"
                            checked={selected.has(o.id)}
                            onChange={() => toggleOrder(o.id)}
                            aria-label={`Select order ${o.id}`}
                            className="h-4 w-4 accent-safety-500"
                          />
                        </td>
                        <td className="py-3.5">
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="font-bold text-navy-900 underline-offset-4 hover:underline"
                          >
                            #{o.id}
                          </Link>
                          <p className="text-[11px] text-gray-400">
                            {new Date(o.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </td>
                        <td className="py-3.5">
                          <p className="font-semibold text-navy-900">{o.name}</p>
                          <p className="text-[11px] text-gray-400">{o.email}</p>
                          {o.user_id ? (
                            <span className="mt-1 inline-block rounded-full bg-safety-50 px-2 py-0.5 text-[10px] font-bold text-safety-700">Registered</span>
                          ) : (
                            <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">Guest</span>
                          )}
                        </td>
                        <td className="hidden py-3.5 text-gray-500 md:table-cell">
                          {itemCount} item{itemCount === 1 ? "" : "s"}
                          {o.items.length > 0 && <span className="text-gray-400"> · {o.items.length} line{o.items.length === 1 ? "" : "s"}</span>}
                        </td>
                        <td className="py-3.5 text-right font-extrabold text-navy-900">{formatKES(o.total)}</td>
                        <td className="hidden py-3.5 capitalize text-gray-500 lg:table-cell">{o.payment.replace("-", " ")}{o.po_ref ? ` · ${o.po_ref}` : ""}{o.company ? ` · ${o.company}` : ""}</td>
                        <td className="py-3.5">
                          <div className="flex flex-col items-start gap-1.5">
                            <StatusBadge status={o.status} map={orderStatusTones} />
                            <label className="sr-only" htmlFor={`status-${o.id}`}>Order status</label>
                            <select
                              id={`status-${o.id}`}
                              value={o.status}
                              onChange={(e) => setOrderStatus(o.id, e.target.value)}
                              className="rounded-lg border border-line px-2 py-1 text-[11px] font-bold text-navy-900 outline-none focus:border-safety-400"
                            >
                              {statuses.map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="py-3.5 text-right">
                          <Link
                            href={`/admin/orders/${o.id}`}
                            aria-label={`View order ${o.id}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-400 transition-colors hover:border-safety-400 hover:text-safety-600"
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

      <AdminCard
        title="Best selling items"
        subtitle={`Top products · ${periods.find((p) => p.value === bestPeriod)?.label} · ${customerTypes.find((c) => c.value === bestUsers)?.label} · ${bestSellers.length} product${bestSellers.length === 1 ? "" : "s"}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Best sellers duration"
              className={selectCls}
              value={bestPeriod}
              onChange={(e) => setBestPeriod(e.target.value as typeof bestPeriod)}
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
            <select
              aria-label="Best sellers users"
              className={selectCls}
              value={bestUsers}
              onChange={(e) => setBestUsers(e.target.value as typeof bestUsers)}
            >
              <option value="all">All customers</option>
              <option value="registered">Registered</option>
              <option value="guest">Guests</option>
            </select>
            <select
              aria-label="Sort best sellers"
              className={selectCls}
              value={bestSort}
              onChange={(e) => setBestSort(e.target.value as typeof bestSort)}
            >
              <option value="qty">Most units sold</option>
              <option value="revenue">Most revenue</option>
              <option value="name">Name A → Z</option>
            </select>
            <button
              onClick={exportBestSellers}
              disabled={bestSellers.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[11px] font-bold text-navy-900 hover:bg-surface disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </div>
        }
      >
        {bestSellers.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">No products in the current view.</p>
        ) : (
          <ul className="space-y-3">
            {bestSellers.slice(0, 10).map((b, idx) => (
              <li key={b.sku} className="flex items-center gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-[11px] font-extrabold text-white">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-navy-900">{b.name}</p>
                    <p className="shrink-0 text-xs text-gray-500">
                      {b.qty} unit{b.qty === 1 ? "" : "s"} · <span className="font-bold text-navy-900">{formatKES(b.revenue)}</span>
                    </p>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-safety-500"
                      style={{ width: `${maxQty ? (b.qty / maxQty) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
