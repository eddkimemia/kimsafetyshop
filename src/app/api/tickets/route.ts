import { NextResponse } from "next/server";
import { createTicket, getSetting, listTicketsForUser } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { sendNewTicketAlert } from "@/lib/mailer";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  return NextResponse.json({ tickets: await listTicketsForUser(user.id) });
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
  const ticket = await createTicket({
    user_id: user.id,
    subject: body.subject.trim(),
    message: body.message.trim(),
  });

  // Alert staff a new ticket arrived — awaited so the SMTP send completes
  // before the serverless function returns.
  try {
    const staffEmail = await getSetting("email");
    if (staffEmail) {
      await sendNewTicketAlert({
        to: staffEmail,
        ticketId: ticket.id,
        subject: ticket.subject,
        customer: user.name ?? "Customer",
      });
    }
  } catch (err) {
    console.error(`[tickets] staff alert email failed for ${ticket.id}:`, (err as Error).message);
  }

  return NextResponse.json({ ticket }, { status: 201 });
}
