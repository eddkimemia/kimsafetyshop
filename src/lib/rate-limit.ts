// In-process fixed-window rate limiter for public endpoints.
//
// Scope note: on Vercel serverless each instance keeps its own Map, so limits
// are per-instance rather than global — still enough to blunt spam/burst abuse.
// If stricter global limits are ever needed, swap this module for Upstash
// Redis; call sites stay identical.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Returns ok:false once an IP exceeds `limit` requests to `scope` within
 * `windowMs`. Callers respond 429 with the returned retryAfter seconds.
 */
export function rateLimit(req: Request, scope: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  // Opportunistic cleanup so the map can't grow unbounded with attacker IPs.
  if (buckets.size > MAX_KEYS) {
    for (const [k, b] of buckets) {
      if (now >= b.resetAt) buckets.delete(k);
    }
  }
  const key = `${scope}:${clientIp(req)}`;
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { ok: true, retryAfter: 0 };
}

/** Uniform 429 response used by every guarded route. */
export function tooMany(retryAfter: number): Response {
  return new Response(JSON.stringify({ error: "Too many requests — please try again shortly." }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter) },
  });
}
