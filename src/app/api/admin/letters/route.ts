import { NextResponse } from "next/server";
import { requireAdmin, getSessionUser } from "@/lib/api-helpers";
import { createLetter, updateLetter, getLetterById, listLetters, listLettersFor, deleteLetter } from "@/lib/db";

type LetterBody = {
  type?: string;
  recipient_name?: string;
  recipient_title?: string;
  recipient_company?: string;
  recipient_address?: string;
  subject?: string;
  salutation?: string;
  body?: string;
  closing?: string;
  sender_name?: string;
  sender_title?: string;
  with_stamp?: boolean;
};

async function parseBody(req: Request): Promise<LetterBody | { error: string; status: number }> {
  let body: LetterBody;
  try {
    body = await req.json();
  } catch {
    return { error: "Invalid request body", status: 400 };
  }
  if (!body.recipient_name?.trim() || !body.body?.trim()) {
    return { error: "Recipient name and letter body are required", status: 400 };
  }
  return body;
}

async function canAccess(letter: { created_by_id: string | null } | undefined, me: { id: string; role: string } | null) {
  if (!letter) return { error: "Letter not found", status: 404 as const };
  if (me?.role === "superadmin") return null;
  if (letter.created_by_id && letter.created_by_id === me?.id) return null;
  return { error: "You can only manage letters you created", status: 403 as const };
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const me = await getSessionUser();
  const letters = me?.role === "superadmin" ? listLetters() : listLettersFor(me?.id ?? "");
  return NextResponse.json({ letters });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const me = await getSessionUser();
  const body = await parseBody(req);
  if ("error" in body) return NextResponse.json({ error: body.error }, { status: body.status });

  const letter = createLetter({
    type: body.type,
    recipient_name: body.recipient_name!.trim(),
    recipient_title: body.recipient_title,
    recipient_company: body.recipient_company,
    recipient_address: body.recipient_address,
    subject: body.subject,
    salutation: body.salutation,
    body: body.body!.trim(),
    closing: body.closing,
    sender_name: body.sender_name?.trim() || me?.name || "KimSafety Team",
    sender_title: body.sender_title,
    with_stamp: body.with_stamp,
    created_by: me?.name ?? "KimSafety Team",
    created_by_id: me?.id ?? null,
  });

  return NextResponse.json({ letter }, { status: 201 });
}

export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const me = await getSessionUser();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing letter id" }, { status: 400 });
  const blocked = await canAccess(getLetterById(id), me);
  if (blocked) return NextResponse.json({ error: blocked.error }, { status: blocked.status });

  const body = await parseBody(req);
  if ("error" in body) return NextResponse.json({ error: body.error }, { status: body.status });

  const letter = updateLetter(id, {
    type: body.type,
    recipient_name: body.recipient_name!.trim(),
    recipient_title: body.recipient_title,
    recipient_company: body.recipient_company,
    recipient_address: body.recipient_address,
    subject: body.subject,
    salutation: body.salutation,
    body: body.body!.trim(),
    closing: body.closing,
    sender_name: body.sender_name,
    sender_title: body.sender_title,
    with_stamp: body.with_stamp,
  });

  return NextResponse.json({ letter });
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const me = await getSessionUser();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing letter id" }, { status: 400 });
  const blocked = await canAccess(getLetterById(id), me);
  if (blocked) return NextResponse.json({ error: blocked.error }, { status: blocked.status });
  deleteLetter(id);
  return NextResponse.json({ ok: true });
}