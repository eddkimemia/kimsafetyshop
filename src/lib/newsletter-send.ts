import { createNewsletterCampaign, listNewsletterSubscribers } from "@/lib/db";
import { getSmtpConfig, isSmtpConfigured, newsletterHtml, sendNewsletterBroadcast } from "@/lib/mailer";
import { sanitizePostHtml } from "@/lib/blog";
import { siteUrl } from "@/lib/site";

export type NewsletterContentItem = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover?: string | null;
  kind: "blog" | "knowledge";
};

function cta(href: string, label: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0 0 0;">
    <tr><td align="center">
      <a href="${href}" style="display:inline-block;background:#F57C00;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:13px 28px;border-radius:10px;">${label}</a>
    </td></tr>
  </table>`;
}

function preview(p: string): string {
  return `<p style="font-size:14px;font-weight:bold;line-height:1.7;color:#0F2847;margin:0 0 16px 0;">${p}</p>`;
}

/**
 * Sends a published blog post or knowledge guide to all active subscribers.
 * Best-effort: never throws — callers fire it without awaiting so a failed
 * send never blocks the publish.
 */
export async function sendContentNewsletter(item: NewsletterContentItem): Promise<void> {
  try {
    const cfg = await getSmtpConfig();
    if (!cfg || !isSmtpConfigured(cfg)) return;
    const subscribers = await listNewsletterSubscribers(true);
    const to = subscribers
      .filter((s) => s.unsubscribe_token)
      .map((s) => ({ email: s.email, name: s.name, token: s.unsubscribe_token! }));
    if (to.length === 0) return;

    const content = sanitizePostHtml(item.content);
    const cover =
      item.cover
        ? `<p style="margin:0 0 18px 0;"><img src="${item.cover}" alt="${item.title}" style="max-width:100%;height:auto;border-radius:12px;display:block;width:100%;" /></p>`
        : "";
    const readMore = cta(`${siteUrl}/${item.kind === "blog" ? "blog" : "knowledge"}/${item.slug}`, item.kind === "blog" ? "Read the full article" : "Read the full guide");
    const body = `${cover}${item.excerpt ? preview(item.excerpt) : ""}${content}${readMore}`;

    const subject = item.kind === "blog" ? `New on the blog: ${item.title}` : `New knowledge guide: ${item.title}`;
    const html = await newsletterHtml({ title: item.title, body });

    const { sent, failed } = await sendNewsletterBroadcast({ subject, html, to, cfg });
    await createNewsletterCampaign({
      subject,
      body: html,
      source: item.kind,
      source_slug: item.slug,
      total: to.length,
      sent,
      failed,
    });
  } catch (err) {
    console.error(`[newsletter] auto-send for ${item.kind}/${item.slug} failed:`, err);
  }
}

/** Records a manual broadcast from the admin compose screen. */
export async function recordManualNewsletter(input: {
  subject: string;
  body: string;
  total: number;
  sent: number;
  failed: number;
}): Promise<void> {
  try {
    await createNewsletterCampaign({ ...input, source: "manual" });
  } catch (err) {
    console.error("[newsletter] failed to record campaign:", err);
  }
}
