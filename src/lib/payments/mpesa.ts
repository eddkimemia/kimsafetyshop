// M-Pesa Daraja API — Lipa Na M-Pesa Online (STK push).
//
// Configuration via environment variables:
//   MPESA_ENV=sandbox|production        (default: sandbox)
//   MPESA_CONSUMER_KEY                  (sandbox default below)
//   MPESA_CONSUMER_SECRET               (sandbox default below)
//   MPESA_PASSKEY                       (sandbox default below)
//   MPESA_SHORTCODE                     (sandbox default 174379)
//   MPESA_CALLBACK_URL                  (optional; defaults to /api/payments/mpesa/callback)
//
// The sandbox defaults are Safaricom's publicly documented sandbox test
// credentials. In production you MUST set MPESA_ENV=production and your own
// app's consumer key/secret/passkey/shortcode.
//
// Sandbox note: STK push only works against the test number 254708374149.

const SANDBOX_BASE = "https://sandbox.safaricom.co.ke";
const PROD_BASE = "https://api.safaricom.co.ke";

const SANDBOX_DEFAULTS = {
  consumerKey: "9v38Daj5QuvApXBx8rgFh9dXk1pM7k9X",
  consumerSecret: "POjCz4tZQ5b0w2aJ",
  passkey: "bfb279f9aa9bdbcf158e97dd9a467552e2d03e4b0f9b3e8f5f0a0b3a9c6f0c0b0",
  shortcode: "174379",
};

/** Minimum gap between STK pushes to the same order (no push-spam while waiting). */
export const MPESA_COOLDOWN_MS = 30_000;
/** Hard cap on STK push attempts per order — after this, contact support. */
export const MPESA_MAX_ATTEMPTS = 5;

type MpesaConfig = {
  env: string;
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  shortcode: string;
};

function config(): MpesaConfig {
  const env = process.env.MPESA_ENV || "sandbox";
  const sandbox = env !== "production";
  return {
    env,
    baseUrl: sandbox ? SANDBOX_BASE : PROD_BASE,
    consumerKey: process.env.MPESA_CONSUMER_KEY || (sandbox ? SANDBOX_DEFAULTS.consumerKey : ""),
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || (sandbox ? SANDBOX_DEFAULTS.consumerSecret : ""),
    passkey: process.env.MPESA_PASSKEY || (sandbox ? SANDBOX_DEFAULTS.passkey : ""),
    shortcode: process.env.MPESA_SHORTCODE || (sandbox ? SANDBOX_DEFAULTS.shortcode : ""),
  };
}

export function mpesaConfigured(): boolean {
  const c = config();
  return Boolean(c.consumerKey && c.consumerSecret && c.passkey && c.shortcode);
}

/**
 * Absolute URL Safaricom should POST the STK result to. Override with
 * MPESA_CALLBACK_URL (must be publicly reachable — e.g. an ngrok URL while
 * testing locally); defaults to this site's /api/payments/mpesa/callback.
 */
export function mpesaCallbackUrl(siteUrlBase: string): string {
  const override = process.env.MPESA_CALLBACK_URL?.trim();
  return override || `${siteUrlBase}/api/payments/mpesa/callback`;
}

let tokenCache: { token: string; at: number } | null = null;

async function getToken(): Promise<string> {
  const c = config();
  if (tokenCache && Date.now() - tokenCache.at < 50 * 60 * 1000) return tokenCache.token;
  const auth = Buffer.from(`${c.consumerKey}:${c.consumerSecret}`).toString("base64");
  const res = await fetch(`${c.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  const json = (await res.json().catch(() => ({}))) as { access_token?: string; errorMessage?: string };
  if (!res.ok || !json.access_token) {
    throw new Error(json.errorMessage || `M-Pesa token request failed (${res.status})`);
  }
  tokenCache = { token: json.access_token, at: Date.now() };
  return json.access_token;
}

/** Converts 07XX XXX XXX / +254… into 2547XXXXXXXXX. */
export function normalizeMpesaPhone(phone: string): string {
  let p = phone.replace(/[^\d]/g, "");
  if (p.startsWith("0")) p = "254" + p.slice(1);
  else if (p.startsWith("254")) p = p;
  else p = "254" + p;
  return p;
}

/**
 * Actively asks Daraja for the status of an STK push (transaction status query).
 * Used as a FALLBACK when the webhook-style callback never arrives (dead tunnel,
 * misconfigured callback URL, network hiccup): the checkout screen polls
 * /api/orders/status, which calls this — so a completed payment is detected
 * even without the callback.
 */
export async function mpesaQueryCheckout(
  checkoutId: string
): Promise<{ paid: boolean; resultCode: string | null; resultDesc: string | null }> {
  const c = config();
  if (!mpesaConfigured() || !checkoutId) {
    return { paid: false, resultCode: null, resultDesc: "M-Pesa not configured" };
  }
  const token = await getToken();
  const ts = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);
  const password = Buffer.from(`${c.shortcode}${c.passkey}${ts}`).toString("base64");
  const res = await fetch(`${c.baseUrl}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: c.shortcode,
      Password: password,
      Timestamp: ts,
      CheckoutRequestID: checkoutId,
    }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    ResultCode?: string;
    ResultDesc?: string;
    errorMessage?: string;
  };
  return {
    // ResultCode "0" === the customer completed the payment.
    paid: String(json.ResultCode) === "0",
    resultCode: json.ResultCode != null ? String(json.ResultCode) : null,
    resultDesc: json.ResultDesc || json.errorMessage || null,
  };
}

export async function mpesaStkPush(input: {
  phone: string;
  amount: number;
  accountRef: string;
  callbackUrl: string;
}): Promise<{ checkoutId: string; merchantId: string }> {
  const c = config();
  if (!mpesaConfigured()) {
    throw new Error("M-Pesa is not configured — set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY and MPESA_SHORTCODE");
  }
  const token = await getToken();
  const ts = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);
  const password = Buffer.from(`${c.shortcode}${c.passkey}${ts}`).toString("base64");
  const phone = normalizeMpesaPhone(input.phone);

  const res = await fetch(`${c.baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: c.shortcode,
      Password: password,
      Timestamp: ts,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(input.amount),
      PartyA: phone,
      PartyB: c.shortcode,
      PhoneNumber: phone,
      CallBackURL: input.callbackUrl,
      AccountReference: input.accountRef.slice(0, 12),
      TransactionDesc: `KimSafety order ${input.accountRef}`,
    }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    ResponseCode?: string;
    ResponseDescription?: string;
    CheckoutRequestID?: string;
    MerchantRequestID?: string;
    errorMessage?: string;
  };
  if (!res.ok || json.ResponseCode !== "0" || !json.CheckoutRequestID) {
    throw new Error(json.ResponseDescription || json.errorMessage || `M-Pesa STK push failed (${res.status})`);
  }
  return { checkoutId: json.CheckoutRequestID, merchantId: json.MerchantRequestID ?? "" };
}
