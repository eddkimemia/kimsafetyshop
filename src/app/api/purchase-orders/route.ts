import { NextResponse } from "next/server";
import { createPurchaseOrder, getSetting } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { sendNewPOAlert } from "@/lib/mailer";

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

    const me = await getSessionUser();
    const po = await createPurchaseOrder({
      company,
      contact_name: body.contact_name ? String(body.contact_name).trim() : null,
      phone: body.phone ? String(body.phone).trim() : null,
      email: body.email ? String(body.email).trim() : null,
      po_file: poFile,
      created_by_id: me?.id ?? null,
      created_by_name: me?.name ?? me?.email ?? null,
    });

    // Alert staff a guest PO was uploaded — awaited so the SMTP send completes
    // before the serverless function returns.
    try {
      const staffEmail = await getSetting("email");
      if (staffEmail) {
        await sendNewPOAlert({
          to: staffEmail,
          poId: po.id,
          company,
          contact: String(body.contact_name ?? body.email ?? "").trim() || "—",
        });
      }
    } catch (err) {
      console.error(`[purchase-orders] staff alert email failed for ${po.id}:`, (err as Error).message);
    }

    return NextResponse.json({ ok: true, id: po.id, created_at: po.created_at }, { status: 201 });
  } catch (err) {
    console.error("Failed to submit purchase order:", err);
    return NextResponse.json({ error: "Failed to submit purchase order" }, { status: 500 });
  }
}
