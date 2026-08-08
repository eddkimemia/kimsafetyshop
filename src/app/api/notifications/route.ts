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
    notifications: await listNotificationsForUser(user.id),
    unread: await countUnreadNotifications(user.id),
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
    await markAllNotificationsRead(user.id);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "read" && body.id) {
    const owned = (await listNotificationsForUser(user.id)).some((n) => n.id === body.id);
    if (!owned) return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    await markNotificationRead(body.id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
