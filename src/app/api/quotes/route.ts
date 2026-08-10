import { NextResponse } from "next/server";
import { createQuote, quotesForUser } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { liveGetProduct } from "@/lib/catalog";
import { bulkUnitPrice } from "@/lib/utils";
import { sendQuoteConfirmationEmail, sendNewQuoteAlert } from "@/lib/mailer";
import { getSetting } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const quotes = (await quotesForUser(user.id)).map((q) => ({ ...q, items: JSON.parse(q.items) }));
  return NextResponse.json({ quotes });
}

type QuoteItem = { productId: string; qty: number; price?: number };

export async function POST(req: Request) {
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
  const known = found.every(Boolean);
  if (!known) {
    return NextResponse.json({ error: "One or more products could not be found" }, { status: 400 });
  }
  let total = 0;
  for (const i of items) {
    const qty = typeof i.qty === "number" && i.qty > 0 ? Math.floor(i.qty) : 0;
    const p = await liveGetProduct(i.productId);
    total += p ? bulkUnitPrice(p, qty) * qty : 0;
  }

  const user = await getSessionUser();
  const quote = await createQuote({
    user_id: user?.id ?? null,
    name: body.name,
    company: body.company ?? null,
    email: body.email ?? null,
    phone: body.phone ?? null,
    items: JSON.stringify(items),
    total: Math.round(total),
    attachment: body.attachment ?? null,
  });

  // Best-effort confirmation email to the requester.
  if (quote.email) {
    sendQuoteConfirmationEmail({
      to: quote.email,
      name: quote.name,
      quoteId: quote.id,
      total: quote.total,
    }).catch((err) => console.error("[quotes] confirmation email failed:", err));
  }

  // Notify staff of the new quote request.
  getSetting("email")
    .then((email) => {
      if (!email) return;
      sendNewQuoteAlert({
        to: email,
        quoteId: quote.id,
        total: quote.total,
        customer: quote.name,
        company: quote.company,
      }).catch(() => {});
    })
    .catch(() => {});

  return NextResponse.json({ quote: { ...quote, items: JSON.parse(quote.items) } }, { status: 201 });
}
