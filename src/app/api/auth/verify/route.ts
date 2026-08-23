import { NextResponse } from "next/server";
import { verifyVerifyToken } from "@/lib/reset-token";
import { getUserById, setUserVerified } from "@/lib/db";
import { rateLimit, tooMany } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Confirms a signup email: validates the signed token and flags the user verified. */
export async function POST(req: Request) {
  const rl = rateLimit(req, "verify", 20, 3600000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const token = body.token?.trim() ?? "";
  if (!token) return NextResponse.json({ error: "Missing verification token" }, { status: 400 });

  const userId = verifyVerifyToken(token);
  if (!userId) {
    return NextResponse.json(
      { error: "This verification link is invalid or has expired. Register again or contact support." },
      { status: 400 }
    );
  }

  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "This account no longer exists" }, { status: 404 });

  // Idempotent — clicking the link twice (or after manual admin verification)
  // still returns success instead of confusing the customer.
  if (user.verified !== 1) await setUserVerified(userId, 1);
  return NextResponse.json({ ok: true, email: user.email });
}
