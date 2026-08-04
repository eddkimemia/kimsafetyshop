import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { listCorporateApplications, setCorporateApplicationStatus } from "@/lib/db";

const VALID = ["Pending", "Reviewing", "Approved", "Declined"];

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const applications = listCorporateApplications().map((a) => ({
    ...a,
    documents: JSON.parse(a.documents),
  }));
  return NextResponse.json({ applications });
}

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  let body: { id?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.id || !VALID.includes(body.status ?? "")) {
    return NextResponse.json({ error: "Invalid application id or status" }, { status: 400 });
  }
  setCorporateApplicationStatus(body.id, body.status as string);
  return NextResponse.json({ ok: true });
}
