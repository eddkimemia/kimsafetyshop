import { NextResponse } from "next/server";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { upsertAbandonedCart } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Abandoned-cart tracking. The checkout screen posts the contact details +
 * cart snapshot when the shopper completes step 1, and an empty items array
 * when an order is placed (or the cart is cleared). Keyed by email — one row
 * per shopper, overwritten as the cart changes.
 */
export async function POST(req: Request) {
  const rl = rateLimit(req, "cart-track", 20, 600000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  let body: { email?: string; name?: string; phone?: string; items?: unknown[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (body.items && !Array.isArray(body.items)) {
    return NextResponse.json({ error: "Invalid items" }, { status: 400 });
  }

  try {
    await upsertAbandonedCart({
      email,
      name: body.name?.trim() || undefined,
      phone: body.phone?.trim() || undefined,
      items: Array.isArray(body.items) ? body.items.slice(0, 100) : [],
    });
  } catch (err) {
    console.error("[cart-track] failed:", (err as Error).message);
    return NextResponse.json({ ok: false }, { status: 200 }); // never block checkout UX
  }
  return NextResponse.json({ ok: true });
}
