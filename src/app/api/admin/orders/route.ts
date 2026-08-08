import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { createNotification, getOrderById, listOrders, setOrderStatus } from "@/lib/db";
import { liveGetProduct } from "@/lib/catalog";
import { bulkUnitPrice } from "@/lib/utils";

const VALID = ["Processing", "In transit", "Delivered", "Cancelled"];

async function withItems(o: Awaited<ReturnType<typeof listOrders>>[number]) {
  const items = JSON.parse(o.items) as { productId: string; qty: number; name?: string; price?: number }[];
  return {
    ...o,
    items: await Promise.all(
      items.map(async (i) => {
        const p = await liveGetProduct(i.productId);
        return {
          ...i,
          name: p?.name ?? i.name ?? i.productId,
          sku: p?.sku ?? i.productId,
          price: p ? bulkUnitPrice(p, i.qty) : (i.price ?? 0),
        };
      })
    ),
  };
}

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    const order = await getOrderById(id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ order: withItems(order) });
  }

  const orders = await Promise.all((await listOrders()).map(withItems));
  return NextResponse.json({ orders });
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
    return NextResponse.json({ error: "Invalid order id or status" }, { status: 400 });
  }
  const order = await getOrderById(body.id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  await setOrderStatus(body.id, body.status as string);
  if (order.user_id) {
    await createNotification({
      user_id: order.user_id,
      type: "order",
      title: `Order ${order.id} is now ${body.status}`,
      message: `Your order status changed to ${body.status}.`,
      link: "/account/orders",
    });
  }
  return NextResponse.json({ ok: true });
}
