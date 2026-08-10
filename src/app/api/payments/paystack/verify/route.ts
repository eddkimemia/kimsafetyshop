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
    const { paid } = await paystackVerify(body.reference);
    if (paid && order.paid !== 1) {
      await setOrderPaid(order.id, 1);
      sendPaidInvoiceEmail(order).catch((err) =>
        console.error(`[paystack] paid invoice email failed for ${order.id}:`, (err as Error).message)
      );
    }
    return NextResponse.json({ paid, orderId: order.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
