import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const db = getDb();
  const orders = db.prepare("SELECT COUNT(*) AS c FROM orders WHERE status = 'Processing'").get() as { c: number };
  const tickets = db.prepare("SELECT COUNT(*) AS c FROM support_tickets WHERE status = 'Open'").get() as { c: number };
  const quotes = db.prepare("SELECT COUNT(*) AS c FROM quotes WHERE status = 'Pending'").get() as { c: number };

  return NextResponse.json({
    badges: { orders: orders.c, tickets: tickets.c, quotes: quotes.c },
  });
}
