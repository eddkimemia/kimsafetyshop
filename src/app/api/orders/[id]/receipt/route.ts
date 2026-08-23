import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { buildReceiptPdf } from "@/lib/receipt-pdf";

export const runtime = "nodejs";

/**
 * Official payment receipt for a PAID order (PDF download). Unpaid orders have
 * nothing to receipt — the invoice PDF is the correct document there.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const order = await getOrderById(params.id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.paid !== 1) {
    return NextResponse.json({ error: "Receipt is only available for paid orders" }, { status: 409 });
  }

  // Same access rule as the invoice route: admin session, owning signed-in
  // user, or the one-time checkout payment token.
  const user = await getSessionUser();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const isOwner = Boolean(user && order.user_id && order.user_id === user.id);
  if (!isAdmin && !isOwner) {
    const { searchParams } = new URL(req.url);
    if (!order.payment_token || searchParams.get("token") !== order.payment_token) {
      return NextResponse.json({ error: "Invalid or missing token" }, { status: 403 });
    }
  }

  const pdf = await buildReceiptPdf(order);

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="kimsafety-receipt-${order.id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
