import { NextResponse } from "next/server";
import { getOrderById, setMpesaCheckout, setPaystackReference, recordMpesaPushAttempt, recordMpesaResult } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { mpesaStkPush, MPESA_COOLDOWN_MS, MPESA_MAX_ATTEMPTS } from "@/lib/payments/mpesa";
import { paystackInitialize } from "@/lib/payments/paystack";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * Starts the payment for an already-created order.
 * - mpesa: sends the STK push to the customer's phone (confirmation arrives via callback)
 * - card:  returns a Paystack authorization_url the client redirects to
 * - po:    nothing to do — the order stays unpaid
 *
 * The same endpoint doubles as "resend STK push": it's token-gated (only the
 * customer who placed the order holds the token) and the mpesa branch enforces
 * a cooldown and an attempt cap so a stuck or spamming client can't fire an
 * unlimited number of pushes.
 */
export async function POST(req: Request) {
  let body: { orderId?: string; token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const order = body.orderId ? await getOrderById(body.orderId) : undefined;
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  // Access is granted by the one-time payment token (guest checkout) OR by being
  // the signed-in user who owns the order (account pages can then retry payment).
  const user = await getSessionUser();
  const isOwner = user && order.user_id && order.user_id === user.id;
  const orderToken = order.payment_token;
  if (!isOwner && (!body.token || !orderToken || body.token !== orderToken)) {
    return NextResponse.json({ error: "Invalid payment token" }, { status: 403 });
  }
  if (order.paid === 1) return NextResponse.json({ method: order.payment, paid: true });

  try {
    if (order.payment === "mpesa") {
      if (!order.payment_phone) {
        return NextResponse.json({ error: "Missing M-Pesa phone number" }, { status: 400 });
      }
      const attempts = order.mpesa_push_count ?? 0;
      const lastPushAt = order.mpesa_pushed_at ? new Date(order.mpesa_pushed_at).getTime() : 0;
      const elapsed = Date.now() - lastPushAt;
      const retryAfterMs = Math.max(0, MPESA_COOLDOWN_MS - elapsed);
      if (attempts > 0 && attempts >= MPESA_MAX_ATTEMPTS) {
        return NextResponse.json(
          {
            error: "Too many M-Pesa attempts for this order. Please contact us on WhatsApp for help.",
            attempts,
            maxAttempts: MPESA_MAX_ATTEMPTS,
          },
          { status: 429 }
        );
      }
      if (retryAfterMs > 0) {
        return NextResponse.json(
          { error: "An M-Pesa push was sent recently. Please check your phone.", retryAfterMs, attempts },
          { status: 429 }
        );
      }
      const { checkoutId, merchantId } = await mpesaStkPush({
        phone: order.payment_phone,
        amount: order.total,
        accountRef: order.id,
        callbackUrl: `${siteUrl}/api/payments/mpesa/callback`,
      });
      await setMpesaCheckout(order.id, checkoutId, merchantId);
      await recordMpesaPushAttempt(order.id);
      // A new push supersedes any previous decline — the checkout screen would
      // otherwise keep showing the stale failure reason from the last attempt.
      await recordMpesaResult(order.id, "", "");
      return NextResponse.json({
        method: "mpesa",
        checkoutId,
        paid: false,
        attempts: attempts + 1,
        retryAfterMs: MPESA_COOLDOWN_MS,
      });
    }

    if (order.payment === "card") {
      const reference = `${order.id.replace(/[^A-Za-z0-9]/g, "")}-${Date.now()}`;
      const callbackUrl = `${siteUrl}/checkout/success?order=${encodeURIComponent(order.id)}&token=${encodeURIComponent(orderToken ?? "")}`;
      const { authorizationUrl, reference: savedRef } = await paystackInitialize({
        email: order.email,
        amount: order.total,
        reference,
        callbackUrl,
      });
      await setPaystackReference(order.id, savedRef);
      return NextResponse.json({ method: "card", authorizationUrl, paid: false });
    }

    return NextResponse.json({ method: order.payment, paid: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Payment could not be started";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
