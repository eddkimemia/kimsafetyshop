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
    if (!order) {
      console.warn(`[mpesa] callback for unknown CheckoutRequestID ${cb.CheckoutRequestID} — no order matched (may be superseded or already reconciled)`);
    }
    if (order) {
      if (cb.ResultCode === 0) {
        // Anti-forgery: the callback is unsigned, so never trust a success
        // alone. The Amount recorded by Safaricom must equal the order total
        // computed server-side at checkout; otherwise treat it as a failure
        // and never flip the order to paid.
        const rawAmount = cb.CallbackMetadata?.Item?.find((i) => i.Name === "Amount")?.Value;
        const amount = Number(rawAmount);
        // Compare rounded KES — Daraja may send 1.00 vs integer 1, or string vs number.
        if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount) !== Math.round(order.total)) {
          console.warn(
            `[mpesa] SECURITY: amount mismatch for ${order.id} — callback ${amount}, expected ${order.total}. Not marking paid.`
          );
          await recordMpesaResult(order.id, "amount_mismatch", `Amount mismatch: callback ${amount} vs ${order.total}`);
          return new Response("0", { headers: { "Content-Type": "text/plain" } });
        }
        if (order.paid !== 1) {
          const receipt = cb.CallbackMetadata?.Item?.find((i) => i.Name === "MpesaReceiptNumber")?.Value;
          if (receipt) await setMpesaTransaction(order.id, String(receipt));
          await setOrderPaid(order.id, 1);
          // Re-fetch so the paid-invoice email/PDF carries the receipt number
          // captured above (the previously fetched row predates the update).
          // MUST be awaited: on Vercel serverless the event loop is frozen the
          // moment this handler returns, and an un-awaited SMTP send never
          // completes. Safaricom tolerates the extra ~2-4s before the "0".
          const fresh = (await getOrderByMpesaCheckout(cb.CheckoutRequestID)) ?? order;
          try {
            await sendPaidInvoiceEmail(fresh);
          } catch (err) {
            console.error(`[mpesa] paid invoice email failed for ${order.id}:`, (err as Error).message);
          }
        } else {
          // Order already paid (e.g. the STK-query fallback detected it first,
          // which carries no receipt number): BACKFILL the receipt from this
          // late callback so the invoice/receipt show the transaction ID.
          const receipt = cb.CallbackMetadata?.Item?.find((i) => i.Name === "MpesaReceiptNumber")?.Value;
          if (receipt && !order.mpesa_transaction_id) {
            await setMpesaTransaction(order.id, String(receipt));
            console.info(`[mpesa] backfilled receipt ${receipt} for already-paid order ${order.id}`);
          }
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