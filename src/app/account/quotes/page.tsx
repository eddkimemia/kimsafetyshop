"use client";

import { formatKES } from "@/lib/utils";
import { AccountShell, useAccountStats } from "@/components/account/account-shell";

export default function AccountQuotesPage() {
  return (
    <AccountShell>
      <Quotes />
    </AccountShell>
  );
}

function Quotes() {
  const { quotes } = useAccountStats();
  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
        <h2 className="mb-4 font-display text-lg font-extrabold text-navy-900">Saved quotations</h2>
        <div className="space-y-3">
          {quotes.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              No quotes yet — request one from any product page or via the Quote Request button.
            </p>
          ) : (
            quotes.map((q) => (
              <div key={q.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-navy-900">{q.id} · {q.name}</p>
                    <p className="text-xs text-gray-400">{new Date(q.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })} · {q.status} · {q.items.reduce((s, i) => s + i.qty, 0)} items</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-navy-900">{formatKES(q.total)}</span>
                    <span className="rounded-lg bg-navy-900 px-4 py-2 text-xs font-bold text-white opacity-60">
                      {q.status}
                    </span>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 border-t border-line pt-3 text-xs text-gray-500">
                  {q.items.map((i) => (
                    <li key={`${q.id}-${i.productId}-${i.name}`} className="flex justify-between">
                      <span>{i.qty} × {i.name}</span>
                      <span>{formatKES((i.price ?? 0) * i.qty)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </section>
  );
}