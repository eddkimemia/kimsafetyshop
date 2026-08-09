"use client";

import { KeyRound } from "lucide-react";
import { AdminCard } from "@/components/admin/ui";
import { ChangePasswordForm } from "@/components/account/change-password-form";

export default function AdminPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold text-navy-900">
          <KeyRound className="h-5 w-5 text-safety-600" /> Password
        </h1>
        <p className="text-sm text-gray-500">
          Update your own sign-in password — your current password is required.
        </p>
      </div>

      <AdminCard
        title="Change password"
        subtitle="At least 6 characters — you'll sign in with the new password next time"
      >
        <ChangePasswordForm />
      </AdminCard>
    </div>
  );
}
