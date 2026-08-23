import { NextResponse } from "next/server";
import { getOrderById, setOrderPaid } from "@/lib/db";
import { paystackVerify } from "@/lib/payments/paystack";
import { sendPaidInvoiceEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

/** Verifies a Paystack transaction after the customer returns to /checkout/success. */
export async function POST(req: Request) {
  let body: { orderId?: string; token?: string; reference?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const order = body.orderId ? await getOrderById(body.orderId) : undefined;
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!body.token || !order.payment_token || body.token !== order.payment_token) {
    return NextResponse.json({ error: "Invalid payment token" }, { status: 403 });
  }
  if (!body.reference) return NextResponse.json({ error: "Missing transaction reference" }, { status: 400 });

  try {
    // The reference must be the one this order was initialized with — a client
    // can't replay a successful transaction from another (already paid) order.
    if (body.reference !== order.paystack_reference) {
      return NextResponse.json({ error: "Reference does not belong to this order", paid: false }, { status: 403 });
    }
    const { paid, amount } = await paystackVerify(body.reference);
    // Anti-tamper: Paystack reports amounts in kobo/pesewas. Never mark the
    // order paid unless the charged amount equals the order total computed
    // server-side at checkout.
    const expected = Math.round(order.total * 100);
    if (paid && amount !== null && Number(amount.toFixed(0)) !== expected) {
      console.warn(`[paystack] SECURITY: amount mismatch for ${order.id} — callback ${amount}, expected ${expected}`);
      return NextResponse.json({ error: "Amount mismatch", paid: false }, { status: 400 });
    }
    if (paid && order.paid !== 1) {
      await setOrderPaid(order.id, 1);
      // Re-fetch the fresh row (txn reference) and AWAIT the send — on Vercel
      // serverless the event loop freezes once this handler returns, so a
      // fire-and-forget SMTP send never completes.
      const fresh = (await getOrderById(order.id)) ?? order;
      try {
        await sendPaidInvoiceEmail(fresh);
      } catch (err) {
        console.error(`[paystack] paid invoice email failed for ${order.id}:`, (err as Error).message);
      }
    }
    return NextResponse.json({ paid, orderId: order.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
