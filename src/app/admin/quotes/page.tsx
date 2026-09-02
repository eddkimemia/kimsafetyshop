"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight, FilePlus2, Trash2 } from "lucide-react";
import { useFetch, AdminCard, StatusBadge, quoteStatusTones } from "@/components/admin/ui";
import { formatKES } from "@/lib/utils";

type Quote = {
  id: string;
  name: string;
  company: string | null;
  items: { productId: string; name: string; qty: number; price: number; brand?: string | null }[];
  total: number;
  status: string;
  attachment: string | null;
  created_by_id: string | null;
  created_by_name: string | null;
  created_at: string;
};

const isRfq = (q: Quote) => q.items[0]?.productId === "quote-request";

export default function AdminQuotesPage() {
  const params = useSearchParams();
  const { data, loading, refresh } = useFetch<{ quotes: Quote[] }>("/api/admin/quotes");
  const [notice, setNotice] = useState<string | null>(params.get("created") ? `Quotation ${params.get("created")} saved — open it below to download the PDF.` : null);
  const [me, setMe] = useState<{ id?: string; role?: string } | null>(null);
  const quotes = data?.quotes ?? [];

  useEffect(() => {
    fetch("/api/admin/me").then((r) => r.json()).then((s) => s?.user && setMe(s.user));
  }, []);

  const del = async (id: string) => {
    if (!window.confirm(`Delete quotation ${id}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/quotes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    setNotice(res.ok ? `Quotation ${id} deleted` : json.error ?? "Delete failed");
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">Quotes</h1>
          <p className="text-sm text-gray-500">
            {(() => {
              const r = quotes.filter(isRfq).length;
              const q = quotes.filter((x) => !isRfq(x)).length;
              return `${r} RFQ${r === 1 ? "" : "s"} · ${q} quotation${q === 1 ? "" : "s"} — click an item to open it`;
            })()}
          </p>
        </div>
        <Link
          href="/admin/quotes/new"
          className="flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-safety-500"
        >
          <FilePlus2 className="h-4 w-4" /> New quotation
        </Link>
      </div>
      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>}

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
      ) : quotes.length === 0 ? (
        <AdminCard title="All quotes">
          <p className="py-6 text-center text-sm text-gray-400">No quotations or RFQs yet.</p>
        </AdminCard>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AdminCard
            title="RFQs"
            subtitle={`${quotes.filter(isRfq).length} request${quotes.filter(isRfq).length === 1 ? "" : "s"} · newest first`}
          >
            {(() => {
              const rfqs = quotes
                .filter(isRfq)
                .slice()
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              if (rfqs.length === 0) return <p className="py-6 text-center text-sm text-gray-400">No RFQs.</p>;
              return (
                <div className="space-y-2">
                  {rfqs.map((q) => (
                    <QuoteRow key={q.id} q={q} me={me} onDelete={del} />
                  ))}
                </div>
              );
            })()}
          </AdminCard>
          <AdminCard
            title="Quotations"
            subtitle={`${quotes.filter((q) => !isRfq(q)).length} quotation${quotes.filter((q) => !isRfq(q)).length === 1 ? "" : "s"} · newest first`}
          >
            {(() => {
              const qts = quotes
                .filter((q) => !isRfq(q))
                .slice()
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              if (qts.length === 0) return <p className="py-6 text-center text-sm text-gray-400">No quotations yet.</p>;
              return (
                <div className="space-y-2">
                  {qts.map((q) => (
                    <QuoteRow key={q.id} q={q} me={me} onDelete={del} />
                  ))}
                </div>
              );
            })()}
          </AdminCard>
        </div>
      )}
    </div>
  );
}

function QuoteRow({
  q,
  me,
  onDelete,
}: {
  q: Quote;
  me: { id?: string; role?: string } | null;
  onDelete: (id: string) => void;
}) {
  const canDelete = me?.role === "superadmin" || (!!q.created_by_id && q.created_by_id === me?.id);
  return (
    <div className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-5 py-3.5 text-left transition-colors hover:border-safety-300 hover:bg-safety-50">
      <Link href={`/admin/quotes/${encodeURIComponent(q.id)}`} className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-bold text-navy-900">
            <span className="truncate">{q.id}</span>
            <StatusBadge status={q.status} map={quoteStatusTones} />
          </p>
          <p className="truncate text-xs text-gray-500">
            {q.name}
            {q.company ? ` · ${q.company}` : ""} — {new Date(q.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
            {q.created_by_name ? ` · by ${q.created_by_name}` : q.created_by_id ? ` · by ${q.created_by_id.slice(0, 8)}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-display text-sm font-extrabold text-navy-900">{formatKES(q.total)}</span>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      </Link>
      {canDelete && (
        <button
          onClick={() => onDelete(q.id)}
          aria-label={`Delete ${q.id}`}
          title={me?.role === "superadmin" ? "Delete (superadmin)" : "Delete (created by you)"}
          className="shrink-0 rounded-lg border border-line bg-white p-2 text-gray-400 transition-colors hover:border-danger hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
