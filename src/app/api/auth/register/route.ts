import { NextResponse } from "next/server";
import { createUser, getUserByEmail, q1 } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/mailer";
import { createVerifyToken } from "@/lib/reset-token";
import { rateLimit, tooMany } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const rl = rateLimit(req, "register", 5, 600000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  let body: { name?: string; email?: string; password?: string; company?: string; phone?: string; referral?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const phone = body.phone?.trim();

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid name and email address" }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  if (await getUserByEmail(email)) {
    // Mitigate email enumeration: do not reveal that the address is already
    // registered (409 would allow an attacker to probe). Return a generic
    // success instead — identical to the forgot-password flow. The caller sees
    // the same 201 / "verification sent" screen either way; if you prefer the
    // explicit "account exists" UX, revert this to the 409 above.
    return NextResponse.json(
      { ok: true, message: "If this email is new, a verification link has been sent. Check your inbox." },
      { status: 200 }
    );
  }

  // Referral codes are validated (but never blocked on) — an unknown or empty
  // code simply records no referrer.
  const referralCode = body.referral?.trim().toUpperCase() || null;
  let referredBy: string | null = null;
  if (referralCode) {
    const referrer = await q1<{ id: string }>("SELECT id FROM users WHERE UPPER(referral_code) = ?", referralCode);
    if (referrer) referredBy = referrer.id;
  }

  const user = await createUser({
    name,
    email,
    password,
    company: body.company?.trim() || undefined,
    phone,
    verified: 0,
    referred_by: referredBy,
  });

  // Email verification: the account starts unverified (verified = 0) and the
  // customer activates it via the signed link. Best-effort — never blocks
  // registration when SMTP is unset. Awaited (not fire-and-forget): on Vercel
  // serverless the event loop freezes when the handler returns, and an
  // un-awaited SMTP send never completes.
  try {
    await sendVerificationEmail({ to: email, name, token: createVerifyToken(user.id) });
  } catch (err) {
    console.error("[register] verification email failed:", err);
  }

  return NextResponse.json(
    { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    { status: 201 }
  );
}
