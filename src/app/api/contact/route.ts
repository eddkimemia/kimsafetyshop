import { NextResponse } from "next/server";
import { createContactMessage, getSetting } from "@/lib/db";
import { sendContactAlert } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { name?: string; email?: string; phone?: string; topic?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const topic = body.topic?.trim();
  const message = body.message?.trim();
  if (!name || !email || !topic || !message) {
    return NextResponse.json({ error: "Name, email, topic and message are required" }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
  }
  if (message.length > 4000) {
    return NextResponse.json({ error: "Message is too long (max 4000 characters)" }, { status: 400 });
  }

  const msg = await createContactMessage({
    name,
    email,
    phone: body.phone?.trim() || undefined,
    topic,
    message,
  });

  // Alert staff so the form actually reaches a human. Awaited so the SMTP send
  // completes before the serverless function returns.
  try {
    const staffEmail = await getSetting("email");
    if (staffEmail) {
      await sendContactAlert({
        to: staffEmail,
        name,
        email,
        phone: body.phone?.trim() ?? "",
        topic,
        message,
      });
    }
  } catch (err) {
    console.error(`[contact] staff alert email failed for ${msg.id}:`, (err as Error).message);
  }

  return NextResponse.json({ ok: true, id: msg.id }, { status: 201 });
}
