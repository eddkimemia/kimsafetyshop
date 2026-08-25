"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Check,
  CreditCard,
  Download,
  Search,
  Smartphone,
  XCircle,
  FileText,
} from "lucide-react";
import { AdminCard, adminField } from "@/components/admin/ui";
import { formatKES } from "@/lib/utils";

type PaymentRow = {
  id: string;
  order_id: string;
  customer: string;
  email: string;
  phone: string;
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

export default function AdminPaymentsPage() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("all");
  const [paidFilter, setPaidFilter] = useState("all");

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((s) => {
        if (alive) setIsSuperAdmin(s?.user?.role === "superadmin");
      })
      .catch(() => {});
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
    fetch("/api/admin/payments")
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        if (!j.payments) throw new Error(j.error || "Failed to load payments");
        setPayments(j.payments as PaymentRow[]);
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Failed to load payments"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [isSuperAdmin]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return payments.filter((p) => {
      if (method !== "all" && p.method !== method) return false;
      if (paidFilter === "paid" && p.paid !== 1) return false;
      if (paidFilter === "unpaid" && p.paid === 1) return false;
      if (q) {
        const hay = `${p.order_id} ${p.customer} ${p.email} ${p.phone} ${p.reference ?? ""} ${p.mpesa_checkout_id ?? ""} ${p.paystack_init_reference ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [payments, query, method, paidFilter]);

  const stats = useMemo(() => {
    const paidRows = filtered.filter((p) => p.paid === 1);
    return {
      count: filtered.length,
      paidCount: paidRows.length,
      collected: paidRows.reduce((sum, p) => sum + p.amount, 0),
      mpesa: filtered.filter((p) => p.method === "mpesa").length,
      card: filtered.filter((p) => p.method === "card").length,
      po: filtered.filter((p) => p.method === "po").length,
    };
  }, [filtered]);

  const exportXlsx = () => {
    const rows = filtered.map((p) => [
      p.order_id,
      p.customer,
      p.email,
      p.phone,
      p.method_label,
      p.reference ?? "",
      p.paid === 1 ? "Paid" : "Unpaid",
      p.status,
      p.amount,
      new Date(p.created_at).toLocaleString("en-KE"),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([
      ["Order ID", "Customer", "Email", "Phone", "Method", "Transaction Reference", "Status", "Order Status", "Amount (KES)", "Date"],
      ...rows,
    ]);
    ws["!cols"] = [{ wch: 12 }, { wch: 22 }, { wch: 26 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 10 }, { wch: 12 }, { wch: 13 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, `kimsafety-payments-${new Date().toISOString().slice(0, 10)}.xlsx`);
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
          onClick={exportXlsx}
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
        <div className="mb-4 flex flex-wrap items-center gap-2.5 border-b border-line pb-4">
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
          <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls} aria-label="Filter by method">
            <option value="all">All methods</option>
            <option value="mpesa">M-Pesa</option>
            <option value="card">Card</option>
            <option value="po">Purchase Order</option>
          </select>
          <select value={paidFilter} onChange={(e) => setPaidFilter(e.target.value)} className={inputCls} aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
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
                  <p className="mt-1 truncate font-mono text-[11px] text-gray-500">
                    Ref: {p.reference || "—"}
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="pb-3">Order</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Method</th>
                    <th className="pb-3">Transaction Reference</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id + p.created_at} className="border-b border-line/60 last:border-0">
                      <td className="py-3 font-bold text-navy-900">{p.order_id}</td>
                      <td className="max-w-[200px] py-3">
                        <p className="truncate font-semibold text-navy-900">{p.customer}</p>
                        <p className="truncate text-[11px] text-gray-400">{p.email}</p>
                      </td>
                      <td className="py-3">
                        <span className="flex items-center gap-1.5 text-gray-600">
                          {p.method === "mpesa" ? <Smartphone className="h-3.5 w-3.5 text-emerald-600" /> : p.method === "card" ? <CreditCard className="h-3.5 w-3.5 text-safety-600" /> : <FileText className="h-3.5 w-3.5 text-gray-400" />}
                          {p.method_label}
                        </span>
                      </td>
                      <td className="max-w-[180px] py-3">
                        {p.reference ? (
                          <span className="truncate font-mono text-xs font-bold text-navy-900">{p.reference}</span>
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
