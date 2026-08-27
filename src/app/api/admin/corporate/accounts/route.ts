import { NextResponse } from "next/server";
import { getSessionUser, requireSuperAdmin } from "@/lib/api-helpers";
import {
  createCorporateAccount,
  deleteCorporateAccount,
  getCorporateAccountById,
  listCorporateAccounts,
  provisionUserLogin,
  updateCorporateAccount,
} from "@/lib/db";
import { sendCorporateWelcomeEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireSuperAdmin();
  if (denied) return denied;
  const accounts = await listCorporateAccounts();
  return NextResponse.json({ accounts });
}

export async function POST(req: Request) {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  let body: {
    company?: string;
    kra_pin?: string;
    industry?: string;
    contact_name?: string;
    phone?: string;
    email?: string;
    password?: string;
    discount_rate?: number;
    credit_terms?: string;
    account_manager?: string;
    notes?: string;
    create_login?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const company = body.company?.trim();
  if (!company) return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  const email = body.email?.trim().toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  let user_id: string | null = null;
  let tempPassword: string | undefined;

  if (body.create_login !== false && email) {
    const provision = await provisionUserLogin({
      name: body.contact_name?.trim() || company,
      email,
      phone: body.phone?.trim() || null,
      company,
      password: body.password,
    });
    user_id = provision.user_id;
    if (provision.createdLogin) tempPassword = provision.tempPassword;
  }

  const me = await getSessionUser();
  const account = await createCorporateAccount({
    user_id,
    company,
    kra_pin: body.kra_pin?.trim() || null,
    industry: body.industry?.trim() || null,
    contact_name: body.contact_name?.trim() || null,
    phone: body.phone?.trim() || null,
    email,
    discount_rate: body.discount_rate ?? 0,
    credit_terms: body.credit_terms?.trim() || "30 days",
    account_manager: body.account_manager?.trim() || null,
    notes: body.notes?.trim() || null,
    created_by_id: me?.id ?? null,
    created_by_name: me?.name ?? me?.email ?? null,
  });

  // Best-effort welcome email with credentials; the temp password is still
  // returned so the superadmin can share it if SMTP is unavailable. AWAITED —
  // on Vercel serverless un-awaited SMTP sends are frozen mid-flight.
  if (email) {
    try {
      await sendCorporateWelcomeEmail({
        to: email,
        name: body.contact_name?.trim() || null,
        company,
        tempPassword,
      });
    } catch (err) {
      console.error("[corporate/accounts] welcome email failed:", err);
    }
  }

  return NextResponse.json({ account, tempPassword, createdLogin: !!tempPassword }, { status: 201 });
}

export async function PATCH(req: Request) {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  let body: {
    id?: string;
    company?: string;
    kra_pin?: string | null;
    industry?: string | null;
    contact_name?: string | null;
    phone?: string | null;
    email?: string | null;
    discount_rate?: number;
    credit_terms?: string;
    account_manager?: string | null;
    notes?: string | null;
    status?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const existing = body.id ? await getCorporateAccountById(body.id) : undefined;
  if (!existing) return NextResponse.json({ error: "Corporate account not found" }, { status: 404 });

  const statuses = ["Active", "Paused", "Closed"];
  if (body.status !== undefined && !statuses.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const email = body.email?.trim().toLowerCase();
  if (email !== undefined && email !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const account = await updateCorporateAccount(existing.id, {
    company: body.company?.trim() || undefined,
    kra_pin: body.kra_pin === undefined ? undefined : body.kra_pin?.trim() || null,
    industry: body.industry === undefined ? undefined : body.industry?.trim() || null,
    contact_name: body.contact_name === undefined ? undefined : body.contact_name?.trim() || null,
    phone: body.phone === undefined ? undefined : body.phone?.trim() || null,
    email: email === undefined ? undefined : email || null,
    discount_rate: body.discount_rate,
    credit_terms: body.credit_terms?.trim() || undefined,
    account_manager: body.account_manager === undefined ? undefined : body.account_manager?.trim() || null,
    notes: body.notes === undefined ? undefined : body.notes?.trim() || null,
    status: body.status,
  });

  return NextResponse.json({ ok: true, account });
}

export async function DELETE(req: Request) {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing account id" }, { status: 400 });
  const existing = await getCorporateAccountById(id);
  if (!existing) return NextResponse.json({ error: "Corporate account not found" }, { status: 404 });

  await deleteCorporateAccount(id);
  return NextResponse.json({ ok: true });
}
