import { NextResponse } from "next/server";
import { subscribeNewsletter } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { email?: string; name?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  if (email.length > 254) {
    return NextResponse.json({ error: "Email address is too long" }, { status: 400 });
  }

  const source =
    typeof body.source === "string" && body.source.length <= 40 ? body.source.trim() : "home";

  try {
    const { duplicate } = await subscribeNewsletter({
      email,
      name: typeof body.name === "string" ? body.name : null,
      source,
    });
    return NextResponse.json({ ok: true, duplicate }, { status: 201 });
  } catch (err) {
    console.error("[newsletter] subscribe failed:", (err as Error).message);
    return NextResponse.json({ error: "Could not subscribe right now — please try again" }, { status: 503 });
  }
}
