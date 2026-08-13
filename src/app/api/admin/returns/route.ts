import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { getOrderById, getUserById, listAllReturns, setReturnStatus } from "@/lib/db";
import { sendReturnStatusEmail } from "@/lib/mailer";

const VALID = ["Requested", "Approved", "Rejected", "Picked up", "Refunded", "Closed"];

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const returns = await listAllReturns();
  // Enrich with the customer's email + name (for replies) and the order reference.
  const enriched = await Promise.all(
    returns.map(async (r) => {
      const order = await getOrderById(r.order_id);
      const account = order?.user_id ? await getUserById(order.user_id) : undefined;
      return {
        ...r,
        customer_name: account?.name ?? order?.name ?? null,
        customer_email: account?.email ?? order?.email ?? null,
      };
    })
  );
  return NextResponse.json({ returns: enriched });
}

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  let body: { id?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.id || !VALID.includes(body.status ?? "")) {
    return NextResponse.json({ error: "Invalid return id or status" }, { status: 400 });
  }
  const ret = (await listAllReturns()).find((r) => r.id === body.id);
  if (!ret) return NextResponse.json({ error: "Return not found" }, { status: 404 });
  await setReturnStatus(body.id, body.status as string);

  // Email the customer when the return status changes — awaited so the SMTP
  // send completes before the serverless function returns.
  try {
    const order = await getOrderById(ret.order_id);
    const account = order?.user_id ? await getUserById(order.user_id) : undefined;
    const to = account?.email ?? order?.email ?? null;
    if (to) {
      await sendReturnStatusEmail({
        to,
        name: account?.name ?? order?.name ?? ret.product_name,
        returnId: ret.id,
        status: body.status as string,
      });
    }
  } catch (err) {
    console.error(`[returns] status email failed for ${ret.id}:`, (err as Error).message);
  }

  return NextResponse.json({ ok: true });
}