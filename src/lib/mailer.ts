import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { siteUrl } from "@/lib/site";
import { getAllSettings } from "@/lib/db";
import { readLogoBytes } from "@/lib/logo";
import { liveGetProduct } from "@/lib/catalog";
import { bulkUnitPrice } from "@/lib/utils";
import { buildInvoicePdf } from "@/lib/invoice-pdf";
import { buildReceiptPdf } from "@/lib/receipt-pdf";

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
// Inline logo — embedded into every branded email as a CID attachment.
//
// Remote <img src="https://…"> headers silently render blank in many clients
// (Gmail/Outlook proxy blocks, corporate filters, or when the site is briefly
// unreachable). Embedding the logo bytes as an inline attachment is the only
// method that renders reliably everywhere, and it always uses the CURRENT
// admin-configured logo (fresh bytes on cache expiry).
// ---------------------------------------------------------------------------

const LOGO_CID = "kimsafety-logo";
let logoAttachmentCache: { at: number; att: { filename: string; content: Buffer; cid: string; contentType: string } } | null = null;

async function getLogoAttachment() {
  if (logoAttachmentCache && Date.now() - logoAttachmentCache.at < 5 * 60 * 1000) return logoAttachmentCache.att;
  let buf: Buffer | undefined;
  try {
    const s = await getAllSettings();
    buf = await readLogoBytes(s.logo);
  } catch {
    buf = undefined;
  }
  const ext = (() => {
    const b = buf;
    if (!b || b.length < 4) return "png";
    if (b[0] === 0xff && b[1] === 0xd8) return "jpg";
    if (b[0] === 0x89 && b[1] === 0x50) return "png";
    if (b.toString("ascii", 0, 4) === "RIFF") return "webp";
    return "jpg";
  })();
  const att = {
    filename: `logo.${ext}`,
    content: buf ?? Buffer.alloc(0),
    cid: LOGO_CID,
    contentType: ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg",
  };
  logoAttachmentCache = { at: Date.now(), att };
  return att;
}

/**
 * Sends mail with the branded logo attached inline. Every HTML email rendered
 * by renderShell references src="cid:kimsafety-logo"; without the attachment
 * the header logo would be blank.
 */
