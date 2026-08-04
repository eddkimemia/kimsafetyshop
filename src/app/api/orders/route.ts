import { NextResponse } from "next/server";
import { createOrder, ordersForUser } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { liveGetProduct } from "@/lib/catalog";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const orders = ordersForUser(user.id).map((o) => ({
    ...o,
    items: JSON.parse(o.items),
  }));
  return NextResponse.json({ orders });
}

type OrderItem = { productId: string; qty: number; price?: number };

function computeTotals(items: OrderItem[]) {
  let subtotal = 0;
  let discount = 0;
  for (const item of items) {
    const qty = typeof item.qty === "number" && item.qty > 0 ? Math.floor(item.qty) : 0;
    if (qty === 0) continue;
    const p = liveGetProduct(item.productId);
    if (!p) continue;
    const unit = p.price;
    const old = p.oldPrice != null && p.oldPrice > p.price ? p.oldPrice : p.price;
    subtotal += unit * qty;
    discount += (old - unit) * qty;
  }
  const shipping = items.length === 0 || subtotal <= 0 ? 0 : subtotal >= 10000 ? 0 : 350;
  discount = Math.max(0, Math.round(discount));
  return { subtotal: Math.round(subtotal), discount, shipping, total: Math.round(subtotal) + shipping };
}

export async function POST(req: Request) {
  let body: { name?: string; email?: string; phone?: string; address?: string; items?: unknown[]; total?: number; payment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.name || !body.email || !body.phone || !body.address || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Missing required order details" }, { status: 400 });
  }

  // Re-derive every total from the live (admin-overridden) catalog so the
  // discount is always counted correctly and the stored total can't be spoofed.
  const items = body.items as OrderItem[];
  const known = items.every((i) => liveGetProduct(i.productId));
  if (!known) {
    return NextResponse.json({ error: "One or more products could not be found" }, { status: 400 });
  }
  const { subtotal, discount, shipping, total } = computeTotals(items);

  const user = await getSessionUser();
  const order = createOrder({
    user_id: user?.id ?? null,
    name: body.name,
    email: body.email,
    phone: body.phone,
    address: body.address,
    items: JSON.stringify(items),
    total,
    subtotal,
    discount,
    shipping,
    payment: body.payment ?? "mpesa",
  });

  return NextResponse.json({ order: { ...order, items: JSON.parse(order.items) } }, { status: 201 });
}
