export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getOrderByMpesaCheckout, setMpesaTransaction } from "@/lib/db";

type ResultParam = { Key?: string; Value?: unknown };

/**
 * Async result receiver for Daraja's Transaction Status API
 * (ResultURL configured in src/lib/payments/mpesa.ts).
 *
 * When a receipt lookup is queued, Safaricom POSTs the final result here.
 * We match the order via ConversationID / OriginatorConversationID / Occasion
 * (all set to the CheckoutRequestID) and backfill mpesa_transaction_id with
 * the REAL M-Pesa receipt number (e.g. TB17CVOCY9).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      Result?: {
        ResultType?: number;
        ResultCode?: number | string;
        ResultDesc?: string;
        OriginatorConversationID?: string;
        ConversationID?: string;
        TransactionID?: string;
        ResultParameters?: { ResultParameter?: ResultParam[] | ResultParam };
      };
    };

    const result = body.Result;
    const checkoutId =
      result?.ConversationID ||
      result?.OriginatorConversationID ||
      undefined;

    if (!checkoutId) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Ignored: no conversation id" });
    }

    const paramsRaw = result?.ResultParameters?.ResultParameter;
    const params: ResultParam[] = Array.isArray(paramsRaw) ? paramsRaw : paramsRaw ? [paramsRaw] : [];
    const byKey = new Map<string, unknown>();
    for (const p of params) if (p?.Key) byKey.set(p.Key, p.Value);

    const ok = String(result?.ResultCode ?? "1") === "0";
    const receipt =
      (byKey.get("MpesaReceiptNumber") != null ? String(byKey.get("MpesaReceiptNumber")) : null) ??
      // Some environments echo the receipt as TransactionID on success.
      (ok && result?.TransactionID && /^[A-Z0-9]{8,15}$/i.test(result.TransactionID) ? result.TransactionID : null);

    if (!ok || !receipt) {
      console.info(`[mpesa] transaction-status result for ${checkoutId}: code=${result?.ResultCode} — no receipt to backfill`);
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
    }

    const order = await getOrderByMpesaCheckout(checkoutId);
    if (!order) {
      console.warn(`[mpesa] result for unknown checkout ${checkoutId}`);
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
    }
    if (!order.mpesa_transaction_id) {
      await setMpesaTransaction(order.id, receipt);
      console.info(`[mpesa] backfilled receipt ${receipt} for ${order.id} via async result`);
    }
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (err) {
    console.error("[mpesa] result handler error:", err);
    // Always ACK so Daraja doesn't retry forever.
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
  }
}
