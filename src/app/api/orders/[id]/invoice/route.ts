import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { buildInvoicePdf } from "@/lib/invoice-pdf";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const order = await getOrderById(params.id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Guest orders (placed without an account) are downloadable without login so
  // the checkout confirmation link works; account orders require the owner or an admin.
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
