import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import {
  createNotification,
  getOrderById,
  listOrders,
  setMpesaTransaction,
  setOrderPaid,
  setOrderStatus,
  setPaystackReference,
} from "@/lib/db";
import { liveGetProduct } from "@/lib/catalog";
import { productImages } from "@/lib/data/product-images";
import { bulkUnitPrice } from "@/lib/utils";
import { mpesaFetchReceipt } from "@/lib/payments/mpesa";
import { sendOrderStatusEmail, sendPaidInvoiceEmail } from "@/lib/mailer";

const VALID = ["Processing", "In transit", "Delivered", "Cancelled"];

async function withItems(o: Awaited<ReturnType<typeof listOrders>>[number]) {
  const items = JSON.parse(o.items) as { productId: string; qty: number; name?: string; price?: number }[];
  return {
    ...o,
    // Admin views show what the customer paid: the stored per-item price wins,
    // live lookup only fills gaps for legacy orders saved without prices.
    items: await Promise.all(
      items.map(async (i) => {
        const p = await liveGetProduct(i.productId);
        const price = typeof i.price === "number" && i.price > 0 ? i.price : p ? bulkUnitPrice(p, i.qty) : (i.price ?? 0);
        return {
          ...i,
          name: i.name || ((p?.name ?? i.name) ?? i.productId),
          sku: p?.sku ?? i.productId,
          price,
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
  let body: { id?: string; status?: string; paid?: number; txn_ref?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  const order = await getOrderById(body.id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Reference-only update (add/edit the transaction ID on an order without
  // changing its paid state).
  if (body.paid === undefined) {
    const ref = body.txn_ref?.trim();
    if (!ref) return NextResponse.json({ error: "Missing transaction reference" }, { status: 400 });
    if (order.payment === "mpesa") await setMpesaTransaction(body.id, ref);
    else if (order.payment === "card") await setPaystackReference(body.id, ref);
    else return NextResponse.json({ error: "This payment method does not take a transaction reference" }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (body.paid !== undefined) {
    // Record the payment reference BEFORE flagging paid and re-fetching —
    // the paid invoice PDF and receipt must show it.
    const ref = body.txn_ref?.trim();
    let effectiveRef = ref || null;
    if (!effectiveRef && order.payment === "mpesa") {
      // Admin left the reference blank: pull the transaction code straight
      // from Daraja (Transaction Status API, keyed by CheckoutRequestID) so a
      // paid M-Pesa order NEVER ends up with a blank transaction ID.
      if (order.mpesa_transaction_id) {
        effectiveRef = order.mpesa_transaction_id;
      } else if (order.mpesa_checkout_id) {
        try {
          const receipt = await mpesaFetchReceipt(order.mpesa_checkout_id);
          if (receipt) {
            await setMpesaTransaction(body.id, receipt);
            effectiveRef = receipt;
          }
        } catch (err) {
          console.error(`[admin] mpesa receipt lookup failed for ${order.id}:`, (err as Error).message);
        }
      }
      if (!effectiveRef) {
        return NextResponse.json(
          { error: "M-Pesa transaction code could not be fetched automatically. Enter it from the customer's confirmation SMS." },
          { status: 400 }
        );
      }
    }
    if (effectiveRef) {
      if (order.payment === "mpesa") await setMpesaTransaction(body.id, effectiveRef);
      else if (order.payment === "card") await setPaystackReference(body.id, effectiveRef);
    }
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
