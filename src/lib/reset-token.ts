import { createHmac, timingSafeEqual } from "crypto";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET (or AUTH_SECRET) is required for password reset tokens");
  return s;
}

const b64url = (buf: Buffer) => buf.toString("base64url");

/**
 * Fingerprint of the current password hash — embedded in the reset token so a
 * token is automatically invalidated once the password changes (single-use
 * within its 1-hour TTL without any DB storage).
 */
function passwordFingerprint(passwordHash: string): string {
  // HMAC with the app secret so the fingerprint cannot be reversed to the hash.
  return createHmac("sha256", secret()).update(passwordHash).digest("base64url").slice(0, 16);
}

/** Create a signed, expiring reset token for a user id. No DB storage required. */
export function createResetToken(userId: string, ttlMs = RESET_TTL_MS): string {
  // Legacy overload — prefer the password-bound version below.
  const payload = b64url(Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + ttlMs })));
  const sig = createHmac("sha256", secret()).update(payload).digest();
  return `${payload}.${b64url(sig)}`;
}

/** Create a password-bound reset token — becomes invalid once the password changes (single-use). */
export function createPasswordResetToken(userId: string, passwordHash: string, ttlMs = RESET_TTL_MS): string {
  const payload = b64url(
    Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + ttlMs, ph: passwordFingerprint(passwordHash) }))
  );
  const sig = createHmac("sha256", secret()).update(payload).digest();
  return `${payload}.${b64url(sig)}`;
}

/** Verify a reset token and return the user id, or null when invalid/expired. */
export function verifyResetToken(token: string): string | null {
  const parsed = verifyResetTokenWithFingerprint(token);
  return parsed ? parsed.uid : null;
}

/** Verify signature+expiry and return uid plus the embedded fingerprint (if present). */
export function verifyResetTokenWithFingerprint(token: string): { uid: string; ph?: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      uid?: string;
      exp?: number;
      ph?: string;
    };
    if (!data.uid || typeof data.exp !== "number" || Date.now() > data.exp) return null;
    return { uid: data.uid, ph: data.ph };
  } catch {
    return null;
  }
}

/** Check that a token's embedded fingerprint matches the user's current password hash. */
export function isResetTokenFingerprintValid(tokenFingerprint: string | undefined, currentPasswordHash: string): boolean {
  if (!tokenFingerprint) return false; // old tokens without fingerprint are rejected — request a fresh one
  const expected = passwordFingerprint(currentPasswordHash);
  // constant-time compare
  const a = Buffer.from(tokenFingerprint);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// ---------------------------------------------------------------------------
// Email-verification tokens — same stateless HMAC scheme, longer TTL and a
// distinct purpose tag so one kind of link can never be replayed as the other.
// ---------------------------------------------------------------------------

const VERIFY_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

function createSignedToken(userId: string, ttlMs: number, purpose: string): string {
  const payload = b64url(Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + ttlMs, p: purpose })));
  const sig = createHmac("sha256", secret()).update(payload).digest();
  return `${payload}.${b64url(sig)}`;
}

function verifySignedToken(token: string, purpose: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      uid?: string;
      exp?: number;
      p?: string;
    };
    if (!data.uid || typeof data.exp !== "number" || Date.now() > data.exp) return null;
    if (data.p !== purpose) return null;
    return data.uid;
  } catch {
    return null;
  }
}

/** Signed, expiring email-verification token for a user id. No DB storage. */
export function createVerifyToken(userId: string): string {
  return createSignedToken(userId, VERIFY_TTL_MS, "verify");
}

/** Verify an email-verification token and return the user id, or null. */
export function verifyVerifyToken(token: string): string | null {
  return verifySignedToken(token, "verify");
}
