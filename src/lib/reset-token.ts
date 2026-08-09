import { createHmac, timingSafeEqual } from "crypto";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET (or AUTH_SECRET) is required for password reset tokens");
  return s;
}

const b64url = (buf: Buffer) => buf.toString("base64url");

/** Create a signed, expiring reset token for a user id. No DB storage required. */
export function createResetToken(userId: string, ttlMs = RESET_TTL_MS): string {
  const payload = b64url(Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + ttlMs })));
  const sig = createHmac("sha256", secret()).update(payload).digest();
  return `${payload}.${b64url(sig)}`;
}

/** Verify a reset token and return the user id, or null when invalid/expired. */
export function verifyResetToken(token: string): string | null {
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
    };
    if (!data.uid || typeof data.exp !== "number" || Date.now() > data.exp) return null;
    return data.uid;
  } catch {
    return null;
  }
}
