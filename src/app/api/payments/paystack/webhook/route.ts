import { NextResponse } from "next/server";
import { getOrderByPaystackReference, setOrderPaid } from "@/lib/db";
import { verifyPaystackWebhook } from "@/lib/payments/paystack";
import { sendPaidInvoiceEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

/**
 * Paystack webhook — the authoritative confirmation that a charge succeeded.
 * Register this URL in the Paystack dashboard (Settings → Webhooks) and the
 * secret key will be used to verify the x-paystack-signature header.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";
  if (!verifyPaystackWebhook(raw, signature)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const event = JSON.parse(raw) as { event?: string; data?: { reference?: string } };
  if (event.event === "charge.success" && event.data?.reference) {
    const order = await getOrderByPaystackReference(event.data.reference);
    if (order && order.paid !== 1) {
      await setOrderPaid(order.id, 1);
      // Re-fetch the fresh row so the paid-invoice email/PDF carries the
      // payment reference, then AWAIT the send — on Vercel serverless the
      // event loop freezes when this handler returns, so a fire-and-forget
      // SMTP send never completes.
      const fresh = (await getOrderByPaystackReference(event.data.reference)) ?? order;
      try {
        await sendPaidInvoiceEmail(fresh);
      } catch (err) {
        console.error(`[paystack] paid invoice email failed for ${order.id}:`, (err as Error).message);
      }
    }
  }
  return NextResponse.json({ ok: true });
}
