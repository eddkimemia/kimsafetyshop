import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/api-helpers";
import { getUserById } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionUser();
  if (!session?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const account = await getUserById(session.id);
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user: { id: account.id, name: account.name, email: account.email, role: account.role } });
}