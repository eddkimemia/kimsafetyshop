import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/db";
import { MPESA_COOLDOWN_MS, MPESA_MAX_ATTEMPTS } from "@/lib/payments/mpesa";

export const dynamic = "force-dynamic";

/**
 * Public payment-status endpoint for the checkout confirmation screen.
 * Authorized by the one-time payment token returned when the order was placed,
 * so guests don't need an account to see their payment go through.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId") ?? "";
  const token = searchParams.get("token") ?? "";
  if (!orderId || !token) return NextResponse.json({ error: "Missing orderId or token" }, { status: 400 });

  const order = await getOrderById(orderId);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!order.payment_token || token !== order.payment_token) {
    return NextResponse.json({ error: "Invalid payment token" }, { status: 403 });
  }
  // Retry info for the M-Pesa "Resend STK push" flow: when the last push was
  // declined (mpesa_last_result set) or the cooldown hasn't elapsed, the
  // checkout screen uses these to render the failure reason + countdown.
  let canResend = false;
  let retryAfterMs = 0;
  if (order.paid !== 1 && order.payment === "mpesa") {
    const lastPushAt = order.mpesa_pushed_at ? new Date(order.mpesa_pushed_at).getTime() : 0;
    retryAfterMs = Math.max(0, MPESA_COOLDOWN_MS - (Date.now() - lastPushAt));
    canResend = (order.mpesa_push_count ?? 0) < MPESA_MAX_ATTEMPTS && retryAfterMs === 0;
  }
  return NextResponse.json({
    orderId: order.id,
    payment: order.payment,
    paid: order.paid,
    status: order.status,
    mpesaPushCount: order.mpesa_push_count ?? 0,
    mpesaLastResult: order.mpesa_last_result,
    mpesaLastResultDesc: order.mpesa_last_result_desc,
    transactionId: order.payment === "mpesa" ? order.mpesa_transaction_id : order.paystack_reference,
    canResend,
    retryAfterMs,
  });
}
