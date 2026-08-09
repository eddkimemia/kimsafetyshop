import { NextResponse } from "next/server";
import { getNewsletterSubscriberByToken, unsubscribeNewsletter } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) return NextResponse.json({ error: "Missing unsubscribe token" }, { status: 400 });

  try {
    const subscriber = await getNewsletterSubscriberByToken(token);
    if (!subscriber) {
      return NextResponse.json({ error: "Unsubscribe link is invalid or expired" }, { status: 404 });
    }
    if (subscriber.status === "unsubscribed") {
      return NextResponse.json({ ok: true, already: true });
    }
    await unsubscribeNewsletter(token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[newsletter] unsubscribe failed:", (err as Error).message);
    return NextResponse.json({ error: "Could not unsubscribe right now — please try again" }, { status: 503 });
  }
}
