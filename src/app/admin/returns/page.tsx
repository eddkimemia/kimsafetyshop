"use client";

import { useMemo, useState } from "react";
import { Undo2 } from "lucide-react";
import { useFetch, AdminCard, StatusBadge } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

type ReturnRow = {
  id: string;
  user_id: string;
  order_id: string;
  product_name: string;
  qty: number;
  reason: string;
  status: string;
  created_at: string;
  customer_name: string | null;
  customer_email: string | null;
};

const VALID = ["Requested", "Approved", "Rejected", "Picked up", "Refunded", "Closed"];
const tones: Record<string, string> = {
  Requested: "bg-amber-50 text-amber-700",
  Approved: "bg-emerald-50 text-emerald-700",
  "Picked up": "bg-sky-50 text-sky-700",
  Refunded: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-700",
  Closed: "bg-gray-100 text-gray-500",
};

export default function AdminReturnsPage() {
  const { data, loading, refresh } = useFetch<{ returns: ReturnRow[] }>("/api/admin/returns");
  const [filter, setFilter] = useState<"all" | "Requested" | "Approved" | "Refunded">("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const rows = useMemo(() => {
    const all = data?.returns ?? [];
    return filter === "all" ? all : all.filter((r) => r.status === filter);
  }, [data, filter]);

  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/returns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Failed to update return");
      setNotice(`Return ${id} is now "${status}" — the customer was emailed.`);
      refresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to update return");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold text-navy-900">
            <Undo2 className="h-6 w-6 text-safety-500" /> Returns
          </h1>
          <p className="mt-1 text-sm text-gray-500">Customer return requests — update the status and the customer is emailed automatically.</p>
        </div>
        <div className="flex gap-1.5 rounded-xl border border-line bg-white p-1">
          {(["all", "Requested", "Approved", "Refunded"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-bold capitalize transition-colors",
                filter === f ? "bg-safety-500 text-white" : "text-gray-500 hover:bg-surface"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>
      )}

      <AdminCard title={`${rows.length} return request${rows.length === 1 ? "" : "s"}`} subtitle="Requested returns appear with a pending badge.">
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">Loading returns…</p>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">No returns match this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wider text-gray-400">
                  <th className="py-2.5 pr-4">Return</th>
                  <th className="py-2.5 pr-4">Customer</th>
                  <th className="py-2.5 pr-4">Order / product</th>
                  <th className="py-2.5 pr-4">Reason</th>
                  <th className="py-2.5 pr-4">Status</th>
                  <th className="py-2.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-line/60 align-top">
                    <td className="py-3 pr-4">
                      <p className="font-bold text-navy-900">{r.id}</p>
                      <p className="text-[11px] text-gray-400">{new Date(r.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-navy-900">{r.customer_name ?? "—"}</p>
                      <p className="text-[11px] text-gray-400">{r.customer_email ?? ""}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-xs font-bold text-navy-900">{r.order_id}</p>
                      <p className="text-[11px] text-gray-500">{r.product_name} × {r.qty}</p>
                    </td>
                    <td className="max-w-[220px] py-3 pr-4 text-xs text-gray-600">{r.reason}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={r.status} map={tones} />
                    </td>
                    <td className="py-3">
                      <select
                        value={r.status}
                        disabled={busy === r.id}
                        onChange={(e) => setStatus(r.id, e.target.value)}
                        className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-navy-900 outline-none focus:border-safety-400 disabled:opacity-50"
                      >
                        {VALID.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}