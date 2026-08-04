import { NextResponse } from "next/server";
import { createQuote, quotesForUser } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const quotes = quotesForUser(user.id).map((q) => ({ ...q, items: JSON.parse(q.items) }));
  return NextResponse.json({ quotes });
}

export async function POST(req: Request) {
  let body: { name?: string; company?: string; email?: string; phone?: string; items?: unknown[]; total?: number; attachment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.name || !Array.isArray(body.items) || body.items.length === 0 || typeof body.total !== "number") {
    return NextResponse.json({ error: "Missing required quote details" }, { status: 400 });
  }

  const user = await getSessionUser();
  const quote = createQuote({
    user_id: user?.id ?? null,
    name: body.name,
    company: body.company ?? null,
    email: body.email ?? null,
    phone: body.phone ?? null,
    items: JSON.stringify(body.items),
    total: body.total,
    attachment: body.attachment ?? null,
  });

  return NextResponse.json({ quote: { ...quote, items: JSON.parse(quote.items) } }, { status: 201 });
}
