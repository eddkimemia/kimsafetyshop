"use client";

import { AccountShell } from "@/components/account/account-shell";
import { ChangePasswordForm } from "@/components/account/change-password-form";

export default function AccountPasswordPage() {
  return (
    <AccountShell>
      <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
        <div className="mb-5">
          <h2 className="font-display text-lg font-extrabold text-navy-900">Change password</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Keep your account secure — update your password any time.
          </p>
        </div>
        <ChangePasswordForm />
      </section>
    </AccountShell>
  );
}
