"use client";

import { Check, Clock, Download } from "lucide-react";
import { cn, formatKES } from "@/lib/utils";
import { AccountShell, useAccountStats } from "@/components/account/account-shell";

export default function AccountInvoicesPage() {
  return (
    <AccountShell>
      <Invoices />
    </AccountShell>
  );
}

function Invoices() {
  const { orders } = useAccountStats();
  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
      <h2 className="mb-4 font-display text-lg font-extrabold text-navy-900">Tax invoices</h2>
      <div className="space-y-3">
        {orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">Invoices appear here after your first order.</p>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-navy-900">
                  Invoice #{o.id}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                      o.paid === 1 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    )}
                  >
                    {o.paid === 1 ? <Check className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                    {o.paid === 1 ? "PAID" : "UNPAID"}
                  </span>
                </p>
                <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })} · {formatKES(o.total)} incl. VAT</p>
              </div>
              <a
                href={`/api/orders/${o.id}/invoice`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-xs font-bold text-navy-900 hover:bg-surface"
              >
                <Download className="h-3.5 w-3.5" /> Download PDF
              </a>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
