import nodemailer from "nodemailer";
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

// SMTP is configured exclusively through environment variables — never via the admin
// settings page. Keep SMTP credentials out of the database.
export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST || "";
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = port === 465;
  const from = process.env.SMTP_FROM || `${user}`;
  return { host, port, secure, user, pass, from };
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
  // Body is sanitized HTML from the rich text editor; fall back to plain text
  // paragraphs when the message contains no markup at all.
  const isHtml = /<[a-zA-Z][\s\S]*>/.test(input.body);
  const content = isHtml
    ? input.body
    : input.body
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
      <div style="font-size:14px;line-height:1.7;color:#334155;">${content}</div>
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

export async function sendPasswordResetEmail(input: {
  to: string;
  name?: string | null;
  resetUrl: string;
}): Promise<boolean> {
  const cfg: SmtpConfig | null = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;

  const { to, name, resetUrl } = input;
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });

  const firstName = (name ?? "").split(" ")[0] || "there";
  await transporter.sendMail({
    from: cfg.from,
    to,
    subject: "Reset your KimSafety password",
    text: `Hi ${firstName},\n\nWe received a request to reset the password for your KimSafety account. Open the link below to choose a new password. The link expires in 1 hour.\n\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.\n\n— KimSafety Team`,
    html: `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f6f8fa;">
    <div style="background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
      <p style="font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#0f2847;margin:0 0 12px 0;">KimSafety · Account security</p>
      <h1 style="font-size:22px;color:#0f2847;margin:0 0 18px 0;">Reset your password</h1>
      <p style="font-size:14px;line-height:1.7;color:#334155;margin:0 0 14px 0;">Hi ${firstName},</p>
      <p style="font-size:14px;line-height:1.7;color:#334155;margin:0 0 14px 0;">
        We received a request to reset the password for your KimSafety account. Tap the button below to
        choose a new password. This link expires in <strong>1 hour</strong>.
      </p>
      <p style="margin:0 0 18px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:#0f2847;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:10px;">Reset password</a>
      </p>
      <p style="font-size:13px;line-height:1.7;color:#64748b;margin:0 0 14px 0;">If the button does not work, copy and paste this link into your browser:</p>
      <p style="font-size:12px;color:#64748b;margin:0 0 14px 0;word-break:break-all;">${resetUrl}</p>
      <p style="font-size:13px;line-height:1.7;color:#64748b;margin:0;">If you did not request this, you can safely ignore this email.</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 16px 0;" />
      <p style="font-size:12px;color:#64748b;margin:0;">— KimSafety Team · KimSafety House, Enterprise Road, Industrial Area, Nairobi, Kenya</p>
    </div>
  </div>`,
  });
  return true;
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
