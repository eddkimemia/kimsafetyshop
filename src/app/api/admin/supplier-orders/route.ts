import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { createSupplierOrder, listSupplierOrders, setSupplierOrderStatus } from "@/lib/db";
import type { SupplierOrderItem } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({
    orders: listSupplierOrders().map((o) => ({ ...o, items: JSON.parse(o.items) })),
  });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: {
    supplier?: string;
    contact_name?: string;
    phone?: string;
    email?: string;
    items?: unknown[];
    shipping?: number;
    expected_date?: string;
    notes?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const supplier = String(body.supplier ?? "").trim();
  if (!supplier) return NextResponse.json({ error: "Supplier name is required" }, { status: 400 });

  const items = (body.items ?? [])
    .filter((i): i is SupplierOrderItem => Boolean(i) && typeof i === "object")
    .map((i) => ({
      name: String((i as { name?: unknown }).name ?? "").trim(),
      qty: Math.max(0, Math.floor(Number((i as { qty?: unknown }).qty) || 0)),
      unitPrice: Math.max(0, Math.round(Number((i as { unitPrice?: unknown }).unitPrice) || 0)),
    }))
    .filter((i) => i.name && i.qty > 0);

  if (items.length === 0) {
    return NextResponse.json({ error: "Add at least one item with a name and quantity" }, { status: 400 });
  }

  const order = createSupplierOrder({
    supplier,
    contact_name: body.contact_name ? String(body.contact_name).trim() : null,
    phone: body.phone ? String(body.phone).trim() : null,
    email: body.email ? String(body.email).trim() : null,
    items,
    shipping: body.shipping,
    expected_date: body.expected_date || null,
    notes: body.notes ? String(body.notes).trim() : null,
  });

  return NextResponse.json({ order: { ...order, items: JSON.parse(order.items) } }, { status: 201 });
}

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id, status } = (await req.json().catch(() => ({}))) as { id?: string; status?: string };
  if (!id || !status) return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
  setSupplierOrderStatus(id, status);
  return NextResponse.json({ ok: true });
}
