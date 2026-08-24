/**
 * Central error monitoring scaffold.
 *
 * Today this is a structured wrapper around `console.error` that emits
 * JSON-friendly logs Vercel can index, with optional Sentry forwarding when
 * `SENTRY_DSN` (or `NEXT_PUBLIC_SENTRY_DSN`) is set.  To get full Sentry
 * tracing, install `@sentry/nextjs` and call `Sentry.init({ dsn: ... })` in
 * `next.config.mjs` / `instrumentation.ts` — this module will auto-forward
 * via `Sentry.captureException` when available, without requiring code changes
 * at call sites.
 *
 * Usage:
 *   import { logError, logWarn } from "@/lib/monitor";
 *   logError("mpesa.callback", err, { orderId });
 */

type Extra = Record<string, unknown>;

function hasSentry(): boolean {
  return Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
}

// Lazy try — Sentry is optional and not a hard dependency.
function trySentryCapture(err: unknown, extra: Extra & { context: string }) {
  if (!hasSentry()) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require("@sentry/nextjs") as { captureException?: (e: unknown, ctx?: unknown) => void };
    if (Sentry?.captureException) {
      Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
        tags: { context: extra.context },
        extra,
      });
    }
  } catch {
    // Sentry not installed — silently ignore.
  }
}

export function logError(context: string, err: unknown, extra: Extra = {}) {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  // Structured log for Vercel Log Drains / Datadog / etc.
  console.error(JSON.stringify({ level: "error", context, message, stack, ...extra, ts: new Date().toISOString() }));
  trySentryCapture(err, { context, ...extra });
}

export function logWarn(context: string, message: string, extra: Extra = {}) {
  console.warn(JSON.stringify({ level: "warn", context, message, ...extra, ts: new Date().toISOString() }));
}

export function logInfo(context: string, message: string, extra: Extra = {}) {
  console.log(JSON.stringify({ level: "info", context, message, ...extra, ts: new Date().toISOString() }));
}
