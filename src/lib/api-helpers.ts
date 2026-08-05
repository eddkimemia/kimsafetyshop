import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export function requireAuth() {
  return getSessionUser().then((user) => (user ? null : NextResponse.json({ error: "Not authenticated" }, { status: 401 })));
}

const STAFF_ROLES = ["admin", "superadmin"];

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!STAFF_ROLES.includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function requireSuperAdmin() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (user.role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}
