import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { buildInvoicePdf } from "@/lib/invoice-pdf";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const order = await getOrderById(params.id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Order ids are short and guessable (KS-#####), so access requires ONE of:
  // an admin session, the owning signed-in user, or the one-time payment
  // token issued at checkout (embedded in guest confirmation links).
  const user = await getSessionUser();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const isOwner = Boolean(user && order.user_id && order.user_id === user.id);
  if (!isAdmin && !isOwner) {
    const { searchParams } = new URL(req.url);
    if (!order.payment_token || searchParams.get("token") !== order.payment_token) {
      return NextResponse.json({ error: "Invalid or missing token" }, { status: 403 });
    }
  }

  const pdf = await buildInvoicePdf(order);

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="kimsafety-invoice-${order.id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
