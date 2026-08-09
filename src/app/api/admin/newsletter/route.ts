import { NextResponse } from "next/server";
import {
  deleteNewsletterSubscriber,
  listNewsletterSubscribers,
  countNewsletterSubscribers,
  getNewsletterSubscriberById,
} from "@/lib/db";
import { requireAdmin } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get("active") === "1";

  const [subscribers, count] = await Promise.all([
    listNewsletterSubscribers(activeOnly),
    countNewsletterSubscribers(),
  ]);
  return NextResponse.json({ subscribers, count });
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing subscriber id" }, { status: 400 });
  const existing = await getNewsletterSubscriberById(id);
  if (!existing) return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
  await deleteNewsletterSubscriber(id);
  return NextResponse.json({ ok: true });
}
