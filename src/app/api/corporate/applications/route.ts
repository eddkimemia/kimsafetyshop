import { NextResponse } from "next/server";
import { createCorporateApplication } from "@/lib/db";

export async function POST(req: Request) {
  let body: {
    company?: string;
    kra_pin?: string;
    industry?: string;
    contact_name?: string;
    phone?: string;
    email?: string;
    notes?: string;
    documents?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (
    !body.company?.trim() ||
    !body.kra_pin?.trim() ||
    !body.industry?.trim() ||
    !body.contact_name?.trim() ||
    !body.phone?.trim() ||
    !body.email?.trim()
  ) {
    return NextResponse.json({ error: "Missing required company details" }, { status: 400 });
  }
  const documents = Array.isArray(body.documents)
    ? body.documents.filter((d): d is string => typeof d === "string" && d.startsWith("/uploads/documents/"))
    : [];

  const app = createCorporateApplication({
    company: body.company.trim(),
    kra_pin: body.kra_pin.trim(),
    industry: body.industry.trim(),
    contact_name: body.contact_name.trim(),
    phone: body.phone.trim(),
    email: body.email.trim(),
    notes: body.notes?.trim() || null,
    documents,
  });

  return NextResponse.json({ application: app }, { status: 201 });
}
