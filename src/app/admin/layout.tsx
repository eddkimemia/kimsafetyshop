import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Admin",
  icons: { icon: "/images/logo/fav.jpeg", apple: "/images/logo/fav.jpeg" },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect(`/login?callbackUrl=${encodeURIComponent("/admin")}`);
  if (session.user.role !== "admin" && session.user.role !== "superadmin") redirect("/account");

  return <AdminShell>{children}</AdminShell>;
}
