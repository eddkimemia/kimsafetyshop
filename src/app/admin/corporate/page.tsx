"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useFetch, AdminCard, StatusBadge } from "@/components/admin/ui";

type Application = {
  id: string;
  company: string;
  kra_pin: string;
  industry: string;
  contact_name: string;
  phone: string;
  email: string;
  notes: string | null;
  documents: string[];
  status: string;
  created_at: string;
};

type PurchaseOrder = {
  id: string;
  company: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  po_file: string;
  status: string;
  created_at: string;
};

const statuses = ["Pending", "Reviewing", "Approved", "Declined"];
const poStatuses = ["Pending", "Processing", "Completed", "Cancelled"];

const statusTones: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700",
  Reviewing: "bg-safety-50 text-safety-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Declined: "bg-red-50 text-danger",
  Processing: "bg-safety-50 text-safety-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Cancelled: "bg-red-50 text-danger",
};

export default function AdminCorporatePage() {
  const { data, loading, refresh } = useFetch<{ applications: Application[] }>("/api/admin/corporate");
  const { data: poData, loading: poLoading, refresh: poRefresh } = useFetch<{ purchaseOrders: PurchaseOrder[] }>("/api/admin/purchase-orders");
  const [openId, setOpenId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const applications = data?.applications ?? [];
  const purchaseOrders = poData?.purchaseOrders ?? [];

  const setStatus = async (id: string, status: string) => {
    const res = await fetch("/api/admin/corporate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const json = await res.json().catch(() => ({}));
    setNotice(res.ok ? `Application ${id} → ${status}` : json.error ?? "Update failed");
    refresh();
  };

  const setPoStatus = async (id: string, status: string) => {
    const res = await fetch("/api/admin/purchase-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const json = await res.json().catch(() => ({}));
    setNotice(res.ok ? `Purchase order ${id} → ${status}` : json.error ?? "Update failed");
    poRefresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-navy-900">Corporate Applications</h1>
        <p className="text-sm text-gray-500">{applications.length} account applications · {purchaseOrders.length} purchase orders</p>
      </div>
      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>}

      <AdminCard title="Account applications">
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
        ) : applications.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">No applications yet.</p>
        ) : (
          <div className="space-y-3">
            {applications.map((a) => (
              <div key={a.id} className="overflow-hidden rounded-2xl border border-line">
                <button
                  onClick={() => setOpenId(openId === a.id ? null : a.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 bg-surface px-5 py-4 text-left"
                >
                  <div>
                    <p className="flex items-center gap-2 font-bold text-navy-900">
                      {a.id}
                      <StatusBadge status={a.status} map={statusTones} />
                    </p>
                    <p className="text-xs text-gray-500">
                      {a.company} · {a.industry} — {new Date(a.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-gray-400">{a.documents.length} document{a.documents.length === 1 ? "" : "s"}</span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${openId === a.id ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {openId === a.id && (
                  <div className="border-t border-line px-5 py-4">
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
                      <div><dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">KRA PIN</dt><dd className="font-semibold text-navy-900">{a.kra_pin}</dd></div>
                      <div><dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Contact</dt><dd className="font-semibold text-navy-900">{a.contact_name} · {a.phone}</dd></div>
                      <div><dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Email</dt><dd className="font-semibold text-navy-900">{a.email}</dd></div>
                      <div><dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Notes</dt><dd className="text-gray-600">{a.notes || "—"}</dd></div>
                    </dl>
                    {a.documents.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Company documents</p>
                        <ul className="space-y-1.5">
                          {a.documents.map((url) => (
                            <li key={url}>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs font-semibold text-navy-900 transition-colors hover:bg-safety-50 hover:text-safety-700"
                              >
                                <ExternalLink className="h-3.5 w-3.5 text-safety-600" />
                                <span className="min-w-0 flex-1 truncate">{url.split("/").pop()}</span>
                                Open document
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <label className="sr-only" htmlFor={`app-status-${a.id}`}>Application status</label>
                    <select
                      id={`app-status-${a.id}`}
                      value={a.status}
                      onChange={(e) => setStatus(a.id, e.target.value)}
                      className="mt-4 rounded-lg border border-line px-2.5 py-1.5 text-xs font-bold text-navy-900 outline-none focus:border-safety-400"
                    >
                      {statuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      <AdminCard title="Purchase orders">
        {poLoading ? (
          <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
        ) : purchaseOrders.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">No purchase orders yet.</p>
        ) : (
          <div className="space-y-3">
            {purchaseOrders.map((po) => (
              <div key={po.id} className="overflow-hidden rounded-2xl border border-line">
                <button
                  onClick={() => setOpenId(openId === po.id ? null : po.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 bg-surface px-5 py-4 text-left"
                >
                  <div>
                    <p className="flex items-center gap-2 font-bold text-navy-900">
                      {po.id}
                      <StatusBadge status={po.status} map={statusTones} />
                    </p>
                    <p className="text-xs text-gray-500">
                      {po.company} — {new Date(po.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${openId === po.id ? "rotate-180" : ""}`} />
                </button>
                {openId === po.id && (
                  <div className="border-t border-line px-5 py-4">
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
                      <div><dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Contact</dt><dd className="font-semibold text-navy-900">{po.contact_name || "—"}</dd></div>
                      <div><dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Phone</dt><dd className="font-semibold text-navy-900">{po.phone || "—"}</dd></div>
                      <div><dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Email</dt><dd className="font-semibold text-navy-900">{po.email || "—"}</dd></div>
                    </dl>
                    <div className="mt-4">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Purchase order file</p>
                      <a
                        href={po.po_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs font-semibold text-navy-900 transition-colors hover:bg-safety-50 hover:text-safety-700"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-safety-600" />
                        <span className="min-w-0 flex-1 truncate">{po.po_file.split("/").pop()}</span>
                        Open document
                      </a>
                    </div>
                    <label className="sr-only" htmlFor={`po-status-${po.id}`}>Purchase order status</label>
                    <select
                      id={`po-status-${po.id}`}
                      value={po.status}
                      onChange={(e) => setPoStatus(po.id, e.target.value)}
                      className="mt-4 rounded-lg border border-line px-2.5 py-1.5 text-xs font-bold text-navy-900 outline-none focus:border-safety-400"
                    >
                      {poStatuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
