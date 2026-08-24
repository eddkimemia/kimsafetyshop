import { NextResponse } from "next/server";
import { verifyResetTokenWithFingerprint, isResetTokenFingerprintValid } from "@/lib/reset-token";
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

  const parsed = verifyResetTokenWithFingerprint(token);
  if (!parsed) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Request a new one." },
      { status: 400 }
    );
  }

  const user = await getUserById(parsed.uid);
  if (!user) {
    return NextResponse.json({ error: "This account no longer exists" }, { status: 404 });
  }

  // Single-use enforcement: token embeds a fingerprint of the password hash at
  // issuance time. Once the password changes the fingerprint mismatches and the
  // token is rejected, even within its 1-hour TTL. Old tokens without a
  // fingerprint are also rejected (request a fresh link).
  if (!isResetTokenFingerprintValid(parsed.ph, user.password_hash)) {
    return NextResponse.json(
      { error: "This reset link has already been used or is invalid. Request a new one." },
      { status: 400 }
    );
  }

  await setUserPassword(parsed.uid, password);
  return NextResponse.json({ ok: true });
}
