import { getOrderByMpesaCheckout, setOrderPaid } from "@/lib/db";
import { sendPaidInvoiceEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

/**
 * Safaricom callback for Lipa Na M-Pesa Online (STK push). The callback is not
 * signed, so we match on the CheckoutRequestID we generated and stored at push
 * time — a random 20-char value nobody else knows.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      Body?: { stkCallback?: { CheckoutRequestID?: string; ResultCode?: number; ResultDesc?: string } };
    };
    const cb = body.Body?.stkCallback;
    if (cb?.CheckoutRequestID) {
      const order = await getOrderByMpesaCheckout(cb.CheckoutRequestID);
      if (order) {
        if (cb.ResultCode === 0) {
          if (order.paid !== 1) {
            await setOrderPaid(order.id, 1);
            // Fire-and-forget so Safaricom gets its "0" reply instantly.
            sendPaidInvoiceEmail(order).catch((err) =>
              console.error(`[mpesa] paid invoice email failed for ${order.id}:`, (err as Error).message)
            );
          }
        } else {
          console.warn(`[mpesa] STK push for ${order.id} failed: ${cb.ResultDesc}`);
        }
      }
    }
  } catch (err) {
    console.error("[mpesa] callback error:", err);
  }
  // Safaricom expects a plain-text response.
  return new Response("0", { headers: { "Content-Type": "text/plain" } });
}
