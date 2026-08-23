import { NextResponse } from "next/server";
import { createQuote, quotesForUser } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { liveGetProduct } from "@/lib/catalog";
import { bulkUnitPrice } from "@/lib/utils";
import { sendQuoteConfirmationEmail, sendNewQuoteAlert } from "@/lib/mailer";
import { getSetting } from "@/lib/db";
import { rateLimit, tooMany } from "@/lib/rate-limit";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const quotes = (await quotesForUser(user.id)).map((q) => ({ ...q, items: JSON.parse(q.items) }));
  return NextResponse.json({ quotes });
}

type QuoteItem = { productId: string; qty: number; price?: number };

export async function POST(req: Request) {
  const rl = rateLimit(req, "quotes", 5, 600000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  let body: { name?: string; company?: string; email?: string; phone?: string; items?: unknown[]; attachment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.name || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Missing required quote details" }, { status: 400 });
  }

const items = body.items as QuoteItem[];
  const found = await Promise.all(items.map((i) => liveGetProduct(i.productId)));
  // Lines that are not in the live catalog (e.g. the free-text "quote-request"
  // line from the quote form) are kept as custom lines — the requester's
  // description and price are preserved so a quotation can still be built.
  let total = 0;
  const normalized = items.map((i, idx) => {
    const qty = typeof i.qty === "number" && i.qty > 0 ? Math.floor(i.qty) : 1;
    const p = found[idx];
    const price = p ? bulkUnitPrice(p, qty) : (i.price ?? 0);
    total += price * qty;
    return { productId: i.productId, name: (i as { name?: string }).name ?? p?.name ?? i.productId, qty, price };
  });

  const user = await getSessionUser();
  const quote = await createQuote({
    user_id: user?.id ?? null,
    name: body.name,
    company: body.company ?? null,
    email: body.email ?? null,
    phone: body.phone ?? null,
    items: JSON.stringify(normalized),
    total: Math.round(total),
    attachment: body.attachment ?? null,
  });

  // Best-effort confirmation email to the requester — AWAITED so the SMTP
  // send completes before the serverless function returns (un-awaited sends
  // are frozen mid-flight on Vercel).
  if (quote.email) {
    try {
      await sendQuoteConfirmationEmail({
        to: quote.email,
        name: quote.name,
        quoteId: quote.id,
        total: quote.total,
      });
    } catch (err) {
      console.error("[quotes] confirmation email failed:", err);
    }
  }

  // Notify staff of the new quote request (awaited for the same reason).
  try {
    const staffEmail = await getSetting("email");
    if (staffEmail) {
      await sendNewQuoteAlert({
        to: staffEmail,
        quoteId: quote.id,
        total: quote.total,
        customer: quote.name,
        company: quote.company,
      });
    }
  } catch (err) {
    console.error("[quotes] staff alert email failed:", err);
  }

  return NextResponse.json({ quote: { ...quote, items: JSON.parse(quote.items) } }, { status: 201 });
}
