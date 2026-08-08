import { NextResponse } from "next/server";
import { createReturn, getOrderById, listReturnsForUser } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { liveGetProduct } from "@/lib/catalog";

type OrderItem = { productId: string; name?: string; qty: number };

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  return NextResponse.json({ returns: await listReturnsForUser(user.id) });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { order_id?: string; product_name?: string; qty?: number; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const order = body.order_id ? await getOrderById(body.order_id) : undefined;
  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (!body.product_name || !body.reason?.trim() || !body.qty || body.qty < 1) {
    return NextResponse.json({ error: "Product, quantity and reason are required" }, { status: 400 });
  }

  const items = JSON.parse(order.items) as OrderItem[];
  const matched = items.find((i) => (i.name ?? i.productId) === body.product_name);
  if (!matched) {
    return NextResponse.json({ error: "Product not in this order" }, { status: 400 });
  }
  if (body.qty > matched.qty) {
    return NextResponse.json({ error: `Only ${matched.qty} of this item was ordered` }, { status: 400 });
  }

  const ret = await createReturn({
    user_id: user.id,
    order_id: order.id,
    product_name: matched.name ?? (await liveGetProduct(matched.productId))?.name ?? matched.productId,
    qty: body.qty,
    reason: body.reason.trim(),
  });
  return NextResponse.json({ return: ret }, { status: 201 });
}
