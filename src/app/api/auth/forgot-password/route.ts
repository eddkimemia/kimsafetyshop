import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/db";
import { createResetToken } from "@/lib/reset-token";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Requests a reset link for any account (customer or staff). Always responds OK to avoid leaking which emails exist. */
export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const user = await getUserByEmail(email);
  if (user) {
    const token = createResetToken(user.id);
    const resetUrl = `${siteUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const sent = await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
    if (!sent) console.error("[forgot-password] SMTP not configured — reset link not sent");
  }

  // Always succeed — do not reveal whether the email is registered.
  return NextResponse.json({ ok: true });
}
