import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/api-helpers";
import { getUserById, verifyPassword, setUserPassword } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const currentPassword = body.currentPassword ?? "";
  const newPassword = body.newPassword ?? "";
  if (!currentPassword) {
    return NextResponse.json({ error: "Enter your current password" }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
  }

  const account = await getUserById(user.id);
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  if (!verifyPassword(currentPassword, account.password_hash)) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  await setUserPassword(account.id, newPassword);
  return NextResponse.json({ ok: true });
}
