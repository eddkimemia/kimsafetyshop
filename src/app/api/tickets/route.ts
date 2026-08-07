import { NextResponse } from "next/server";
import { createTicket, listTicketsForUser } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  return NextResponse.json({ tickets: listTicketsForUser(user.id) });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { subject?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.subject?.trim() || !body.message?.trim()) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }
  const ticket = createTicket({
    user_id: user.id,
    subject: body.subject.trim(),
    message: body.message.trim(),
  });
  return NextResponse.json({ ticket }, { status: 201 });
}
