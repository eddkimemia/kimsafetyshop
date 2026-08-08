import { NextResponse } from "next/server";
import { createOrder, createNotification, getOrderById, ordersForUser } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { liveGetProduct } from "@/lib/catalog";
import { bulkUnitPrice, formatKES } from "@/lib/utils";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const enrich = async (o: Awaited<ReturnType<typeof ordersForUser>>[number]) => ({
    ...o,
    items: await Promise.all(JSON.parse(o.items).map(async (i: { productId: string; qty: number }) => {
      const p = await liveGetProduct(i.productId);
      return {
        ...i,
        name: p?.name ?? i.productId,
        sku: p?.sku,
        price: p ? bulkUnitPrice(p, i.qty) : undefined,
        datasheetIndex: p?.downloads?.findIndex((d) => /datasheet/i.test(d.name || "")),
      };
    })),
  });
  if (id) {
    const order = await getOrderById(id);
    if (!order || order.user_id !== user.id) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ order: await enrich(order) });
  }
  const orders = await Promise.all((await ordersForUser(user.id)).map(enrich));
  return NextResponse.json({ orders });
}

type OrderItem = { productId: string; qty: number; price?: number };

async function computeTotals(items: OrderItem[]) {
  let subtotal = 0;
  let discount = 0;
  for (const item of items) {
    const qty = typeof item.qty === "number" && item.qty > 0 ? Math.floor(item.qty) : 0;
    if (qty === 0) continue;
    const p = await liveGetProduct(item.productId);
    if (!p) continue;
    const unit = bulkUnitPrice(p, qty);
    const old = p.oldPrice != null && p.oldPrice > p.price ? p.oldPrice : p.price;
    subtotal += unit * qty;
    discount += (old - unit) * qty;
  }
  const shipping = items.length === 0 || subtotal <= 0 ? 0 : subtotal >= 10000 ? 0 : 350;
  discount = Math.max(0, Math.round(discount));
  return { subtotal: Math.round(subtotal), discount, shipping, total: Math.round(subtotal) + shipping };
}

export async function POST(req: Request) {
  let body: { name?: string; email?: string; phone?: string; address?: string; items?: unknown[]; total?: number; payment?: string; po_ref?: string; company?: string; po_file?: string };
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
  const found = await Promise.all(items.map((i) => liveGetProduct(i.productId)));
  if (found.some((p) => !p)) {
    return NextResponse.json({ error: "One or more products could not be found" }, { status: 400 });
  }
  const { subtotal, discount, shipping, total } = await computeTotals(items);

  const user = await getSessionUser();
  const order = await createOrder({
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
    po_ref: body.po_ref,
    company: body.company,
    po_file: body.po_file,
  });

  if (user) {
    await createNotification({
      user_id: user.id,
      type: "order",
      title: `Order ${order.id} confirmed`,
      message: `Your order of ${formatKES(total)} is being prepared.`,
      link: "/account/orders",
    });
  }

  return NextResponse.json({ order: { ...order, items: JSON.parse(order.items) } }, { status: 201 });
}
