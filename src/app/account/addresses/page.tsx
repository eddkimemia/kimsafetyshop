"use client";

import { AccountShell } from "@/components/account/account-shell";
import { AddressesTab } from "@/components/account/addresses-tab";

export default function AccountAddressesPage() {
  return (
    <AccountShell>
      <AddressesTab />
    </AccountShell>
  );
}
