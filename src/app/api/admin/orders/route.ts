import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { createNotification, getOrderById, listOrders, setOrderStatus } from "@/lib/db";

const VALID = ["Processing", "In transit", "Delivered", "Cancelled"];

function withItems(o: ReturnType<typeof listOrders>[number]) {
  return { ...o, items: JSON.parse(o.items) };
}

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    const order = getOrderById(id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ order: withItems(order) });
  }

  const orders = listOrders().map(withItems);
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
  const order = getOrderById(body.id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  setOrderStatus(body.id, body.status as string);
  if (order.user_id) {
    createNotification({
      user_id: order.user_id,
      type: "order",
      title: `Order ${order.id} is now ${body.status}`,
      message: `Your order status changed to ${body.status}.`,
      link: "/account?tab=orders",
    });
  }
  return NextResponse.json({ ok: true });
}
