import { NextResponse } from "next/server";
import { listNewsletterSubscribers } from "@/lib/db";
import { getSmtpConfig, isSmtpConfigured, newsletterHtml, sendNewsletterBroadcast } from "@/lib/mailer";
import { requireAdmin } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: { subject?: string; body?: string; test?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!subject) return NextResponse.json({ error: "Subject is required" }, { status: 400 });
  if (subject.length > 150) return NextResponse.json({ error: "Subject is too long" }, { status: 400 });
  if (!text) return NextResponse.json({ error: "Message body is required" }, { status: 400 });
  if (text.length > 100_000) return NextResponse.json({ error: "Message is too long" }, { status: 400 });

  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) {
    return NextResponse.json(
      { error: "SMTP is not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS (env) or smtp_host/smtp_user/smtp_pass (settings)" },
      { status: 400 }
    );
  }

  const subscribers = await listNewsletterSubscribers(true);
  const to = subscribers
    .filter((s) => s.unsubscribe_token)
    .map((s) => ({ email: s.email, name: s.name, token: s.unsubscribe_token! }));
  if (to.length === 0) {
    return NextResponse.json({ error: "No active subscribers yet" }, { status: 400 });
  }

  if (body.test) {
    const recipient = to[0];
    const { sent, failed } = await sendNewsletterBroadcast({
      subject,
      html: newsletterHtml({ title: subject, body: text }),
      to: [recipient],
      cfg,
    });
    return NextResponse.json({ sent, failed, test: true, firstRecipient: recipient.email });
  }

  try {
    const { sent, failed } = await sendNewsletterBroadcast({
      subject,
      html: newsletterHtml({ title: subject, body: text }),
      to,
      cfg,
    });
    return NextResponse.json({ sent, failed, total: to.length });
  } catch (err) {
    console.error("[newsletter] broadcast failed:", (err as Error).message);
    return NextResponse.json({ error: `Broadcast failed: ${(err as Error).message}` }, { status: 500 });
  }
}
