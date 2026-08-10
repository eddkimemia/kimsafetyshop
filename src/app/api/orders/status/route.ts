import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/db";

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
  return NextResponse.json({ orderId: order.id, payment: order.payment, paid: order.paid, status: order.status });
}
