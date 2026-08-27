"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  CreditCard,
  Download,
  Search,
  Smartphone,
  XCircle,
  FileText,
  X,
} from "lucide-react";
import { AdminCard, adminField } from "@/components/admin/ui";
import { formatKES, cn } from "@/lib/utils";

type PaymentRow = {
  id: string;
  order_id: string;
  customer: string;
  email: string;
  phone: string;
  customer_type: "registered" | "guest";
  user_id: string | null;
  method: string;
  method_label: string;
  reference: string | null;
  mpesa_checkout_id: string | null;
  paystack_init_reference: string | null;
  po_ref: string | null;
  amount: number;
  paid: number;
  status: string;
  created_at: string;
};

const inputCls =
  "rounded-lg border border-line bg-white px-2.5 py-2 text-xs font-bold text-navy-900 outline-none focus:border-safety-400";

type SortKey = "newest" | "oldest" | "amount-desc" | "amount-asc";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "amount-desc", label: "Amount (high → low)" },
  { value: "amount-asc", label: "Amount (low → high)" },
];

/** Every exportable column with its header + row getter. */
const EXPORT_COLUMNS: { key: string; label: string; get: (p: PaymentRow) => string | number }[] = [
  { key: "order_id", label: "Order ID", get: (p) => p.order_id },
  { key: "customer", label: "Customer", get: (p) => p.customer },
  { key: "customer_type", label: "Customer Type", get: (p) => (p.customer_type === "registered" ? "Registered" : "Guest") },
  { key: "email", label: "Email", get: (p) => p.email },
  { key: "phone", label: "Phone", get: (p) => p.phone },
  { key: "method_label", label: "Method", get: (p) => p.method_label },
  { key: "reference", label: "Transaction Reference", get: (p) => p.reference ?? "" },
  { key: "mpesa_checkout_id", label: "M-Pesa Checkout ID", get: (p) => p.mpesa_checkout_id ?? "" },
  { key: "paystack_init_reference", label: "Paystack Init Reference", get: (p) => p.paystack_init_reference ?? "" },
  { key: "po_ref", label: "PO Reference", get: (p) => p.po_ref ?? "" },
  { key: "payment_status", label: "Payment Status", get: (p) => (p.paid === 1 ? "Paid" : "Unpaid") },
  { key: "status", label: "Order Status", get: (p) => p.status },
  { key: "amount", label: "Amount (KES)", get: (p) => p.amount },
  { key: "created_at", label: "Date", get: (p) => new Date(p.created_at).toLocaleString("en-KE") },
];

