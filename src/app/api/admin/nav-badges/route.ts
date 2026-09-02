import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { q1 } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [orders, tickets, quotes, returns, questions, messages] = await Promise.all([
    q1<{ c: number }>("SELECT COUNT(*)::int AS c FROM orders WHERE status = 'Processing'"),
    q1<{ c: number }>("SELECT COUNT(*)::int AS c FROM support_tickets WHERE status = 'Open'"),
    q1<{ c: number }>("SELECT COUNT(*)::int AS c FROM quotes WHERE status = 'Pending'"),
    q1<{ c: number }>("SELECT COUNT(*)::int AS c FROM returns WHERE status = 'Requested'"),
    q1<{ c: number }>("SELECT COUNT(*)::int AS c FROM product_questions WHERE answer IS NULL"),
    q1<{ c: number }>("SELECT COUNT(*)::int AS c FROM contact_messages"),
  ]);

  return NextResponse.json({
    badges: { orders: orders?.c ?? 0, tickets: tickets?.c ?? 0, quotes: quotes?.c ?? 0, returns: returns?.c ?? 0, questions: questions?.c ?? 0, messages: messages?.c ?? 0 },
  });
}