async function sendBrandedMail(cfg: SmtpConfig, mail: nodemailer.SendMailOptions) {
  const logo = await getLogoAttachment();
  const transporter = createTransporter(cfg);
  return transporter.sendMail({
    ...mail,
    attachments: [logo, ...((mail.attachments as nodemailer.SendMailOptions["attachments"]) ?? [])],
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

/** Settings lookup that never throws (SMTP emails must be best-effort). */
async function getSettingSafe(key: string): Promise<string> {
  try {
    return (await getAllSettings())[key] ?? "";
  } catch {
    return "";
  }
}

async function getBrand(): Promise<Brand> {
  const s = await getAllSettings();  const logo = s.logo || "/images/logo/logoy.jpg";
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
          <img src="cid:kimsafety-logo" alt="${esc(brand.site_name)}" style="height:52px;max-width:240px;object-fit:contain;" />
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

/**
 * Rewrites relative image src attributes (e.g. "/api/uploads/photo.jpg" from the
 * rich text editor) to absolute URLs. Email clients fetch images from the web —
 * a relative path cannot be resolved and the image is silently dropped.
 */
function absolutizeImages(html: string): string {
  return html.replace(/src\s*=\s*(["'])(.*?)\1/g, (match, quote: string, url: string) => {
    const u = url.trim();
    if (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("//") || u.startsWith("data:") || u.startsWith("cid:") || u.startsWith("blob:") || u === "") {
      return match;
    }
    return `src=${quote}${siteUrl}${u.startsWith("/") ? "" : "/"}${u}${quote}`;
  });
}

/**
 * Makes images email-client friendly: absolute URLs (handled by absolutizeImages
 * upstream) plus a width cap so wide photos don't blow out the layout in Outlook
 * and mobile clients.
 */
function styleEmailImages(html: string): string {
  return html.replace(/<img\b([^>]*)>/g, (match, attrs: string) => {
    if (/style=/i.test(attrs)) return match;
    return `<img${attrs} style="max-width:100%;height:auto;border-radius:10px;display:block;">`;
  });
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
  const items = JSON.parse(itemsJson) as { productId: string; qty: number; name?: string; price?: number }[];
  return (
    await Promise.all(
      items.map(async (i) => {
        // Emails quote the price the customer paid (stored on the order);
        // live catalog lookup is only the fallback for legacy rows.
        if (typeof i.price === "number" && i.price > 0) {
          return { name: i.name || i.productId, qty: i.qty, price: i.price };
        }
        const p = await liveGetProduct(i.productId);
        return { name: i.name || (p?.name ?? i.productId), qty: i.qty, price: p ? bulkUnitPrice(p, i.qty) : (i.price ?? 0) };
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
  await sendBrandedMail(cfg, {
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
  await sendBrandedMail(cfg, {
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

/** "You left items in your cart" recovery email. */
export async function sendAbandonedCartEmail(input: {
  to: string;
  name?: string | null;
  items: { name: string; qty: number; price: number }[];
  total: number;
}): Promise<boolean> {
  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();
  const firstName = (input.name ?? "").split(" ")[0] || "there";
  const checkoutUrl = `${siteUrl}/checkout`;
  const rows = input.items
    .map(
      (r) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;">${esc(r.name)} <span style="color:#9ca3af;">× ${r.qty}</span></td>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:bold;color:#374151;text-align:right;white-space:nowrap;">${money(r.price * r.qty)}</td>
      </tr>`
    )
    .join("");
  await sendBrandedMail(cfg, {
    from: cfg.from,
    to: input.to,
    subject: `You left ${input.items.length} item${input.items.length === 1 ? "" : "s"} in your cart — KimSafety`,
    text: `Hi ${firstName},\n\nYour cart is waiting — ${input.items.map((i) => `${i.name} x${i.qty}`).join(", ")}. Total ${money(input.total)}.\n\nComplete your order: ${checkoutUrl}\n\n— KimSafety Team`,
    html: renderShell(
      brand,
      `
      ${eyebrow("Still thinking it over?")}
      <h1 style="font-size:24px;color:${NAVY};margin:0 0 8px 0;">Hi ${esc(firstName)}, your cart is waiting</h1>
      <p style="font-size:14px;line-height:1.7;color:#374151;margin:0 0 18px 0;">You left ${input.items.length} item${input.items.length === 1 ? "" : "s"} in your cart. Stock moves fast on certified PPE — complete your order and we'll dispatch from our Nairobi warehouse.</p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 6px 0;">
        ${rows}
        <tr>
          <td style="padding:10px 0;font-size:13px;font-weight:bold;color:${NAVY};">Total (before delivery)</td>
          <td style="padding:10px 0;font-size:13px;font-weight:bold;color:${NAVY};text-align:right;white-space:nowrap;">${money(input.total)}</td>
        </tr>
      </table>
      ${btn(checkoutUrl, "Complete my order")}
      <p style="font-size:12px;color:${GRAY};margin:14px 0 0 0;text-align:center;">Pay via M-Pesa STK push or card — dispatched within 24–72 hours.</p>
      `
    ),
  });
  return true;
}

/** Back-in-stock alert for a product a shopper asked to be notified about. */
export async function sendBackInStockEmail(input: {
  to: string;
  productName: string;
  productUrl: string;
}): Promise<boolean> {
  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();
  await sendBrandedMail(cfg, {
    from: cfg.from,
    to: input.to,
    subject: `Back in stock: ${input.productName} — KimSafety`,
    text: `Good news!\n\n${input.productName} is back in stock at KimSafety.\n\nOrder now: ${input.productUrl}\n\n— KimSafety Team`,
    html: renderShell(
      brand,
      `
      ${eyebrow("Back in stock")}
      <h1 style="font-size:24px;color:${NAVY};margin:0 0 8px 0;">It's back!</h1>
      <p style="font-size:14px;line-height:1.7;color:#374151;margin:0 0 18px 0;"><strong>${esc(input.productName)}</strong> is back in stock. You asked us to tell you — grab yours before it runs out again.</p>
      ${btn(input.productUrl, "View & order")}
      `
    ),
  });
  return true;
}

export async function sendVerificationEmail(input: {
  to: string;
  name?: string | null;
  token: string;
}): Promise<boolean> {
  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();
  const firstName = (input.name ?? "").split(" ")[0] || "there";
  const verifyUrl = `${siteUrl}/verify?token=${encodeURIComponent(input.token)}`;
  await sendBrandedMail(cfg, {
    from: cfg.from,
    to: input.to,
    subject: "Verify your email — KimSafety",
    text: `Hi ${firstName},\n\nWelcome to KimSafety! Please confirm your email address to activate your account:\n\n${verifyUrl}\n\nThis link expires in 48 hours. If you didn't create an account, you can ignore this email.\n\n— KimSafety Team`,
    html: renderShell(
      brand,
      `
      ${eyebrow("Confirm your email")}
      <h1 style="font-size:24px;color:${NAVY};margin:0 0 14px 0;">Hi ${esc(firstName)}, verify your email</h1>
      <p style="font-size:14px;line-height:1.7;color:#374151;margin:0 0 18px 0;">Welcome to ${esc(brand.site_name)}! Tap the button below to confirm this email address and activate your account. The link is valid for <strong>48 hours</strong>.</p>
      ${btn(verifyUrl, "Verify my email")}
      <p style="font-size:12px;line-height:1.7;color:${GRAY};margin:16px 0 0 0;">If the button doesn't work, copy this link into your browser:<br/><a href="${verifyUrl}" style="color:${SAFETY};word-break:break-all;">${verifyUrl}</a></p>
      <p style="font-size:12px;color:${GRAY};margin:14px 0 0 0;">Didn't create an account? You can safely ignore this email.</p>
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
  await sendBrandedMail(cfg, {
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
  await sendBrandedMail(cfg, {
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
  const firstName = (name ?? "").split(" ")[0] || "there";
  await sendBrandedMail(cfg, {
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
  payment_token?: string | null;
}): Promise<boolean> {
  const cfg: SmtpConfig | null = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();

  const { to, orderId, orderTotal, pdf, name, phone, address, company, items, payment, paid, status, payment_token } = input;
  const trackUrl = payment_token
    ? `${siteUrl}/track?id=${encodeURIComponent(orderId)}&token=${encodeURIComponent(payment_token)}`
    : `${siteUrl}/account/orders`;

  const orderStatuses = ["Order Confirmed", "Processing", "Dispatched", "Delivered"];
  const statusIndex = Math.max(orderStatuses.indexOf(status), 0);
  const paymentLabel: Record<string, string> = {
    mpesa: "M-Pesa",
    card: "Card (Paystack)",
    po: "Purchase Order (30-day terms)",
  };
  const rows = await resolveItems(items);
  const till = (await getSettingSafe("mpesa_till")) || "4178866";
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

  const unpaidNote =
    paid === 1
      ? ""
      : `<p style="font-size:12px;color:${GRAY};margin:12px 0 0 0;text-align:center;">Payment: ${esc(paymentLabel[payment] ?? payment)}. If the M-Pesa prompt or card checkout fails, pay manually via <strong>M-Pesa Buy Goods · Till ${esc(till)}</strong> (KimSafety Ltd) using your order number as the reference, then send the confirmation SMS to WhatsApp <strong>+${esc(brand.whatsapp)}</strong> — we'll confirm and dispatch. Details are on the attached invoice.</p>`;

  await sendBrandedMail(cfg, {
    from: cfg.from,
    to,
    subject: `Order confirmed — ${orderId} · KES ${Math.round(orderTotal).toLocaleString("en-KE")}`,
    text: `Hi ${name},\n\nThank you for your order! Your order ${orderId} (total KES ${Math.round(orderTotal).toLocaleString("en-KE")}) has been received and is being processed.\n\nTrack it anytime at ${trackUrl}\n\nYour invoice is attached to this email.\n\n— KimSafety Team`,
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
      <p style="font-size:13px;line-height:1.7;color:#374151;margin:0 0 14px 0;text-align:center;">Track your order anytime from your <a href="${trackUrl}" style="color:${SAFETY};font-weight:bold;">order history</a> — your invoice PDF is attached to this email.</p>
      ${btn(trackUrl, "View your order")}
      ${unpaidNote}
      `
    ),
    attachments: [{ filename: `kimsafety-invoice-${orderId}.pdf`, content: pdf, contentType: "application/pdf" }],
  });
  return true;
}

/**
 * "Payment received" email sent when an order flips from unpaid to paid — the
 * M-Pesa callback, Paystack webhook/verify and the admin "Mark as paid" action
 * all call this with the stored order row. The attached PDF is rebuilt with the
 * PAID banner. Best-effort: failures are swallowed by the callers.
 */
export async function sendPaidInvoiceEmail(input: {
  id: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  company?: string | null;
  items: string;
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  payment: string;
  paid: number;
  status: string;
  created_at: string;
  mpesa_transaction_id?: string | null;
  mpesa_checkout_id?: string | null;
  paystack_reference?: string | null;
  paystack_transaction_id?: string | null;
  po_ref?: string | null;
  payment_token?: string | null;
}): Promise<boolean> {
  const cfg: SmtpConfig | null = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();

  const { id: orderId, email, name, phone, address, company, items, payment, status, payment_token } = input;
  const trackUrl = payment_token
    ? `${siteUrl}/track?id=${encodeURIComponent(orderId)}&token=${encodeURIComponent(payment_token)}`
    : `${siteUrl}/account/orders`;
  // REAL gateway transaction code only (e.g. TB17CVOCY9 for M-Pesa, Paystack transaction ID).
  // No fallback to checkout ID / initialization reference.
  const txnId =
    input.paid === 1
      ? payment === "mpesa"
        ? input.mpesa_transaction_id
        : payment === "card"
          ? input.paystack_transaction_id
          : payment === "po"
            ? input.po_ref
            : null
      : null;
  const pdf = await buildInvoicePdf({ ...input, paid: 1 });
  const receiptPdf = await buildReceiptPdf(input);

  const paymentLabel: Record<string, string> = {
    mpesa: "M-Pesa",
    card: "Card (Paystack)",
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

  await sendBrandedMail(cfg, {
    from: cfg.from,
    to: email,
    subject: `Payment received — ${orderId} · KES ${Math.round(input.total).toLocaleString("en-KE")}`,
    text: `Hi ${name},\n\nWe've received your payment of KES ${Math.round(input.total).toLocaleString("en-KE")} for order ${orderId}. Thank you!\n\nTrack it anytime at ${trackUrl}\n\nYour paid invoice and official receipt are attached to this email.\n\n— KimSafety Team`,
    html: renderShell(
      brand,
      `
      ${eyebrow("Payment received")}
      <h1 style="font-size:24px;color:${NAVY};margin:0 0 8px 0;">Payment received — thank you!</h1>
      <p style="font-size:14px;line-height:1.7;color:#374151;margin:0 0 22px 0;">We've received your payment of ${money(input.total)} for order ${orderId}. Your <strong>paid invoice</strong> and <strong>official receipt</strong> are attached below — keep both for your records.</p>
      ${summaryCard([
        { label: "Order number", value: esc(orderId) },
        { label: "Order total", value: money(input.total), highlight: true },
        { label: "Payment", value: esc(paymentLabel[payment] ?? payment) + (txnId ? ` · Ref ${esc(txnId)}` : "") },
        { label: "Status", value: "Paid ✓" },
      ])}
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
      <p style="font-size:13px;line-height:1.7;color:#374151;margin:0 0 14px 0;text-align:center;">Track your order anytime from your <a href="${trackUrl}" style="color:${SAFETY};font-weight:bold;">order history</a> — your paid invoice and receipt PDFs are attached to this email.</p>
      ${btn(trackUrl, "View your order")}
      <p style="font-size:12px;color:${GRAY};margin:12px 0 0 0;text-align:center;">Status: ${esc(status)}</p>
      `
    ),
    attachments: [
      { filename: `kimsafety-invoice-${orderId}.pdf`, content: pdf, contentType: "application/pdf" },
      { filename: `kimsafety-receipt-${orderId}.pdf`, content: receiptPdf, contentType: "application/pdf" },
    ],
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
  await sendBrandedMail(cfg, {
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
  await sendBrandedMail(cfg, {
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

export async function sendContactAlert(input: {
  to: string;
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
}): Promise<boolean> {
  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();
  const { to, name, email, phone, topic, message } = input;
  await sendBrandedMail(cfg, {
    from: cfg.from,
    to,
    subject: `New contact message — ${topic}`,
    text: `New KimSafety contact form message (${topic}) from ${name} <${email}>${phone ? ` · ${phone}` : ""}:\n\n${message}\n\nReply at ${siteUrl}/admin/contact-messages.`,
    html: renderShell(
      brand,
      `
      ${eyebrow("Staff alert · contact form")}
      <h1 style="font-size:22px;color:${NAVY};margin:0 0 14px 0;">${esc(topic)}</h1>
      ${summaryCard([
        { label: "From", value: `${esc(name)} · <a href="mailto:${esc(email)}" style="color:${NAVY};">${esc(email)}</a>${phone ? ` · ${esc(phone)}` : ""}` },
      ])}
      <p style="font-size:14px;line-height:1.7;color:#374151;margin:0 0 18px 0;white-space:pre-wrap;">${esc(message)}</p>
      ${btn(`mailto:${esc(email)}`, "Reply by email", true)}
      `
    ),
  });
  return true;
}

export async function sendNewTicketAlert(input: {
  to: string;
  ticketId: string;
  subject: string;
  customer: string;
}): Promise<boolean> {
  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();
  const { to, ticketId, subject, customer } = input;
  await sendBrandedMail(cfg, {
    from: cfg.from,
    to,
    subject: `New support ticket ${ticketId} — ${subject}`,
    text: `New KimSafety support ticket ${ticketId} from ${customer}: "${subject}". Manage it at ${siteUrl}/admin/tickets.`,
    html: renderShell(
      brand,
      `
      ${eyebrow("Staff alert · support ticket")}
      <h1 style="font-size:22px;color:${NAVY};margin:0 0 14px 0;">Ticket ${esc(ticketId)} — ${esc(subject)}</h1>
      ${summaryCard([{ label: "Customer", value: esc(customer) }])}
      ${btn(`${siteUrl}/admin/tickets`, "Open in admin")}
      `
    ),
  });
  return true;
}

export async function sendTicketReplyEmail(input: {
  to: string;
  name: string;
  ticketId: string;
  message: string;
  staffName: string;
}): Promise<boolean> {
  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();
  const { to, name, ticketId, message, staffName } = input;
  const firstName = (name ?? "").split(" ")[0] || "there";
  await sendBrandedMail(cfg, {
    from: cfg.from,
    to,
    subject: `Re: your support ticket ${ticketId} — KimSafety`,
    text: `Hi ${firstName},\n\n${staffName} replied to your support ticket ${ticketId}:\n\n${message}\n\nView the full thread at ${siteUrl}/account/tickets\n\n— KimSafety Team`,
    html: renderShell(
      brand,
      `
      ${eyebrow("Support reply")}
      <h1 style="font-size:24px;color:${NAVY};margin:0 0 8px 0;">Hi ${esc(firstName)}, we replied to your ticket</h1>
      <p style="font-size:13px;color:${GRAY};margin:0 0 18px 0;">Ticket ${esc(ticketId)} · ${esc(staffName)}</p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 20px 0;">
        <tr><td style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;padding:16px 18px;font-size:14px;line-height:1.7;color:#374151;white-space:pre-wrap;">${esc(message)}</td></tr>
      </table>
      ${btn(`${siteUrl}/account/tickets`, "View the conversation")}
      <p style="font-size:12px;color:${GRAY};margin:14px 0 0 0;text-align:center;">Questions answered within the hour during business time.</p>
      `
    ),
  });
  return true;
}

export async function sendNewReturnAlert(input: {
  to: string;
  returnId: string;
  customer: string;
  orderId: string;
  productName: string;
  reason: string;
}): Promise<boolean> {
  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();
  const { to, returnId, customer, orderId, productName, reason } = input;
  await sendBrandedMail(cfg, {
    from: cfg.from,
    to,
    subject: `New return request ${returnId}`,
    text: `New KimSafety return request ${returnId} from ${customer} (order ${orderId}): ${productName} — "${reason}". Manage it at ${siteUrl}/admin/returns.`,
    html: renderShell(
      brand,
      `
      ${eyebrow("Staff alert · return request")}
      <h1 style="font-size:22px;color:${NAVY};margin:0 0 14px 0;">Return ${esc(returnId)}</h1>
      ${summaryCard([
        { label: "Customer", value: esc(customer) },
        { label: "Order", value: esc(orderId) },
        { label: "Product", value: esc(productName) },
      ])}
      <p style="font-size:14px;line-height:1.7;color:#374151;margin:0 0 18px 0;">Reason: ${esc(reason)}</p>
      ${btn(`${siteUrl}/admin/returns`, "Open in admin")}
      `
    ),
  });
  return true;
}

export async function sendReturnStatusEmail(input: {
  to: string;
  name: string;
  returnId: string;
  status: string;
}): Promise<boolean> {
  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();
  const { to, name, returnId, status } = input;
  const firstName = (name ?? "").split(" ")[0] || "there";
  await sendBrandedMail(cfg, {
    from: cfg.from,
    to,
    subject: `Return ${returnId} is now "${status}" — KimSafety`,
    text: `Hi ${firstName},\n\nYour return request ${returnId} is now: ${status}.\n\nTrack it in your account at ${siteUrl}/account\n\n— KimSafety Team`,
    html: renderShell(
      brand,
      `
      ${eyebrow("Return update")}
      <h1 style="font-size:24px;color:${NAVY};margin:0 0 14px 0;">Your return is now "${esc(status)}"</h1>
      ${summaryCard([{ label: "Return reference", value: esc(returnId), highlight: true }])}
      <p style="font-size:13px;line-height:1.7;color:${GRAY};margin:0 0 18px 0;">Keep an eye on your account for the latest updates.</p>
      ${btn(`${siteUrl}/account`, "View your account", true)}
      `
    ),
  });
  return true;
}

export async function sendNewPOAlert(input: {
  to: string;
  poId: string;
  company: string;
  contact: string;
}): Promise<boolean> {
  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();
  const { to, poId, company, contact } = input;
  await sendBrandedMail(cfg, {
    from: cfg.from,
    to,
    subject: `New purchase order ${poId} — ${company}`,
    text: `A new guest purchase order ${poId} was uploaded by ${company} (${contact}). Manage it at ${siteUrl}/admin/purchase-orders.`,
    html: renderShell(
      brand,
      `
      ${eyebrow("Staff alert · purchase order")}
      <h1 style="font-size:22px;color:${NAVY};margin:0 0 14px 0;">Purchase order ${esc(poId)}</h1>
      ${summaryCard([
        { label: "Company", value: esc(company) },
        { label: "Contact", value: esc(contact) },
      ])}
      ${btn(`${siteUrl}/admin/purchase-orders`, "Open in admin")}
      `
    ),
  });
  return true;
}

export async function sendNewCorporateApplicationAlert(input: {
  to: string;
  company: string;
  contact: string;
}): Promise<boolean> {
  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();
  const { to, company, contact } = input;
  await sendBrandedMail(cfg, {
    from: cfg.from,
    to,
    subject: `New corporate application — ${company}`,
    text: `A new KimSafety corporate application was submitted by ${company} (${contact}). Review it at ${siteUrl}/admin/corporate.`,
    html: renderShell(
      brand,
      `
      ${eyebrow("Staff alert · corporate application")}
      <h1 style="font-size:22px;color:${NAVY};margin:0 0 14px 0;">${esc(company)}</h1>
      ${summaryCard([{ label: "Contact", value: esc(contact) }])}
      ${btn(`${siteUrl}/admin/corporate`, "Review application")}
      `
    ),
  });
  return true;
}

export async function sendCorporateApplicationConfirmation(input: {
  to: string;
  name: string;
  company: string;
}): Promise<boolean> {
  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();
  const { to, name, company } = input;
  const firstName = (name ?? "").split(" ")[0] || "there";
  await sendBrandedMail(cfg, {
    from: cfg.from,
    to,
    subject: `We received your ${company} corporate application — KimSafety`,
    text: `Hi ${firstName},\n\nThank you — we received the corporate account application for ${company}. Our team will review it within 1-2 business days and email you the outcome.\n\n— KimSafety Team`,
    html: renderShell(
      brand,
      `
      ${eyebrow("Application received")}
      <h1 style="font-size:24px;color:${NAVY};margin:0 0 14px 0;">Application received — ${esc(company)}</h1>
      <p style="font-size:14px;line-height:1.7;color:#374151;margin:0 0 18px 0;">Thank you for applying for a corporate account. Our team reviews every application within <strong>1-2 business days</strong> — you'll hear from us at this email address.</p>
      <p style="font-size:13px;line-height:1.7;color:${GRAY};margin:0;">Questions? WhatsApp us on ${esc(brand.phone)}</p>
      `
    ),
  });
  return true;
}

export async function sendOrderStatusEmail(input: {
  to: string;
  name: string;
  orderId: string;
  status: string;
  orderTotal: number;
}): Promise<boolean> {
  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();
  const { to, name, orderId, status, orderTotal } = input;
  const firstName = (name ?? "").split(" ")[0] || "there";
  await sendBrandedMail(cfg, {
    from: cfg.from,
    to,
    subject: `Your order ${orderId} is now "${status}" — KimSafety`,
    text: `Hi ${firstName},\n\nYour order ${orderId} (KES ${Math.round(orderTotal).toLocaleString("en-KE")}) is now: ${status}.\n\nTrack it at ${siteUrl}/account/orders\n\n— KimSafety Team`,
    html: renderShell(
      brand,
      `
      ${eyebrow("Order update")}
      <h1 style="font-size:24px;color:${NAVY};margin:0 0 14px 0;">Your order is now "${esc(status)}"</h1>
      ${summaryCard([
        { label: "Order number", value: esc(orderId) },
        { label: "Order total", value: money(orderTotal) },
        { label: "Status", value: esc(status), highlight: true },
      ])}
      ${btn(`${siteUrl}/account/orders`, "Track your order")}
      `
    ),
  });
  return true;
}

export async function sendDeliveryNoteEmail(input: {
  to: string;
  name: string;
  orderId: string;
  pdf: Buffer;
}): Promise<boolean> {
  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();
  const { to, name, orderId, pdf } = input;
  const firstName = (name ?? "").split(" ")[0] || "there";
  await sendBrandedMail(cfg, {
    from: cfg.from,
    to,
    subject: `Your order ${orderId} has been delivered — signed delivery note attached — KimSafety`,
    text: `Hi ${firstName},\n\nYour order ${orderId} has been marked as Delivered. The signed delivery note is attached to this email.\n\nThank you for choosing KimSafety!\n\n— KimSafety Team`,
    html: renderShell(
      brand,
      `
      ${eyebrow("Delivered")}
      <h1 style="font-size:24px;color:${NAVY};margin:0 0 14px 0;">Your order is delivered</h1>
      <p style="font-size:14px;line-height:1.7;color:#374151;margin:0 0 18px 0;">Hi ${esc(firstName)}, your order <strong>${esc(orderId)}</strong> has been marked as <strong>Delivered</strong>. The signed delivery note confirming receipt is attached to this email.</p>
      ${summaryCard([{ label: "Order number", value: esc(orderId), highlight: true }])}
      <p style="font-size:13px;line-height:1.7;color:${GRAY};margin:0 0 18px 0;">Keep this document for your records. Questions? Reply to this email or reach us on WhatsApp ${esc(brand.phone)}.</p>
      ${btn(`${siteUrl}/account/orders`, "View your orders")}
      `
    ),
    attachments: [{ filename: `kimsafety-delivery-note-${orderId}.pdf`, content: pdf, contentType: "application/pdf" }],
  });
  return true;
}

export async function sendKraInvoiceEmail(input: {
  to: string;
  name: string;
  orderId: string;
  pdf: Buffer;
}): Promise<boolean> {
  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();
  const { to, name, orderId, pdf } = input;
  const firstName = (name ?? "").split(" ")[0] || "there";
  await sendBrandedMail(cfg, {
    from: cfg.from,
    to,
    subject: `KRA invoice for order ${orderId} — KimSafety`,
    text: `Hi ${firstName},\n\nYour KRA-compliant invoice for order ${orderId} is attached to this email. It carries our official stamp.\n\n— KimSafety Team`,
    html: renderShell(
      brand,
      `
      ${eyebrow("KRA invoice")}
      <h1 style="font-size:24px;color:${NAVY};margin:0 0 14px 0;">Your KRA invoice</h1>
      <p style="font-size:14px;line-height:1.7;color:#374151;margin:0 0 18px 0;">Hi ${esc(firstName)}, your stamped KRA invoice for order <strong>${esc(orderId)}</strong> is attached. It is ready for your accounts / KRA filing.</p>
      ${summaryCard([{ label: "Order number", value: esc(orderId), highlight: true }])}
      ${btn(`${siteUrl}/account/orders`, "View your orders")}
      `
    ),
    attachments: [{ filename: `kimsafety-kra-invoice-${orderId}.pdf`, content: pdf, contentType: "application/pdf" }],
  });
  return true;
}

export async function sendQuoteStatusEmail(input: {
  to: string;
  name: string;
  quoteId: string;
  status: string;
}): Promise<boolean> {
  const cfg = await getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();
  const { to, name, quoteId, status } = input;
  const firstName = (name ?? "").split(" ")[0] || "there";
  await sendBrandedMail(cfg, {
    from: cfg.from,
    to,
    subject: `Your quote ${quoteId} is now "${status}" — KimSafety`,
    text: `Hi ${firstName},\n\nYour quotation request ${quoteId} is now: ${status}.\n\n— KimSafety Team`,
    html: renderShell(
      brand,
      `
      ${eyebrow("Quote update")}
      <h1 style="font-size:24px;color:${NAVY};margin:0 0 14px 0;">Your quote is now "${esc(status)}"</h1>
      ${summaryCard([{ label: "Quote reference", value: esc(quoteId), highlight: true }])}
      ${btn(`${siteUrl}/account/quotes`, "View your quotes", true)}
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
    ? styleEmailImages(absolutizeImages(input.body))
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

export async function sendDailyOrdersEmail(input: {
  to: string;
  dateLabel: string;
  orderCount: number;
  paidCount: number;
  revenue: number;
  xlsx: Buffer;
}): Promise<boolean> {
  const cfg = getSmtpConfig();
  if (!cfg || !isSmtpConfigured(cfg)) return false;
  const brand = await getBrand();
  const { to, dateLabel, orderCount, paidCount, revenue, xlsx } = input;
  const pending = orderCount - paidCount;
  await sendBrandedMail(cfg, {
    from: cfg.from,
    to,
    subject: `Daily orders — ${dateLabel} · ${orderCount} order${orderCount === 1 ? "" : "s"} · ${money(revenue)}`,
    text: `KimSafety daily order summary for ${dateLabel}:\n\nOrders: ${orderCount}\nPaid: ${paidCount}\nUnpaid: ${pending}\nRevenue: ${money(revenue)}\n\nThe Excel spreadsheet with every order is attached.\n\n— KimSafety`,
    html: renderShell(
      brand,
      `
      ${eyebrow("Daily order summary")}
      <h1 style="font-size:24px;color:${NAVY};margin:0 0 14px 0;">Orders for ${esc(dateLabel)}</h1>
      <p style="font-size:14px;line-height:1.7;color:#374151;margin:0 0 18px 0;">Here's how the store performed today. The full breakdown is attached as an Excel spreadsheet.</p>
      ${summaryCard([
        { label: "Orders placed", value: String(orderCount), highlight: true },
        { label: "Paid", value: String(paidCount) },
        { label: "Unpaid / pending", value: String(pending) },
        { label: "Total order value", value: money(revenue) },
      ])}
      <p style="font-size:13px;line-height:1.7;color:#374151;margin:0 0 14px 0;">Open the attached <strong>kimsafety-orders-${esc(dateLabel)}.xlsx</strong> to see each order — customer, items, payment status and totals.</p>
      ${btn(`${siteUrl}/admin/orders`, "Open orders in admin")}
      `
    ),
    attachments: [{ filename: `kimsafety-orders-${dateLabel}.xlsx`, content: xlsx, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }],
  });
  return true;
}

export async function sendNewsletterBroadcast(input: {
  subject: string;
  html: string;
  to: { email: string; name: string | null; token: string }[];
  cfg: SmtpConfig;
}): Promise<{ sent: number; failed: number }> {
  const { subject, html, to, cfg } = input;

  let sent = 0;
  let failed = 0;
  const batchSize = 50;
  for (let i = 0; i < to.length; i += batchSize) {
    const batch = to.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (recipient) => {
        await sendBrandedMail(cfg, {
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
