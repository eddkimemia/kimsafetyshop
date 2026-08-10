import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { siteUrl } from "@/lib/site";
import { getAllSettings } from "@/lib/db";
import { liveGetProduct } from "@/lib/catalog";
import { bulkUnitPrice } from "@/lib/utils";

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

export function isSmtpConfigured(cfg?: SmtpConfig | null): boolean {
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
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;
  const from = process.env.SMTP_FROM || `${user}`;
  return { host, port, secure, user, pass, from };
}

function createTransporter(cfg: SmtpConfig): Transporter {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });
}

// ---------------------------------------------------------------------------
// Branded email template
// ---------------------------------------------------------------------------

const NAVY = "#0F2847";
const SAFETY = "#F57C00";
const EMERALD = "#059669";
const GRAY = "#6B7280";

type Brand = {
  logo: string;
  site_name: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  waLink: string;
  email: string;
  address: string;
  website: string;
};

async function getBrand(): Promise<Brand> {
  const s = await getAllSettings();
  const logo = s.logo || "/images/logo/logoy.jpg";
  const whatsapp = (s.whatsapp || "254715135141").replace(/\D/g, "");
  return {
    logo: logo.startsWith("http") ? logo : `${siteUrl}${logo}`,
    site_name: s.site_name || "KimSafety Ltd",
    tagline: s.tagline || "Safety Equipment Kenya",
    phone: s.phone || "+254 715135141",
    whatsapp,
    waLink: `https://wa.me/${whatsapp}`,
    email: s.email || "sales@kimsafety.co.ke",
    address: s.address || "KimSafety House, Enterprise Road, Industrial Area, Nairobi, Kenya",
    website: siteUrl.replace(/^https?:\/\//, ""),
  };
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const money = (n: number) => "KES " + Math.round(n).toLocaleString("en-KE");

function renderShell(brand: Brand, body: string): string {
  return `
  <div style="background:#f3f4f6;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:0 auto;">
      <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:${NAVY};text-align:center;padding:26px 24px 20px;">
          <img src="${brand.logo}" alt="${esc(brand.site_name)}" style="height:52px;max-width:240px;object-fit:contain;" />
          <div style="font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#93a5be;margin-top:10px;">${esc(brand.tagline)}</div>
          <div style="width:56px;height:4px;background:${SAFETY};margin:14px auto 0;border-radius:2px;"></div>
        </div>
        <div style="padding:32px 36px 28px;">
          ${body}
        </div>
      </div>
      <div style="text-align:center;padding:26px 16px 10px;color:${GRAY};">
        <p style="font-size:13px;font-weight:bold;color:${NAVY};margin:0 0 4px 0;">${esc(brand.site_name)}</p>
        <p style="font-size:12px;line-height:1.7;margin:0 0 10px 0;">${esc(brand.address)}<br/>${esc(brand.phone)} · <a href="mailto:${esc(brand.email)}" style="color:${GRAY};text-decoration:none;">${esc(brand.email)}</a> · <a href="${siteUrl}" style="color:${GRAY};text-decoration:none;">${esc(brand.website)}</a></p>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td align="center">
              <a href="${brand.waLink}" style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;font-weight:bold;font-size:12px;padding:10px 22px;border-radius:999px;">Chat on WhatsApp</a>
            </td>
          </tr>
        </table>
        <p style="font-size:11px;color:#9ca3af;margin:14px 0 0 0;">Certified safety equipment · KEBS compliant stock · Delivered nationwide</p>
      </div>
    </div>
  </div>`;
}

function btn(href: string, label: string, outline = false): string {
  const base = "display:inline-block;text-decoration:none;font-weight:bold;font-size:14px;padding:13px 28px;border-radius:10px;";
  const style = outline
    ? `${base}background:#ffffff;color:${NAVY};border:2px solid ${NAVY};`
    : `${base}background:${SAFETY};color:#ffffff;`;
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center" style="padding:4px 0;"><a href="${href}" style="${style}">${label}</a></td></tr></table>`;
}

function eyebrow(label: string): string {
  return `<p style="font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${SAFETY};margin:0 0 10px 0;">${label}</p>`;
}

function sectionTitle(label: string): string {
  return `<p style="font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${NAVY};margin:0 0 14px 0;border-bottom:2px solid #f3f4f6;padding-bottom:10px;">${label}</p>`;
}

function summaryCard(rows: { label: string; value: string; highlight?: boolean }[]): string {
  const body = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:10px 18px;font-size:12px;color:${GRAY};${r.highlight ? "border-top:2px solid #f3f4f6;" : ""}">${r.label}</td>
        <td style="padding:10px 18px;font-size:13px;font-weight:bold;color:${r.highlight ? SAFETY : NAVY};text-align:right;">${r.value}</td>
      </tr>`
    )
    .join("");
  return `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;background:#fafafa;margin:0 0 20px 0;">
    ${body}
  </table>`;
}

function orderStepsHtml(activeIndex: number): string {
  const steps = ["Order Confirmed", "Processing", "Dispatched", "Delivered"];
  const cells = steps
    .map((s, i) => {
      const done = i < activeIndex;
      const current = i === activeIndex;
      const bg = done ? EMERALD : current ? SAFETY : "#e5e7eb";
      const color = done || current ? "#ffffff" : "#9ca3af";
      const labelColor = current ? NAVY : done ? "#374151" : "#9ca3af";
      const labelWeight = current || done ? "bold" : "600";
      return `
      <td align="center" style="padding:6px 2px;border-top:3px solid ${i === 0 ? "transparent" : done || current ? NAVY : "#e5e7eb"};">
        <div style="width:26px;height:26px;border-radius:50%;background:${bg};color:${color};font-size:12px;font-weight:bold;line-height:26px;margin:0 auto 6px auto;">${done ? "✓" : i + 1}</div>
        <div style="font-size:10px;color:${labelColor};font-weight:${labelWeight};line-height:1.2;">${s}</div>
      </td>`;
    })
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>${cells}</tr></table>`;
}

async function resolveItems(itemsJson: string) {
  const items = JSON.parse(itemsJson) as { productId: string; qty: number; price?: number }[];
  return (
    await Promise.all(
      items.map(async (i) => {
        const p = await liveGetProduct(i.productId);
        return { name: p?.name ?? i.productId, qty: i.qty, price: p ? bulkUnitPrice(p, i.qty) : (i.price ?? 0) };
      })
    )
  ).filter((r) => r.qty > 0);
}

// ---------------------------------------------------------------------------
// Emails
// ---------------------------------------------------------------------------

export async function sendTestEmail(input: { to: string }): Promise<boolean> {
  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();
  await createTransporter(cfg).sendMail({
    from: cfg.from,
    to: input.to,
    subject: "KimSafety — SMTP test",
    text: "If you can read this, your SMTP configuration is working.",
    html: renderShell(
      brand,
      `
      ${eyebrow("SMTP test")}
      <h1 style="font-size:24px;color:${NAVY};margin:0 0 14px 0;">Email is working 🎉</h1>
      <p style="font-size:14px;line-height:1.7;color:#374151;margin:0 0 14px 0;">If you can read this email, your SMTP configuration is working. KimSafety is now sending password resets, order confirmations, invoices, quote replies and newsletters through this account.</p>
      <p style="font-size:13px;line-height:1.7;color:${GRAY};margin:0;">No action needed — this is a test message.</p>
      `
    ),
  });
  return true;
}

export async function sendWelcomeEmail(input: { to: string; name?: string | null }): Promise<boolean> {
  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();
  const firstName = (input.name ?? "").split(" ")[0] || "there";
  await createTransporter(cfg).sendMail({
    from: cfg.from,
    to: input.to,
    subject: "Welcome to KimSafety — your account is ready",
    text: `Hi ${firstName},\n\nWelcome to KimSafety. Your account is ready — sign in to browse certified PPE, track orders and request quotations.\n\n${siteUrl}/login\n\n— KimSafety Team`,
    html: renderShell(
      brand,
      `
      ${eyebrow("Welcome to KimSafety")}
      <h1 style="font-size:24px;color:${NAVY};margin:0 0 14px 0;">Hi ${esc(firstName)}, your account is ready</h1>
      <p style="font-size:14px;line-height:1.7;color:#374151;margin:0 0 18px 0;">Thanks for joining ${esc(brand.site_name)} — Kenya's trusted source for certified safety equipment. Here's what you can do with your account:</p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 20px 0;">
        <tr>
          <td style="padding:12px 16px;background:#fafafa;border:1px solid #e5e7eb;border-radius:10px;font-size:13px;color:#374151;line-height:1.7;">
            ✅ Shop 800+ certified PPE products<br/>
            🚚 Nationwide delivery within 24–72 hours<br/>
            📄 Request quotations & tender documents<br/>
            🔔 Track orders and download invoices
          </td>
        </tr>
      </table>
      ${btn(`${siteUrl}/login`, "Sign in to your account")}
      <p style="font-size:12px;color:${GRAY};text-align:center;margin:14px 0 0 0;">Need help? WhatsApp us on ${esc(brand.phone)}</p>
      `
    ),
  });
  return true;
}

export async function sendCorporateWelcomeEmail(input: {
  to: string;
  name?: string | null;
  company: string;
  tempPassword?: string;
}): Promise<boolean> {
  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();
  const { to, name, company, tempPassword } = input;
  const firstName = (name ?? "").split(" ")[0] || "there";
  const passwordNote = tempPassword
    ? `<p style="font-size:13px;line-height:1.7;color:#374151;margin:0 0 14px 0;">Your temporary password is <strong style="font-family:monospace;background:#f1f5f9;color:${NAVY};padding:3px 10px;border-radius:6px;font-size:14px;">${esc(tempPassword)}</strong> — you'll be asked to change it on your first sign-in.</p>`
    : "";
  await createTransporter(cfg).sendMail({
    from: cfg.from,
    to,
    subject: `Your ${company} corporate account with KimSafety is active`,
    text: `Hi ${firstName},\n\nYour corporate account with ${company} is now active. Sign in here: ${siteUrl}/login${tempPassword ? `\nTemporary password: ${tempPassword}` : ""}\n\n— KimSafety Team`,
    html: renderShell(
      brand,
      `
      ${eyebrow("Corporate account approved")}
      <h1 style="font-size:24px;color:${NAVY};margin:0 0 14px 0;">Your ${esc(company)} account is active</h1>
      <p style="font-size:14px;line-height:1.7;color:#374151;margin:0 0 14px 0;">Hi ${esc(firstName)},</p>
      <p style="font-size:14px;line-height:1.7;color:#374151;margin:0 0 18px 0;">KimSafety has approved the corporate account for <strong>${esc(company)}</strong>. You can now order with corporate pricing, request quotations and track every purchase in one place.</p>
      ${passwordNote}
      ${btn(`${siteUrl}/login`, "Sign in to your corporate account")}
      <p style="font-size:12px;color:${GRAY};text-align:center;margin:14px 0 0 0;">Your dedicated account manager is on WhatsApp — ${esc(brand.phone)}</p>
      `
    ),
  });
  return true;
}

export async function sendQuoteConfirmationEmail(input: {
  to: string;
  name?: string | null;
  quoteId: string;
  total: number;
}): Promise<boolean> {
  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();
  const { to, name, quoteId, total } = input;
  const firstName = (name ?? "").split(" ")[0] || "there";
  await createTransporter(cfg).sendMail({
    from: cfg.from,
    to,
    subject: `Quote request ${quoteId} received — KimSafety`,
    text: `Hi ${firstName},\n\nWe received your quotation request ${quoteId} (estimated KES ${Math.round(total).toLocaleString("en-KE")}). Our team will confirm pricing and availability within 4 business hours.\n\n— KimSafety Team`,
    html: renderShell(
      brand,
      `
      ${eyebrow("Quotation request received")}
      <h1 style="font-size:24px;color:${NAVY};margin:0 0 14px 0;">Thank you, ${esc(firstName)}!</h1>
      <p style="font-size:14px;line-height:1.7;color:#374151;margin:0 0 18px 0;">We received your quotation request and our team is already on it. You'll have pricing, availability and delivery confirmed within <strong>4 business hours</strong>.</p>
      ${summaryCard([
        { label: "Quote reference", value: esc(quoteId) },
        { label: "Estimated total", value: money(total), highlight: true },
      ])}
      <p style="font-size:13px;line-height:1.7;color:#374151;margin:0 0 18px 0;">While you wait, browse our full catalogue or message us directly — we're happy to help with specs, certifications and bulk pricing.</p>
      ${btn(`${siteUrl}/search`, "Browse the catalogue", true)}
      `
    ),
  });
  return true;
}

export async function sendPasswordResetEmail(input: {
  to: string;
  name?: string | null;
  resetUrl: string;
}): Promise<boolean> {
  const cfg: SmtpConfig | null = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();

  const { to, name, resetUrl } = input;
  const transporter = createTransporter(cfg);
  const firstName = (name ?? "").split(" ")[0] || "there";
  await transporter.sendMail({
    from: cfg.from,
    to,
    subject: "Reset your KimSafety password",
    text: `Hi ${firstName},\n\nWe received a request to reset the password for your KimSafety account. Open the link below to choose a new password. The link expires in 1 hour.\n\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.\n\n— KimSafety Team`,
    html: renderShell(
      brand,
      `
      ${eyebrow("Account security")}
      <h1 style="font-size:24px;color:${NAVY};margin:0 0 14px 0;">Reset your password</h1>
      <p style="font-size:14px;line-height:1.7;color:#374151;margin:0 0 14px 0;">Hi ${esc(firstName)},</p>
      <p style="font-size:14px;line-height:1.7;color:#374151;margin:0 0 18px 0;">We received a request to reset the password for your KimSafety account. Tap the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>
      ${btn(resetUrl, "Reset password")}
      <p style="font-size:13px;line-height:1.7;color:${GRAY};margin:14px 0 14px 0;">If the button does not work, copy and paste this link into your browser:</p>
      <p style="font-size:12px;color:${GRAY};margin:0 0 14px 0;word-break:break-all;">${esc(resetUrl)}</p>
      <p style="font-size:13px;line-height:1.7;color:${GRAY};margin:0;">If you did not request this, you can safely ignore this email — your password will stay the same.</p>
      `
    ),
  });
  return true;
}

export async function sendOrderInvoiceEmail(input: {
  to: string;
  orderId: string;
  orderTotal: number;
  pdf: Buffer;
  name: string;
  phone: string;
  address: string;
  company?: string | null;
  items: string;
  payment: string;
  paid: number;
  status: string;
  created_at: string;
}): Promise<boolean> {
  const cfg: SmtpConfig | null = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();

  const { to, orderId, orderTotal, pdf, name, phone, address, company, items, payment, paid, status } = input;
  const transporter = createTransporter(cfg);

  const orderStatuses = ["Order Confirmed", "Processing", "Dispatched", "Delivered"];
  const statusIndex = Math.max(orderStatuses.indexOf(status), 0);
  const paymentLabel: Record<string, string> = {
    mpesa: "M-Pesa",
    card: "Card (Paystack)",
    bank: "Bank Transfer",
    po: "Purchase Order (30-day terms)",
  };
  const rows = await resolveItems(items);
  const itemRows = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
          <p style="font-size:13px;font-weight:bold;color:${NAVY};margin:0 0 2px 0;">${esc(r.name)}</p>
          <p style="font-size:11px;color:${GRAY};margin:0;">${r.qty} × ${money(r.price)}</p>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:bold;color:#374151;text-align:right;white-space:nowrap;">${money(r.price * r.qty)}</td>
      </tr>`
    )
    .join("");

  const deliveredNote = paid === 1 ? "" : `<p style="font-size:12px;color:${GRAY};margin:12px 0 0 0;text-align:center;">Payment: ${esc(paymentLabel[payment] ?? payment)} — your invoice shows the payment details.</p>`;

  await transporter.sendMail({
    from: cfg.from,
    to,
    subject: `Order confirmed — ${orderId} · KES ${Math.round(orderTotal).toLocaleString("en-KE")}`,
    text: `Hi ${name},\n\nThank you for your order! Your order ${orderId} (total KES ${Math.round(orderTotal).toLocaleString("en-KE")}) has been received and is being processed.\n\nTrack it anytime at ${siteUrl}/account/orders\n\nYour invoice is attached to this email.\n\n— KimSafety Team`,
    html: renderShell(
      brand,
      `
      ${eyebrow("Order confirmation")}
      <h1 style="font-size:24px;color:${NAVY};margin:0 0 8px 0;">Thank you for your order!</h1>
      <p style="font-size:14px;line-height:1.7;color:#374151;margin:0 0 22px 0;">Your order has been received and is now being processed. Keep this email handy — your invoice is attached below.</p>
      ${summaryCard([
        { label: "Order number", value: esc(orderId) },
        { label: "Order total", value: money(orderTotal), highlight: true },
        { label: "Payment", value: esc(paymentLabel[payment] ?? payment) },
        { label: "Status", value: paid === 1 ? "Paid ✓" : "Payment due" },
      ])}
      ${sectionTitle("Order status")}
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 22px 0;background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;padding:6px;">
        <tr>${orderStepsHtml(statusIndex)}</tr>
      </table>
      ${sectionTitle("Delivery details")}
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 22px 0;">
        <tr>
          <td style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;padding:16px 18px;">
            <p style="font-size:14px;font-weight:bold;color:${NAVY};margin:0 0 6px 0;">${esc(name)}${company ? ` · ${esc(company)}` : ""}</p>
            <p style="font-size:13px;line-height:1.7;color:#374151;margin:0;">${esc(address)}</p>
            <p style="font-size:13px;color:${GRAY};margin:4px 0 0 0;">${esc(phone)}</p>
          </td>
        </tr>
      </table>
      ${sectionTitle("Items ordered")}
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 22px 0;">
        ${itemRows}
      </table>
      <p style="font-size:13px;line-height:1.7;color:#374151;margin:0 0 14px 0;text-align:center;">Track your order anytime from your <a href="${siteUrl}/account/orders" style="color:${SAFETY};font-weight:bold;">order history</a> — your invoice PDF is attached to this email.</p>
      ${btn(`${siteUrl}/account/orders`, "View your order")}
      ${deliveredNote}
      `
    ),
    attachments: [{ filename: `kimsafety-invoice-${orderId}.pdf`, content: pdf, contentType: "application/pdf" }],
  });
  return true;
}

export async function sendNewOrderAlert(input: {
  to: string;
  orderId: string;
  orderTotal: number;
  customer: string;
  company?: string | null;
  payment: string;
}): Promise<boolean> {
  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();
  const { to, orderId, orderTotal, customer, company, payment } = input;
  await createTransporter(cfg).sendMail({
    from: cfg.from,
    to,
    subject: `New order ${orderId} — KES ${Math.round(orderTotal).toLocaleString("en-KE")}`,
    text: `New KimSafety order ${orderId} (KES ${Math.round(orderTotal).toLocaleString("en-KE")}) from ${customer}${company ? ` (${company})` : ""}. Payment: ${payment}. Manage it at ${siteUrl}/admin/orders.`,
    html: renderShell(
      brand,
      `
      ${eyebrow("Staff alert · new order")}
      <h1 style="font-size:22px;color:${NAVY};margin:0 0 14px 0;">New order ${esc(orderId)}</h1>
      ${summaryCard([
        { label: "Customer", value: esc(customer) + (company ? ` · ${esc(company)}` : "") },
        { label: "Total", value: money(orderTotal), highlight: true },
        { label: "Payment", value: esc(payment) },
      ])}
      ${btn(`${siteUrl}/admin/orders`, "Open in admin")}
      `
    ),
  });
  return true;
}

export async function sendNewQuoteAlert(input: {
  to: string;
  quoteId: string;
  total: number;
  customer: string;
  company?: string | null;
}): Promise<boolean> {
  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();
  const { to, quoteId, total, customer, company } = input;
  await createTransporter(cfg).sendMail({
    from: cfg.from,
    to,
    subject: `New quote request ${quoteId} — KES ${Math.round(total).toLocaleString("en-KE")}`,
    text: `New KimSafety quote request ${quoteId} (estimated KES ${Math.round(total).toLocaleString("en-KE")}) from ${customer}${company ? ` (${company})` : ""}. Manage it at ${siteUrl}/admin/quotes.`,
    html: renderShell(
      brand,
      `
      ${eyebrow("Staff alert · new quotation")}
      <h1 style="font-size:22px;color:${NAVY};margin:0 0 14px 0;">Quote request ${esc(quoteId)}</h1>
      ${summaryCard([
        { label: "Customer", value: esc(customer) + (company ? ` · ${esc(company)}` : "") },
        { label: "Estimated total", value: money(total), highlight: true },
      ])}
      ${btn(`${siteUrl}/admin/quotes`, "Open in admin")}
      `
    ),
  });
  return true;
}

export async function newsletterHtml(input: { title: string; body: string }): Promise<string> {
  const brand = await getBrand();
  // Body is sanitized HTML from the rich text editor; fall back to plain text
  // paragraphs when the message contains no markup at all.
  const isHtml = /<[a-zA-Z][\s\S]*>/.test(input.body);
  const content = isHtml
    ? input.body
    : input.body
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p style="margin:0 0 14px 0;line-height:1.7;">${esc(p)}</p>`)
        .join("");
  return renderShell(
    brand,
    `
    ${eyebrow("Safety briefing")}
    <h1 style="font-size:24px;color:${NAVY};margin:0 0 18px 0;">${esc(input.title)}</h1>
    <div style="font-size:14px;line-height:1.7;color:#334155;">${content}</div>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:22px;border-top:1px solid #f3f4f6;padding-top:16px;">
      <tr><td align="center" style="font-size:12px;color:${GRAY};line-height:1.7;">
        You are receiving this because you subscribed to the KimSafety safety briefing.<br/>
        <a href="{{unsubscribe_url}}" style="color:#dc2626;font-weight:bold;">Unsubscribe</a>
      </td></tr>
    </table>
    `
  );
}

export async function sendNewsletterBroadcast(input: {
  subject: string;
  html: string;
  to: { email: string; name: string | null; token: string }[];
  cfg: SmtpConfig;
}): Promise<{ sent: number; failed: number }> {
  const { subject, html, to, cfg } = input;
  const transporter = createTransporter(cfg);

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
