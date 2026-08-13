import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { createNotification, getOrderById, listOrders, setOrderPaid, setOrderStatus } from "@/lib/db";
import { liveGetProduct } from "@/lib/catalog";
import { productImages } from "@/lib/data/product-images";
import { bulkUnitPrice } from "@/lib/utils";
import { sendOrderStatusEmail, sendPaidInvoiceEmail } from "@/lib/mailer";

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
          image: p?.image ?? (p?.sku ? productImages[p.sku] : undefined) ?? null,
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
    return NextResponse.json({ order: await withItems(order) });
  }

  const orders = await Promise.all((await listOrders()).map(withItems));
  return NextResponse.json({ orders });
}

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  let body: { id?: string; status?: string; paid?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  const order = await getOrderById(body.id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (body.paid !== undefined) {
    await setOrderPaid(body.id, body.paid ? 1 : 0);
    if (order.paid !== 1 && body.paid) {
      // Only email on the unpaid → paid transition (re-marking a paid order
      // must not spam the customer with another invoice). Re-fetch the fresh
      // row (txn reference) and AWAIT the send — on Vercel serverless the
      // event loop freezes once this handler returns, so a fire-and-forget
      // SMTP send never completes.
      const fresh = (await getOrderById(body.id)) ?? order;
      try {
        await sendPaidInvoiceEmail(fresh);
      } catch (err) {
        console.error(`[admin] paid invoice email failed for ${order.id}:`, (err as Error).message);
      }
    }
    if (order.user_id && body.paid) {
      await createNotification({
        user_id: order.user_id,
        type: "order",
        title: `Payment confirmed for ${order.id}`,
        message: `We received your payment of ${order.total} — thank you!`,
        link: "/account/orders",
      });
    }
    return NextResponse.json({ ok: true });
  }

  if (!VALID.includes(body.status ?? "")) {
    return NextResponse.json({ error: "Invalid order id or status" }, { status: 400 });
  }
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
  // Email the customer the status change — awaited so the SMTP send completes
  // before the serverless function returns.
  try {
    await sendOrderStatusEmail({
      to: order.email,
      name: order.name,
      orderId: order.id,
      status: body.status as string,
      orderTotal: order.total,
    });
  } catch (err) {
    console.error(`[admin] status email failed for ${order.id}:`, (err as Error).message);
  }
  return NextResponse.json({ ok: true });
}
