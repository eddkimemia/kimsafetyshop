import { NextResponse } from "next/server";
import { requireAdmin, requireSuperAdmin, getSessionUser } from "@/lib/api-helpers";
import { getUserById } from "@/lib/db";
import { createResetToken } from "@/lib/reset-token";
import { sendPasswordResetEmail, getSmtpConfig, isSmtpConfigured } from "@/lib/mailer";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * Admin-initiated password reset. Sends the account owner a signed reset link
 * by email. Staff may reset customer passwords; only the superadmin may reset
 * other staff accounts.
 */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const id = body.id;
  if (!id) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

  const target = await getUserById(id);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const me = await getSessionUser();
  if (target.id === me?.id) {
    return NextResponse.json({ error: "Use the forgot-password form to reset your own password" }, { status: 400 });
  }

  // Resetting a staff/superadmin password is a superadmin-only action.
  if (target.role !== "user") {
    const deniedSuper = await requireSuperAdmin();
    if (deniedSuper) return deniedSuper;
  }

  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) {
    return NextResponse.json(
      { error: "SMTP is not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS in your .env (or Vercel environment)" },
      { status: 400 }
    );
  }

  const token = createResetToken(target.id);
  const resetUrl = `${siteUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const sent = await sendPasswordResetEmail({ to: target.email, name: target.name, resetUrl });
  if (!sent) {
    return NextResponse.json({ error: "Could not send the reset email — check the SMTP configuration" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email: target.email });
}
