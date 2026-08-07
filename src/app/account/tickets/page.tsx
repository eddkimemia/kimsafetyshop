"use client";

import { AccountShell } from "@/components/account/account-shell";
import { TicketsTab } from "@/components/account/tickets-tab";

export default function AccountTicketsPage() {
  return (
    <AccountShell>
      <TicketsTab />
    </AccountShell>
  );
}
