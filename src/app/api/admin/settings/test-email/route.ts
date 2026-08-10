import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api-helpers";
import { getSmtpConfig, isSmtpConfigured, sendTestEmail } from "@/lib/mailer";
import { getSetting } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  const cfg = await getSmtpConfig();
  const settingsEmail = await getSetting("email");
  return NextResponse.json({
    configured: isSmtpConfigured(cfg),
    host: cfg?.host ?? null,
    port: cfg?.port ?? null,
    user: cfg?.user ?? null,
    from: cfg?.from ?? null,
    secure: cfg?.secure ?? false,
    settingsEmail,
  });
}

export async function POST(req: Request) {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  let body: { to?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const to = body.to?.trim() || (await getSetting("email")) || "";
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ error: "Enter a valid recipient email address" }, { status: 400 });
  }

  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) {
    return NextResponse.json(
      { error: "SMTP is not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS (and SMTP_FROM) in your environment" },
      { status: 400 }
    );
  }

  try {
    await sendTestEmail({ to });
    return NextResponse.json({ ok: true, to });
  } catch (err) {
    console.error("[admin/settings/test-email] send failed:", err);
    const msg = err instanceof Error ? err.message : "Unknown SMTP error";
    return NextResponse.json({ error: `Test email failed: ${msg}` }, { status: 500 });
  }
}
