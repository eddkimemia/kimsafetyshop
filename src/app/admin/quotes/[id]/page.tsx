"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText, ImageIcon } from "lucide-react";
import { useFetch, AdminCard, StatusBadge, quoteStatusTones } from "@/components/admin/ui";
import { formatKES } from "@/lib/utils";

type Quote = {
  id: string;
  user_id: string | null;
  name: string;
  company: string | null;
  items: { productId: string; name: string; qty: number; price: number; brand?: string | null }[];
  total: number;
  status: string;
  attachment: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  valid_until: string | null;
  created_at: string;
};

const statuses = ["Open", "Pending", "Sent", "Accepted", "Expired", "Declined"];

export default function AdminQuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, refresh } = useFetch<{ quote: Quote }>(`/api/admin/quotes?id=${encodeURIComponent(id)}`);
  const [notice, setNotice] = useState<string | null>(null);

  const quote = data?.quote;
  const isRfq = quote?.items[0]?.productId === "quote-request";

  const setStatus = async (status: string) => {
    const res = await fetch("/api/admin/quotes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const json = await res.json().catch(() => ({}));
    setNotice(res.ok ? `${id} → ${status}` : json.error ?? "Update failed");
    refresh();
  };

  if (loading) return <p className="py-10 text-center text-sm text-gray-400">Loading…</p>;
  if (!quote) return <p className="py-10 text-center text-sm text-gray-400">Quote not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/quotes" className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-navy-900 hover:bg-safety-50">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold text-navy-900">
              {isRfq ? "RFQ request" : "Quotation"} {quote.id}
              <StatusBadge status={quote.status} map={quoteStatusTones} />
            </h1>
            <p className="text-sm text-gray-500">
              {quote.name}
              {quote.company ? ` · ${quote.company}` : ""} — {new Date(quote.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
        {!isRfq && (
          <a
            href={`/api/admin/quotes/pdf?id=${encodeURIComponent(quote.id)}`}
            download={`quotation-${quote.id}.pdf`}
            className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-navy-900 hover:bg-surface"
          >
            <FileText className="h-4 w-4" /> Quotation
          </a>
        )}
      </div>
      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {isRfq ? (
            <AdminCard title="Request" subtitle="What the customer asked for — reply by preparing a quotation">
              <div className="rounded-xl bg-surface px-4 py-3 text-sm text-gray-600">
                {quote.items.map((i, idx) => (
                  <p key={idx} className="whitespace-pre-line">{i.name}</p>
                ))}
              </div>
            </AdminCard>
          ) : (
            <AdminCard title="Items" subtitle={`${quote.items.length} item${quote.items.length === 1 ? "" : "s"}`}>
              <div className="space-y-3 md:hidden">
                {quote.items.map((i, idx) => (
                  <div key={`${quote.id}-${i.productId}-${idx}`} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-white p-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-navy-900">{i.name}</p>
                      {i.brand && <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-safety-600">{i.brand}</p>}
                      <p className="mt-0.5 text-xs text-gray-500">
                        {i.qty} × {formatKES(i.price)}
                      </p>
                    </div>
                    <p className="shrink-0 font-bold text-navy-900">{formatKES(i.price * i.qty)}</p>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto rounded-xl border border-line md:block">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-line bg-surface text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      <th className="px-4 py-2">Item name</th>
                      <th className="px-4 py-2">Brand</th>
                      <th className="px-4 py-2 text-center">Qty</th>
                      <th className="px-4 py-2 text-right">Unit price</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items.map((i, idx) => (
                      <tr key={`${quote.id}-${i.productId}-${idx}`} className="border-b border-line/60 last:border-0">
                        <td className="px-4 py-2.5 font-semibold text-navy-900">{i.name}</td>
                        <td className="px-4 py-2.5 text-xs font-semibold text-gray-600">{i.brand ?? "—"}</td>
                        <td className="px-4 py-2.5 text-center text-gray-500">{i.qty}</td>
                        <td className="px-4 py-2.5 text-right text-gray-500">{formatKES(i.price)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-navy-900">{formatKES(i.price * i.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-right font-display text-lg font-extrabold text-navy-900">Total {formatKES(quote.total)}</p>
            </AdminCard>
          )}

          {quote.attachment && (
            <AdminCard title="RFQ document" subtitle="Attachment uploaded by the customer">
              <a
                href={quote.attachment}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs font-semibold text-navy-900 transition-colors hover:bg-safety-50 hover:text-safety-700"
              >
                {quote.attachment.toLowerCase().endsWith(".pdf") ? (
                  <FileText className="h-4 w-4 text-danger" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-safety-600" />
                )}
                <span className="min-w-0 flex-1 truncate">{quote.attachment.split("/").pop()}</span>
                Open {quote.attachment.toLowerCase().endsWith(".pdf") ? "PDF" : "image"}
                <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
              </a>
            </AdminCard>
          )}
        </div>

        <div className="space-y-6">
          <AdminCard title="Customer">
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Name</dt>
                <dd className="font-semibold text-navy-900">{quote.name || "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Phone</dt>
                <dd className="font-semibold text-navy-900">{quote.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Company</dt>
                <dd className="font-semibold text-navy-900">{quote.company || "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Email</dt>
                <dd className="text-gray-600">{quote.email || "—"}</dd>
              </div>
              {quote.valid_until && (
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Valid until</dt>
                  <dd className="text-gray-600">{new Date(quote.valid_until).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</dd>
                </div>
              )}
              {quote.notes && (
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Notes</dt>
                  <dd className="whitespace-pre-line text-gray-600">{quote.notes}</dd>
                </div>
              )}
            </dl>
          </AdminCard>

          <AdminCard title="Status">
            <label className="sr-only" htmlFor={`quote-status-${quote.id}`}>Quote status</label>
            <select
              id={`quote-status-${quote.id}`}
              value={quote.status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-line px-2.5 py-2 text-xs font-bold text-navy-900 outline-none focus:border-safety-400"
            >
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            {isRfq && (
              <Link
                href="/admin/quotes/new"
                className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-safety-500"
              >
                <FileText className="h-4 w-4" /> Reply with quotation
              </Link>
            )}
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
