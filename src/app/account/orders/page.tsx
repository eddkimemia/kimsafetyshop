"use client";

import { AccountShell, useAccountStats } from "@/components/account/account-shell";
import { OrdersTable } from "@/components/account/orders-table";

export default function AccountOrdersPage() {
  return (
    <AccountShell>
      <OrderHistory />
    </AccountShell>
  );
}

function OrderHistory() {
  const { orders, loading } = useAccountStats();
  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
      <h2 className="mb-4 font-display text-lg font-extrabold text-navy-900">Order history</h2>
      <OrdersTable orders={orders} loading={loading} />
    </section>
  );
}
