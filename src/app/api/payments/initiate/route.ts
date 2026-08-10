import { NextResponse } from "next/server";
import { getOrderById, setMpesaCheckout, setPaystackReference } from "@/lib/db";
import { mpesaStkPush } from "@/lib/payments/mpesa";
import { paystackInitialize } from "@/lib/payments/paystack";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * Starts the payment for an already-created order.
 * - mpesa: sends the STK push to the customer's phone (confirmation arrives via callback)
 * - card:  returns a Paystack authorization_url the client redirects to
 * - po:    nothing to do — the order stays unpaid
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
  if (!body.token || !order.payment_token || body.token !== order.payment_token) {
    return NextResponse.json({ error: "Invalid payment token" }, { status: 403 });
  }
  if (order.paid === 1) return NextResponse.json({ method: order.payment, paid: true });

  try {
    if (order.payment === "mpesa") {
      if (!order.payment_phone) {
        return NextResponse.json({ error: "Missing M-Pesa phone number" }, { status: 400 });
      }
      const { checkoutId, merchantId } = await mpesaStkPush({
        phone: order.payment_phone,
        amount: order.total,
        accountRef: order.id,
        callbackUrl: `${siteUrl}/api/payments/mpesa/callback`,
      });
      await setMpesaCheckout(order.id, checkoutId, merchantId);
      return NextResponse.json({ method: "mpesa", checkoutId, paid: false });
    }

    if (order.payment === "card") {
      const reference = `${order.id.replace(/[^A-Za-z0-9]/g, "")}-${Date.now()}`;
      const callbackUrl = `${siteUrl}/checkout/success?order=${encodeURIComponent(order.id)}&token=${encodeURIComponent(order.payment_token)}`;
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
