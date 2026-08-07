import { NextResponse } from "next/server";
import { addTicketReply, getTicket, listTicketReplies } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const ticket = getTicket(params.id);
  if (!ticket || ticket.user_id !== user.id) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }
  return NextResponse.json({ ticket, replies: listTicketReplies(params.id) });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const ticket = getTicket(params.id);
  if (!ticket || ticket.user_id !== user.id) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }
  if (ticket.status === "Closed") {
    return NextResponse.json({ error: "This ticket is closed" }, { status: 400 });
  }

  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }
  const reply = addTicketReply({
    ticket_id: params.id,
    user_id: user.id,
    message: body.message.trim(),
  });
  return NextResponse.json({ reply }, { status: 201 });
}
