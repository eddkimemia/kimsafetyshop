import { NextResponse } from "next/server";
import { createPurchaseOrder } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const company = String(body.company ?? "").trim();
    const poFile = String(body.po_file ?? "").trim();

    if (!company) return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    if (!poFile.startsWith("/uploads/documents/")) {
      return NextResponse.json({ error: "Invalid purchase order file" }, { status: 400 });
    }

    const po = createPurchaseOrder({
      company,
      contact_name: body.contact_name ? String(body.contact_name).trim() : null,
      phone: body.phone ? String(body.phone).trim() : null,
      email: body.email ? String(body.email).trim() : null,
      po_file: poFile,
    });
    return NextResponse.json({ ok: true, id: po.id, created_at: po.created_at }, { status: 201 });
  } catch (err) {
    console.error("Failed to submit purchase order:", err);
    return NextResponse.json({ error: "Failed to submit purchase order" }, { status: 500 });
  }
}