export default function AdminPaymentsPage() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("all");
  const [paidFilter, setPaidFilter] = useState("all");
  const [custType, setCustType] = useState("all");
  const [refFilter, setRefFilter] = useState("all"); // all | with-ref | no-ref
  const [period, setPeriod] = useState("all"); // all | today | 7d | 30d | 90d | year | custom
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  // Export options
  const [showExport, setShowExport] = useState(false);
  const [exportScope, setExportScope] = useState<"filtered" | "paid" | "unpaid">("filtered");
  const [exportCols, setExportCols] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      EXPORT_COLUMNS.filter((c) => !["mpesa_checkout_id", "paystack_init_reference", "po_ref"].includes(c.key)).map((c) => [c.key, true])
    )
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/admin/me");
        const text = await r.text();
        const s = text ? (JSON.parse(text) as { user?: { role?: string } }) : {};
        if (alive) setIsSuperAdmin(s?.user?.role === "superadmin");
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/admin/payments");
        const text = await r.text();
        const j = text ? (JSON.parse(text) as { payments?: PaymentRow[]; error?: string }) : {};
        if (!alive) return;
        if (!r.ok) throw new Error((j as { error?: string }).error || `Request failed (${r.status})`);
        if (!j.payments) throw new Error((j as { error?: string }).error || "Failed to load payments");
        setPayments(j.payments as PaymentRow[]);
        setError(null);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load payments");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isSuperAdmin]);

  /** Start-of-day for "today" so it includes everything from midnight. */
  const startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let rows = payments.filter((p) => {
      if (method !== "all" && p.method !== method) return false;
      if (paidFilter === "paid" && p.paid !== 1) return false;
      if (paidFilter === "unpaid" && p.paid === 1) return false;
      if (custType !== "all" && p.customer_type !== custType) return false;
      if (refFilter === "with-ref" && !p.reference) return false;
      if (refFilter === "no-ref" && p.reference) return false;

      // Period filter
      const t = new Date(p.created_at).getTime();
      if (period === "today" && t < startOfToday()) return false;
      if (period === "7d" && t < Date.now() - 7 * 86_400_000) return false;
      if (period === "30d" && t < Date.now() - 30 * 86_400_000) return false;
      if (period === "90d" && t < Date.now() - 90 * 86_400_000) return false;
      if (period === "year" && t < Date.now() - 365 * 86_400_000) return false;
      if (period === "custom") {
        if (dateFrom && t < new Date(`${dateFrom}T00:00:00`).getTime()) return false;
        if (dateTo && t > new Date(`${dateTo}T23:59:59.999`).getTime()) return false;
      }

      if (q) {
        const hay = `${p.order_id} ${p.customer} ${p.email} ${p.phone} ${p.reference ?? ""} ${p.mpesa_checkout_id ?? ""} ${p.paystack_init_reference ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    rows = [...rows].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return a.created_at.localeCompare(b.created_at);
        case "amount-desc":
          return b.amount - a.amount;
        case "amount-asc":
          return a.amount - b.amount;
        default:
          return b.created_at.localeCompare(a.created_at);
      }
    });

    return rows;
  }, [payments, query, method, paidFilter, custType, refFilter, period, dateFrom, dateTo, sort]);

  const stats = useMemo(() => {
    const paidRows = filtered.filter((p) => p.paid === 1);
    return {
      count: filtered.length,
      collected: paidRows.reduce((sum, p) => sum + p.amount, 0),
      mpesa: filtered.filter((p) => p.method === "mpesa").length,
      card: filtered.filter((p) => p.method === "card").length,
      po: filtered.filter((p) => p.method === "po").length,
    };
  }, [filtered]);

  const exportRows = useMemo(() => {
    if (exportScope === "paid") return filtered.filter((p) => p.paid === 1);
    if (exportScope === "unpaid") return filtered.filter((p) => p.paid !== 1);
    return filtered;
  }, [filtered, exportScope]);

  const exportXlsx = () => {
    const cols = EXPORT_COLUMNS.filter((c) => exportCols[c.key]);
    if (cols.length === 0 || exportRows.length === 0) return;
    const ws = XLSX.utils.aoa_to_sheet([cols.map((c) => c.label), ...exportRows.map((p) => cols.map((c) => c.get(p)))]);
    ws["!cols"] = cols.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, `kimsafety-payments-${new Date().toISOString().slice(0, 10)}.xlsx`);
    setShowExport(false);
  };

  const activeFilters = [
    method !== "all",
    paidFilter !== "all",
    custType !== "all",
    refFilter !== "all",
    period !== "all",
    query.trim() !== "",
  ].filter(Boolean).length;

  const clearAll = () => {
    setQuery("");
    setMethod("all");
    setPaidFilter("all");
    setCustType("all");
    setRefFilter("all");
    setPeriod("all");
    setDateFrom("");
    setDateTo("");
  };

  if (!isSuperAdmin && !loading) {
    return (
      <AdminCard title="Restricted">
        <p className="py-6 text-center text-sm text-gray-400">Only the super admin can view site transactions.</p>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">Payments</h1>
          <p className="text-sm text-gray-500">Every transaction on the site with its gateway reference — superadmin only.</p>
        </div>
        <button
          onClick={() => setShowExport(true)}
          disabled={loading || filtered.length === 0}
          className="flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-safety-500 disabled:opacity-60"
        >
          <Download className="h-4 w-4" /> Export to Excel
        </button>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ["Transactions", String(stats.count)],
          ["Collected", formatKES(stats.collected)],
          ["M-Pesa", String(stats.mpesa)],
          ["Card", String(stats.card)],
          ["Purchase Orders", String(stats.po)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
            <p className="mt-1 font-display text-lg font-extrabold text-navy-900">{value}</p>
          </div>
        ))}
      </div>

      <AdminCard title="All Transactions" subtitle={`${filtered.length} of ${payments.length} shown`}>
        <div className="mb-4 space-y-2.5 border-b border-line pb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search order, customer, reference…"
                className={adminField}
                style={{ paddingLeft: "2.5rem" }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls} aria-label="Transaction type">
              <option value="all">All methods</option>
              <option value="mpesa">M-Pesa</option>
              <option value="card">Card</option>
              <option value="po">Purchase Order</option>
            </select>
            <select value={paidFilter} onChange={(e) => setPaidFilter(e.target.value)} className={inputCls} aria-label="Payment status">
              <option value="all">Paid &amp; unpaid</option>
              <option value="paid">Paid only</option>
              <option value="unpaid">Unpaid only</option>
            </select>
            <select value={custType} onChange={(e) => setCustType(e.target.value)} className={inputCls} aria-label="Customer type">
              <option value="all">All customers</option>
              <option value="registered">Registered accounts</option>
              <option value="guest">Guests</option>
            </select>
            <select value={refFilter} onChange={(e) => setRefFilter(e.target.value)} className={inputCls} aria-label="Reference">
              <option value="all">Any reference</option>
              <option value="with-ref">Has reference code</option>
              <option value="no-ref">Missing reference</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={inputCls} aria-label="Sort">
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>Sort: {o.label}</option>
              ))}
            </select>
          </div>

          {/* Period */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Period</span>
            {[
              ["all", "All time"],
              ["today", "Today"],
              ["7d", "Last 7 days"],
              ["30d", "Last 30 days"],
              ["90d", "Last 90 days"],
              ["year", "This year"],
              ["custom", "Custom range"],
            ].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setPeriod(v)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors",
                  period === v ? "bg-navy-900 text-white" : "border border-line bg-white text-gray-600 hover:bg-surface"
                )}
              >
                {label}
              </button>
            ))}
            {period === "custom" && (
              <span className="flex items-center gap-2">
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} aria-label="From date" />
                <span className="text-xs text-gray-400">→</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} aria-label="To date" />
              </span>
            )}
            {activeFilters > 0 && (
              <button onClick={clearAll} className="ml-auto rounded-full bg-danger/10 px-3 py-1.5 text-[11px] font-bold text-danger hover:bg-danger/20">
                Clear all filters ({activeFilters})
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">No transactions match.</p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {filtered.map((p) => (
                <div key={p.id + p.created_at} className="rounded-xl border border-line bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-navy-900">{p.order_id}</p>
                      <p className="truncate text-[11px] text-gray-400">{p.customer} · {p.phone}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${p.paid === 1 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {p.paid === 1 ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                    {p.method === "mpesa" ? <Smartphone className="h-3.5 w-3.5" /> : p.method === "card" ? <CreditCard className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                    {p.method_label} · {formatKES(p.amount)}
                  </p>
                  <p className="mt-1 truncate font-mono text-[11px] text-gray-500">Ref: {p.reference || "—"}</p>
                  <div className="mt-3 flex justify-end">
                    <Link
                      href={`/admin/orders/${encodeURIComponent(p.order_id)}`}
                      aria-label={`View order ${p.order_id}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-400 transition-colors hover:border-safety-400 hover:text-safety-600"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="pb-3">Order</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Method</th>
                    <th className="pb-3">Transaction Reference</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">View</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id + p.created_at} className="border-b border-line/60 last:border-0">
                      <td className="py-3 font-bold text-navy-900">{p.order_id}</td>
                      <td className="max-w-[180px] py-3">
                        <p className="truncate font-semibold text-navy-900">{p.customer}</p>
                        <p className="truncate text-[11px] text-gray-400">{p.email}</p>
                      </td>
                      <td className="py-3">
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                          p.customer_type === "registered" ? "bg-safety-50 text-safety-700" : "bg-gray-100 text-gray-500"
                        )}>
                          {p.customer_type === "registered" ? "Account" : "Guest"}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="flex items-center gap-1.5 text-gray-600">
                          {p.method === "mpesa" ? <Smartphone className="h-3.5 w-3.5 text-emerald-600" /> : p.method === "card" ? <CreditCard className="h-3.5 w-3.5 text-safety-600" /> : <FileText className="h-3.5 w-3.5 text-gray-400" />}
                          {p.method_label}
                        </span>
                      </td>
                      <td className="max-w-[170px] py-3">
                        {p.reference ? (
                          <span className="block truncate font-mono text-xs font-bold text-navy-900">{p.reference}</span>
                        ) : (
                          <span className="text-xs text-gray-300">— not set</span>
                        )}
                        {!p.reference && p.mpesa_checkout_id && (
                          <span className="block truncate font-mono text-[10px] text-gray-300">pending: {p.mpesa_checkout_id}</span>
                        )}
                      </td>
                      <td className="py-3 text-right font-extrabold text-navy-900">{formatKES(p.amount)}</td>
                      <td className="py-3">
                        {p.paid === 1 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                            <Check className="h-3 w-3" /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                            <XCircle className="h-3 w-3" /> Unpaid
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-[11px] text-gray-500">
                        {new Date(p.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/admin/orders/${encodeURIComponent(p.order_id)}`}
                          aria-label={`View order ${p.order_id}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gray-400 transition-colors hover:border-safety-400 hover:text-safety-600"
                        >
                          <ChevronRight className="h-4 w-4" />
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

      {/* Export options */}
      {showExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-extrabold text-navy-900">Export to Excel</h2>
                <p className="text-sm text-gray-500">Choose what to include in the file</p>
              </div>
              <button onClick={() => setShowExport(false)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-gray-500 hover:bg-surface" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Which transactions</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ["filtered", `Filtered (${filtered.length})`],
                    ["paid", `Paid (${filtered.filter((p) => p.paid === 1).length})`],
                    ["unpaid", `Unpaid (${filtered.filter((p) => p.paid !== 1).length})`],
                  ] as const).map(([v, label]) => (
                    <button
                      key={v}
                      onClick={() => setExportScope(v)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors",
                        exportScope === v ? "border-navy-900 bg-navy-900 text-white" : "border-line bg-white text-navy-800 hover:bg-surface"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Columns</p>
                  <div className="flex gap-2 text-[11px] font-bold">
                    <button
                      onClick={() => setExportCols(Object.fromEntries(EXPORT_COLUMNS.map((c) => [c.key, true])))}
                      className="text-safety-600 hover:underline"
                    >
                      Select all
                    </button>
                    <button
                      onClick={() => setExportCols(Object.fromEntries(EXPORT_COLUMNS.map((c) => [c.key, false])))}
                      className="text-gray-400 hover:text-navy-900"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="grid max-h-56 grid-cols-2 gap-1.5 overflow-auto rounded-xl border border-line p-3">
                  {EXPORT_COLUMNS.map((c) => (
                    <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-xs font-semibold text-navy-800 hover:bg-surface">
                      <input
                        type="checkbox"
                        checked={Boolean(exportCols[c.key])}
                        onChange={() => setExportCols((f) => ({ ...f, [c.key]: !f[c.key] }))}
                        className="h-4 w-4 accent-navy-900"
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-xs text-gray-400">
                  {Object.values(exportCols).filter(Boolean).length} columns ·{" "}
                  {exportRows.length} transaction{exportRows.length === 1 ? "" : "s"}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setShowExport(false)} className="rounded-xl border border-line px-5 py-2.5 text-xs font-bold text-gray-500 hover:text-navy-900">
                    Cancel
                  </button>
                  <button
                    onClick={exportXlsx}
                    disabled={Object.values(exportCols).every((v) => !v) || exportRows.length === 0}
                    className="flex items-center gap-2 rounded-xl bg-navy-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-safety-500 disabled:opacity-60"
                  >
                    <Download className="h-4 w-4" /> Export
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
