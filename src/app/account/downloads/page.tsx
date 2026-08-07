"use client";

import { AccountShell } from "@/components/account/account-shell";
import { DownloadsTab } from "@/components/account/downloads-tab";

export default function AccountDownloadsPage() {
  return (
    <AccountShell>
      <DownloadsTab />
    </AccountShell>
  );
}
