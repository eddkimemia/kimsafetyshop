import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { deleteContactMessage, listContactMessages } from "@/lib/db";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ messages: await listContactMessages() });
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing message id" }, { status: 400 });
  await deleteContactMessage(id);
  return NextResponse.json({ ok: true });
}
