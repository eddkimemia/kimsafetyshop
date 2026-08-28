"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ChevronDown, ChevronRight, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
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

type CorporateAccount = {
  id: string;
  user_id: string | null;
  application_id: string | null;
  company: string;
  kra_pin: string | null;
  industry: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  discount_rate: number;
  credit_terms: string;
  account_manager: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const statuses = ["Pending", "Reviewing", "Approved", "Declined"];
const poStatuses = ["Pending", "Processing", "Completed", "Cancelled"];
const accountStatuses = ["Active", "Paused", "Closed"];

const statusTones: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700",
  Reviewing: "bg-safety-50 text-safety-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Declined: "bg-red-50 text-danger",
  Processing: "bg-safety-50 text-safety-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Cancelled: "bg-red-50 text-danger",
};

const accountTones: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700",
  Paused: "bg-amber-50 text-amber-700",
  Closed: "bg-gray-100 text-gray-500",
};

export default function AdminCorporatePage() {
  const { data, loading, refresh } = useFetch<{ applications: Application[] }>("/api/admin/corporate");
  const { data: accountData, loading: accountsLoading, refresh: refreshAccounts } = useFetch<{ accounts: CorporateAccount[] }>("/api/admin/corporate/accounts");
  const { data: poData, loading: poLoading, refresh: poRefresh } = useFetch<{ purchaseOrders: PurchaseOrder[] }>("/api/admin/purchase-orders");
  const [me, setMe] = useState<{ id: string; role?: string } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const applications = data?.applications ?? [];
  const accounts = accountData?.accounts ?? [];
  const purchaseOrders = poData?.purchaseOrders ?? [];
  const isSuper = me?.role === "superadmin";
  const isStaff = me?.role === "admin" || isSuper;

  useEffect(() => {
    fetch("/api/admin/me").then((r) => r.json()).then((s) => s?.user && setMe(s.user));
  }, []);

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 12000);
  };

  const setStatus = async (id: string, status: string) => {
    const res = await fetch("/api/admin/corporate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      if (status === "Approved" && json.accountCreated) {
        flash(
          json.tempPassword
            ? `Application ${id} approved — corporate account & login created. Share this temporary password with the contact: ${json.tempPassword}`
            : `Application ${id} approved — corporate account created and linked to the existing login.`
        );
      } else {
        flash(`Application ${id} → ${status}`);
      }
    } else {
      flash(json.error ?? "Update failed");
    }
    refresh();
    if (isStaff) refreshAccounts();
  };

  const setPoStatus = async (id: string, status: string) => {
    const res = await fetch("/api/admin/purchase-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const json = await res.json().catch(() => ({}));
    flash(res.ok ? `Purchase order ${id} → ${status}` : json.error ?? "Update failed");
    poRefresh();
  };

  const setAccountStatus = async (a: CorporateAccount, status: string) => {
    const res = await fetch("/api/admin/corporate/accounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, status }),
    });
    const json = await res.json().catch(() => ({}));
    flash(res.ok ? `${a.company} → ${status}` : json.error ?? "Update failed");
    refreshAccounts();
  };

  const removeAccount = (a: CorporateAccount) => {
    if (!confirm(`Delete the ${a.company} corporate account? This cannot be undone.`)) return;
    fetch(`/api/admin/corporate/accounts?id=${encodeURIComponent(a.id)}`, { method: "DELETE" })
      .then(async (r) => {
        const json = await r.json().catch(() => ({}));
        flash(r.ok ? `${a.company} deleted` : json.error ?? "Delete failed");
      })
      .catch(() => flash("Delete failed"))
      .finally(() => refreshAccounts());
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-navy-900">Corporate</h1>
        <p className="text-sm text-gray-500">
          {accounts.length} corporate accounts · {applications.length} account applications · {purchaseOrders.length} purchase orders
        </p>
      </div>
      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>}

      {isStaff && (
        <AdminCard
          title="Corporate accounts"
          subtitle="Company name is the primary identifier — not the contact person — discount, credit terms and manager are per-company. Staff/admin may manage."
          action={
            <Link href="/admin/corporate/new" className="flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-xs font-bold text-white hover:bg-safety-500">
              <Plus className="h-3.5 w-3.5" /> New account
            </Link>
          }
        >
          {accountsLoading ? (
            <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
          ) : accounts.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">
              No corporate accounts yet — <Link href="/admin/corporate/new" className="font-bold text-safety-600 hover:underline">create one</Link> or approve an application.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="pb-3">Company</th>
                    <th className="hidden pb-3 lg:table-cell">Contact</th>
                    <th className="hidden pb-3 xl:table-cell">Terms</th>
                    <th className="hidden pb-3 xl:table-cell">Manager</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.id} className="border-b border-line/60 last:border-0">
                      <td className="py-3.5">
                        <Link href={`/admin/corporate/${encodeURIComponent(a.id)}`} className="flex items-center gap-1.5 font-semibold text-navy-900 hover:underline">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-safety-600" /> {a.company}
                        </Link>
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          {a.id} · {a.industry ?? "—"}
                          {a.kra_pin ? ` · PIN ${a.kra_pin}` : ""}
                        </p>
                        {a.notes && <p className="mt-1 max-w-md truncate text-[11px] text-gray-400" title={a.notes}>“{a.notes}”</p>}
                      </td>
                      <td className="hidden py-3.5 text-gray-500 lg:table-cell">
                        <span className="text-xs text-gray-400">Contact:</span> {a.contact_name || "—"}
                        <p className="text-[11px] text-gray-400">{a.email ?? ""}{a.phone ? ` · ${a.phone}` : ""}</p>
                      </td>
                      <td className="hidden py-3.5 text-gray-500 xl:table-cell">
                        {a.discount_rate > 0 ? `${a.discount_rate}% off` : "Standard"}
                        <p className="text-[11px] text-gray-400">Credit: {a.credit_terms}</p>
                      </td>
                      <td className="hidden py-3.5 text-gray-500 xl:table-cell">{a.account_manager ?? "—"}</td>
                      <td className="py-3.5">
                        {isStaff ? (
                          <select
                            value={a.status}
                            onChange={(e) => setAccountStatus(a, e.target.value)}
                            className="rounded-lg border border-line px-2 py-1 text-[11px] font-bold text-navy-900 outline-none focus:border-safety-400"
                          >
                            {accountStatuses.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <StatusBadge status={a.status} map={accountTones} />
                        )}
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/corporate/${encodeURIComponent(a.id)}/edit`}
                            className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-surface"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </Link>
                          <Link
                            href={`/admin/corporate/${encodeURIComponent(a.id)}`}
                            aria-label={`View ${a.company}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-gray-400 hover:border-safety-400 hover:text-safety-600"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => removeAccount(a)}
                            className="flex items-center gap-1 rounded-lg border border-danger/30 px-2.5 py-1.5 text-[11px] font-bold text-danger hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>
      )}

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
                      <div><dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Company</dt><dd className="font-semibold text-navy-900">{a.company}</dd></div>
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
                    {a.status !== "Approved" && (
                      <p className="mt-2 text-[11px] text-gray-400">Approving creates the corporate account and a login for {a.email || "the contact"}.</p>
                    )}
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
                      <div><dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Company</dt><dd className="font-semibold text-navy-900">{po.company}</dd></div>
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
