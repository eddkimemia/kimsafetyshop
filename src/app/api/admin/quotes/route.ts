import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { createQuote, createNotification, getQuoteById, getUserById, listQuotes, setQuoteStatus } from "@/lib/db";

const VALID = ["Open", "Pending", "Sent", "Accepted", "Expired", "Declined"];

type QuoteItem = { productId: string; name: string; qty: number; price: number };

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    const quote = getQuoteById(id);
    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    const result = { ...quote, items: JSON.parse(quote.items) } as Record<string, unknown>;
    if (quote.user_id && (!quote.email || !quote.phone)) {
      const account = getUserById(quote.user_id);
      if (account) {
        result.email = quote.email ?? account.email;
        result.phone = quote.phone ?? account.phone ?? null;
      }
    }
    return NextResponse.json({ quote: result });
  }

  const quotes = listQuotes().map((q) => ({ ...q, items: JSON.parse(q.items) }));
  return NextResponse.json({ quotes });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: {
    name?: string;
    company?: string;
    email?: string;
    phone?: string;
    items?: QuoteItem[];
    notes?: string;
    validDays?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = body.name?.trim();
  const items = (body.items ?? [])
    .filter((i) => i.name?.trim() && i.qty > 0)
    .map((i) => ({ productId: i.productId ?? "custom", name: i.name.trim(), qty: i.qty, price: Math.max(0, i.price ?? 0) }));

  if (!name) {
    return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
  }
  if (items.length === 0) {
    return NextResponse.json({ error: "Add at least one item with a name and quantity" }, { status: 400 });
  }

  const total = items.reduce((n, i) => n + i.price * i.qty, 0);
  const validDays = Math.min(Math.max(body.validDays ?? 14, 1), 90);
  const validUntil = new Date(Date.now() + validDays * 86400000).toISOString();

  const quote = createQuote({
    name,
    company: body.company?.trim() || null,
    email: body.email?.trim() || null,
    phone: body.phone?.trim() || null,
    items: JSON.stringify(items),
    total,
    notes: body.notes?.trim() || null,
    valid_until: validUntil,
  });

  return NextResponse.json(
    { quote: { ...quote, items: JSON.parse(quote.items) } },
    { status: 201 }
  );
}

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  let body: { id?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.id || !VALID.includes(body.status ?? "")) {
    return NextResponse.json({ error: "Invalid quote id or status" }, { status: 400 });
  }
  const quote = getQuoteById(body.id);
  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  setQuoteStatus(body.id, body.status as string);
  if (quote.user_id) {
    createNotification({
      user_id: quote.user_id,
      type: "quote",
      title: `Quote ${quote.id} is now ${body.status}`,
      message: `Your quotation status changed to ${body.status}.`,
      link: "/account?tab=quotes",
    });
  }
  return NextResponse.json({ ok: true });
}
