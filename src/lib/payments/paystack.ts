import { createHmac } from "crypto";

// Paystack — card payments via hosted checkout + webhook confirmation.
//
// Configuration via environment variables:
//   PAYSTACK_SECRET_KEY                     (required; test keys end in _test_...)
//   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY         (optional; only needed for inline JS)
//   PAYSTACK_API_BASE                       (optional; default https://api.paystack.co)

const BASE = process.env.PAYSTACK_API_BASE || "https://api.paystack.co";

export function paystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY || "";
  if (!key) throw new Error("Paystack is not configured — set PAYSTACK_SECRET_KEY");
  return key;
}

export async function paystackInitialize(input: {
  email: string;
  amount: number;
  reference: string;
  callbackUrl: string;
}): Promise<{ authorizationUrl: string; reference: string }> {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      amount: Math.round(input.amount * 100),
      reference: input.reference,
      callback_url: input.callbackUrl,
    }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    message?: string;
    data?: { authorization_url?: string; reference?: string };
  };
  if (!json.status || !json.data?.authorization_url) {
    throw new Error(json.message || `Paystack initialization failed (${res.status})`);
  }
  return { authorizationUrl: json.data.authorization_url, reference: json.data.reference ?? input.reference };
}

export async function paystackVerify(reference: string): Promise<{ paid: boolean; status: string | null; amount: number | null; transactionId: string | null }> {
  const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
  });
  const json = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    data?: { status?: string; amount?: number; id?: number | string };
  };
  const tx = json.data;
  return {
    paid: json.status === true && tx?.status === "success",
    status: tx?.status ?? null,
    amount: tx?.amount ?? null,
    transactionId: tx?.id !== undefined ? String(tx.id) : null,
  };
}

/** Verifies the x-paystack-signature HMAC-SHA512 over the raw webhook body. */
export function verifyPaystackWebhook(body: string, signature: string): boolean {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || !signature) return false;
  const hmac = createHmac("sha512", key).update(body).digest("hex");
  return hmac === signature;
}
