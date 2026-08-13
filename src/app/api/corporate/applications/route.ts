import { NextResponse } from "next/server";
import { createCorporateApplication, getSetting } from "@/lib/db";
import { sendCorporateApplicationConfirmation, sendNewCorporateApplicationAlert } from "@/lib/mailer";

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

  const app = await createCorporateApplication({
    company: body.company.trim(),
    kra_pin: body.kra_pin.trim(),
    industry: body.industry.trim(),
    contact_name: body.contact_name.trim(),
    phone: body.phone.trim(),
    email: body.email.trim(),
    notes: body.notes?.trim() || null,
    documents,
  });

  // Acknowledge the applicant + alert staff — both awaited so the SMTP sends
  // complete before the serverless function returns.
  try {
    await sendCorporateApplicationConfirmation({
      to: app.email,
      name: app.contact_name,
      company: app.company,
    });
  } catch (err) {
    console.error(`[corporate] confirmation email failed for ${app.id}:`, (err as Error).message);
  }
  try {
    const staffEmail = await getSetting("email");
    if (staffEmail) {
      await sendNewCorporateApplicationAlert({
        to: staffEmail,
        company: app.company,
        contact: `${app.contact_name} <${app.email}>`,
      });
    }
  } catch (err) {
    console.error(`[corporate] staff alert email failed for ${app.id}:`, (err as Error).message);
  }

  return NextResponse.json({ application: app }, { status: 201 });
}
