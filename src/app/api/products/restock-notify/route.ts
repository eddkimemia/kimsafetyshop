import { NextResponse } from "next/server";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { addRestockRequest } from "@/lib/db";

export const dynamic = "force-dynamic";

/** "Notify me when back in stock" — one request per product+email. */
export async function POST(req: Request) {
  const rl = rateLimit(req, "restock-notify", 5, 3600000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  let body: { productId?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const productId = body.productId?.trim();
  const email = body.email?.trim().toLowerCase();
  if (!productId || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  try {
    await addRestockRequest(productId, email);
  } catch (err) {
    console.error("[restock-notify] failed:", (err as Error).message);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
  return NextResponse.json({ ok: true });
}
