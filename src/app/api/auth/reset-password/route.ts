import { NextResponse } from "next/server";
import { verifyResetToken } from "@/lib/reset-token";
import { setUserPassword, getUserById } from "@/lib/db";
import { rateLimit, tooMany } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rl = rateLimit(req, "reset-password", 10, 3600000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const token = body.token?.trim() ?? "";
  const password = body.password ?? "";
  if (!token) return NextResponse.json({ error: "Missing reset token" }, { status: 400 });
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const userId = verifyResetToken(token);
  if (!userId) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Request a new one." },
      { status: 400 }
    );
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "This account no longer exists" }, { status: 404 });
  }

  await setUserPassword(userId, password);
  return NextResponse.json({ ok: true });
}
