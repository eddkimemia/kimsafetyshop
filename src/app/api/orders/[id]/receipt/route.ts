import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { buildReceiptPdf } from "@/lib/receipt-pdf";

export const runtime = "nodejs";

/**
 * Official payment receipt for a PAID order (PDF download). Unpaid orders have
 * nothing to receipt — the invoice PDF is the correct document there.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const order = await getOrderById(params.id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.paid !== 1) {
    return NextResponse.json({ error: "Receipt is only available for paid orders" }, { status: 409 });
  }

  const isGuestOrder = order.user_id === null;
  const user = await getSessionUser();
  if (!isGuestOrder) {
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const isAdmin = user.role === "admin" || user.role === "superadmin";
    const isOwner = order.user_id === user.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Not your order" }, { status: 403 });
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
