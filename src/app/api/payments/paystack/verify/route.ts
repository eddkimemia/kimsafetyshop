import { NextResponse } from "next/server";
import { getOrderById, setOrderPaid, setPaystackTransaction } from "@/lib/db";
import { paystackVerify } from "@/lib/payments/paystack";
import { sendPaidInvoiceEmail } from "@/lib/mailer";
import { rateLimit, tooMany } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Verifies a Paystack transaction after the customer returns from the hosted
 * checkout.
 *
 * The `reference` body field is OPTIONAL: Paystack redirects back to
 * callback_url by APPENDING "?reference=…&trxref=…", which corrupts callback
 * URLs that already carry their own query string (the token param ends up
 * polluted and previously caused spurious 403s here — successful payments
 * were never picked up). The authoritative reference is the one this server
 * generated and stored on the order at initiation time
 * (orders.paystack_reference), so we default to that and never need to trust
 * URL-echoed values.
 */
export async function POST(req: Request) {
  const rl = rateLimit(req, "paystack-verify", 30, 600000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  let body: { orderId?: string; token?: string; reference?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const order = body.orderId ? await getOrderById(body.orderId) : undefined;
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // The token gates GUEST visibility of order data elsewhere; verification
  // itself only ever marks the order paid AFTER Paystack (queried with our
  // secret key) confirms THIS order's stored reference succeeded — it cannot
  // be forged by guessing ids. When a token IS supplied it must still match.
  if (body.token && (!order.payment_token || body.token !== order.payment_token)) {
    return NextResponse.json({ error: "Invalid payment token" }, { status: 403 });
  }

  // Anti-replay: an explicitly supplied reference must be the one this order
  // was initialized with — a client can't replay another order's successful
  // transaction onto this one.
  const reference = typeof body.reference === "string" && body.reference ? body.reference : order.paystack_reference;
  if (!reference) {
    return NextResponse.json({ error: "No Paystack reference for this order — start the payment again", paid: false }, { status: 400 });
  }
  if (body.reference && body.reference !== order.paystack_reference) {
    return NextResponse.json({ error: "Reference does not belong to this order", paid: false }, { status: 403 });
  }

  try {
    const { paid, amount, transactionId } = await paystackVerify(reference);
    // Anti-tamper: Paystack reports amounts in kobo/pesewas. Never mark the
    // order paid unless the charged amount equals the order total computed
    // server-side at checkout.
    const expected = Math.round(order.total * 100);
    if (paid && amount !== null && Number(amount.toFixed(0)) !== expected) {
      console.warn(`[paystack] SECURITY: amount mismatch for ${order.id} — callback ${amount}, expected ${expected}`);
      return NextResponse.json({ error: "Amount mismatch", paid: false }, { status: 400 });
    }
    if (paid && order.paid !== 1) {
      // Capture the gateway's own transaction ID BEFORE flagging paid so the
      // re-fetched row below (and the invoice email) carries it.
      if (transactionId && !order.paystack_transaction_id) {
        await setPaystackTransaction(order.id, transactionId);
      }
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
    console.error(`[paystack] verify failed for ${order.id}:`, msg);
    return NextResponse.json({ error: "Unable to verify payment. Please try again." }, { status: 502 });
  }
}
