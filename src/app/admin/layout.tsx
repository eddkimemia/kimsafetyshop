import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
  icons: { icon: "/images/logo/fav.jpeg", apple: "/images/logo/fav.jpeg" },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const isLoginPage = (headers().get("x-pathname") ?? "").startsWith("/admin/login");

  // The admin sign-in page renders standalone — its own layout handles signed-in users.
  if (isLoginPage) return <>{children}</>;

  if (!session) redirect(`/admin/login?callbackUrl=${encodeURIComponent("/admin")}`);
  if (session.user.role !== "admin" && session.user.role !== "superadmin") redirect("/account");

  return <AdminShell>{children}</AdminShell>;
}
