import nodemailer from "nodemailer";
import { getAllSettings } from "@/lib/db";
import { siteUrl } from "@/lib/site";

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

export function isSmtpConfigured(cfg?: SmtpConfig): boolean {
  if (!cfg) return false;
  return Boolean(cfg.host && cfg.user && cfg.pass);
}

export async function getSmtpConfig(): Promise<SmtpConfig | null> {
  try {
    const settings = await getAllSettings();
    const host = process.env.SMTP_HOST || settings.smtp_host || "";
    const user = process.env.SMTP_USER || settings.smtp_user || "";
    const pass = process.env.SMTP_PASS || settings.smtp_pass || "";
    const port = Number(process.env.SMTP_PORT || settings.smtp_port || 587);
    const secure = port === 465;
    const from = process.env.SMTP_FROM || settings.smtp_from || (settings.site_name ? `${settings.site_name} <${user}>` : "");
    if (!host || !user || !pass) return null;
    return { host, port, secure, user, pass, from };
  } catch {
    return null;
  }
}

export async function sendNewsletterBroadcast(input: {
  subject: string;
  html: string;
  to: { email: string; name: string | null; token: string }[];
  cfg: SmtpConfig;
}): Promise<{ sent: number; failed: number }> {
  const { subject, html, to, cfg } = input;
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });

  let sent = 0;
  let failed = 0;
  const batchSize = 50;
  for (let i = 0; i < to.length; i += batchSize) {
    const batch = to.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (recipient) => {
        await transporter.sendMail({
          from: cfg.from,
          to: recipient.email,
          subject,
          html: html.replace("{{unsubscribe_url}}", `${siteUrl}/unsubscribe/${recipient.token}`),
        });
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled") sent++;
      else failed++;
    }
  }
  return { sent, failed };
}

export function newsletterHtml(input: { title: string; body: string }): string {
  const paragraphs = input.body
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 14px 0;line-height:1.7;">${p.replace(/</g, "&lt;")}</p>`)
    .join("");
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f6f8fa;">
    <div style="background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
      <p style="font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#0f2847;margin:0 0 12px 0;">KimSafety · Safety briefing</p>
      <h1 style="font-size:22px;color:#0f2847;margin:0 0 18px 0;">${input.title.replace(/</g, "&lt;")}</h1>
      ${paragraphs}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 16px 0;" />
      <p style="font-size:12px;color:#64748b;margin:0 0 6px 0;">
        KimSafety House, Enterprise Road, Industrial Area, Nairobi, Kenya
      </p>
      <p style="font-size:12px;color:#64748b;margin:0;">
        You are receiving this because you subscribed to the KimSafety safety briefing.
        <a href="{{unsubscribe_url}}" style="color:#dc2626;">Unsubscribe</a>
      </p>
    </div>
  </div>`;
}

export async function sendOrderInvoiceEmail(input: {
  to: string;
  orderId: string;
  orderTotal: number;
  pdf: Buffer;
}): Promise<boolean> {
  const cfg: SmtpConfig | null = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;

  const { to, orderId, orderTotal, pdf } = input;
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });

  await transporter.sendMail({
    from: cfg.from,
    to,
    subject: `Your KimSafety invoice #${orderId}`,
    text: `Thank you for your order with KimSafety. Your invoice #${orderId} (total KES ${orderTotal.toLocaleString(
      "en-KE"
    )}) is attached.`,
    html: invoiceHtml({ orderId, orderTotal }),
    attachments: [{ filename: `kimsafety-invoice-${orderId}.pdf`, content: pdf, contentType: "application/pdf" }],
  });
  return true;
}

function invoiceHtml(input: { orderId: string; orderTotal: number }): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f6f8fa;">
    <div style="background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
      <p style="font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#0f2847;margin:0 0 12px 0;">KimSafety · Order confirmation</p>
      <h1 style="font-size:22px;color:#0f2847;margin:0 0 18px 0;">Thank you for your order</h1>
      <p style="font-size:14px;line-height:1.7;color:#334155;margin:0 0 14px 0;">
        Your invoice <strong>#${input.orderId}</strong> (total
        <strong>KES ${input.orderTotal.toLocaleString("en-KE")}</strong>) is attached to this email.
      </p>
      <p style="font-size:14px;line-height:1.7;color:#334155;margin:0 0 14px 0;">
        You can also download it any time from your <a href="${siteUrl}/account/orders" style="color:#f57c00;">order history</a>.
      </p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 16px 0;" />
      <p style="font-size:12px;color:#64748b;margin:0 0 6px 0;">
        KimSafety House, Enterprise Road, Industrial Area, Nairobi, Kenya
      </p>
      <p style="font-size:12px;color:#64748b;margin:0;">Questions? WhatsApp us on +254 715 135 141.</p>
    </div>
  </div>`;
}
