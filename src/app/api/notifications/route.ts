import { NextResponse } from "next/server";
import {
  countUnreadNotifications,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  return NextResponse.json({
    notifications: listNotificationsForUser(user.id),
    unread: countUnreadNotifications(user.id),
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { action?: string; id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (body.action === "readAll") {
    markAllNotificationsRead(user.id);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "read" && body.id) {
    markNotificationRead(body.id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
