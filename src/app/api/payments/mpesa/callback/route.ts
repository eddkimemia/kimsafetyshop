import { getOrderByMpesaCheckout, setOrderPaid, setMpesaTransaction, recordMpesaResult } from "@/lib/db";
import { sendPaidInvoiceEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

type MetadataItem = { Name?: string; Value?: string | number };

/**
 * Safaricom callback for Lipa Na M-Pesa Online (STK push). The callback is not
 * signed, so we match on the CheckoutRequestID we generated and stored at push
 * time — a random 20-char value nobody else knows.
 *
 * Retries: each resend replaces the order's CheckoutRequestID, so callbacks for
 * older (superseded) pushes are ignored to avoid stale results overwriting the
 * current attempt.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      Body?: {
        stkCallback?: {
          CheckoutRequestID?: string;
          ResultCode?: number;
          ResultDesc?: string;
          CallbackMetadata?: { Item?: MetadataItem[] };
        };
      };
    };
    const cb = body.Body?.stkCallback;
    if (!cb?.CheckoutRequestID) return new Response("0", { headers: { "Content-Type": "text/plain" } });

    const order = await getOrderByMpesaCheckout(cb.CheckoutRequestID);
    if (order) {
      // Only the current push may update the order — a late callback from a
      // previous (superseded) push must not flip state or record its result.
      if (order.mpesa_checkout_id !== cb.CheckoutRequestID) {
        console.warn(`[mpesa] ignoring stale callback for superseded push ${cb.CheckoutRequestID} on ${order.id}`);
      } else if (cb.ResultCode === 0) {
        if (order.paid !== 1) {
          const receipt = cb.CallbackMetadata?.Item?.find((i) => i.Name === "MpesaReceiptNumber")?.Value;
          if (receipt) await setMpesaTransaction(order.id, String(receipt));
          await setOrderPaid(order.id, 1);
          // Re-fetch so the paid-invoice email/PDF carries the receipt number
          // captured above (the previously fetched row predates the update).
          // Fire-and-forget so Safaricom gets its "0" reply instantly.
          const fresh = (await getOrderByMpesaCheckout(cb.CheckoutRequestID)) ?? order;
          sendPaidInvoiceEmail(fresh).catch((err) =>
            console.error(`[mpesa] paid invoice email failed for ${order.id}:`, (err as Error).message)
          );
        }
      } else {
        // Record the decline so the checkout screen can explain it, and the
        // customer can tap "Resend STK push".
        await recordMpesaResult(order.id, String(cb.ResultCode ?? "error"), cb.ResultDesc ?? "Payment failed");
        console.warn(`[mpesa] STK push for ${order.id} failed: ${cb.ResultDesc}`);
      }
    }
  } catch (err) {
    console.error("[mpesa] callback error:", err);
  }
  // Safaricom expects a plain-text response.
  return new Response("0", { headers: { "Content-Type": "text/plain" } });
}