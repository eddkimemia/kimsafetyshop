import { NextResponse } from "next/server";
import { createUser, getUserByEmail } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  let body: { name?: string; email?: string; password?: string; company?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";
  const phone = body.phone?.trim();

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid name and email address" }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  if (await getUserByEmail(email)) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const user = await createUser({
    name,
    email,
    password,
    company: body.company?.trim() || undefined,
    phone,
    verified: 0,
  });

  // Best-effort welcome email — never blocks registration when SMTP is unset.
  // Awaited (not fire-and-forget): on Vercel serverless the event loop freezes
  // the moment the handler returns, and un-awaited SMTP sends never complete.
  try {
    await sendWelcomeEmail({ to: email, name });
  } catch (err) {
    console.error("[register] welcome email failed:", err);
  }

  return NextResponse.json(
    { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    { status: 201 }
  );
}
