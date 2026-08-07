"use client";

import { AccountShell } from "@/components/account/account-shell";
import { NotificationsTab } from "@/components/account/notifications-tab";

export default function AccountNotificationsPage() {
  return (
    <AccountShell>
      <NotificationsTab />
    </AccountShell>
  );
}
