import { NextResponse } from "next/server";
import {
  addTicketReply,
  getTicket,
  listAllTickets,
  listTicketReplies,
  setTicketStatus,
} from "@/lib/db";
import { getSessionUser, requireAdmin } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const thread = searchParams.get("thread");
  if (thread) {
    const ticket = getTicket(thread);
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    return NextResponse.json({ ticket, replies: listTicketReplies(thread) });
  }

  const tickets = listAllTickets();
  return NextResponse.json({ tickets });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const user = await getSessionUser();

  let body: { id?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.id || !body.message?.trim()) {
    return NextResponse.json({ error: "Ticket id and message are required" }, { status: 400 });
  }
  const ticket = getTicket(body.id);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  if (ticket.status === "Closed") {
    return NextResponse.json({ error: "This ticket is closed" }, { status: 400 });
  }

  const reply = addTicketReply({
    ticket_id: body.id,
    user_id: null,
    staff_name: user?.name ?? "KimSafety Support",
    message: body.message.trim(),
  });
  return NextResponse.json({ reply }, { status: 201 });
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
  if (!body.id || !["Closed", "Open"].includes(body.status ?? "")) {
    return NextResponse.json({ error: "Invalid ticket id or status" }, { status: 400 });
  }
  const ticket = getTicket(body.id);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  setTicketStatus(body.id, body.status as string);
  return NextResponse.json({ ok: true });
}
