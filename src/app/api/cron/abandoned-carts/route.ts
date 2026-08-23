import { NextResponse } from "next/server";
import { listAbandonedCartsToRemind, markAbandonedCartReminded } from "@/lib/db";
import { liveGetProduct, liveGetBySlug } from "@/lib/catalog";
import { bulkUnitPrice } from "@/lib/utils";
import { sendAbandonedCartEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Abandoned-cart recovery — emails shoppers whose checkout stalled with items
 * still in the cart. Scheduled daily via vercel.json (11:00 EAT). Auth is the
 * same bearer token as the daily-orders cron: ONLY `Authorization: Bearer
 * $CRON_SECRET`; the spoofable `x-vercel-cron` header is not accepted.
 *
 * One reminder per abandoned cart (reminded_at set after a successful send).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron] CRON_SECRET is not set — refusing to run. Set it in Vercel env.");
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Remind about carts idle for at least 24 hours.
  const carts = await listAbandonedCartsToRemind(24 * 60 * 60 * 1000);
  let sent = 0;
  for (const cart of carts) {
    try {
      const parsed = JSON.parse(cart.items) as { productId?: string; slug?: string; qty?: number }[];
      const rows: { name: string; qty: number; price: number }[] = [];
      let total = 0;
      for (const item of parsed.slice(0, 15)) {
        const qty = Math.max(1, Math.floor(Number(item.qty) || 1));
        const product =
          (item.productId ? await liveGetProduct(item.productId) : undefined) ??
          (item.slug ? await liveGetBySlug(item.slug) : undefined);
        if (!product || product.stock <= 0) continue; // don't advertise sold-out stock
        const price = bulkUnitPrice(product, qty);
        total += price * qty;
        rows.push({ name: product.name, qty, price });
      }
      if (rows.length === 0) {
        // Nothing purchasable left — retire the reminder silently.
        await markAbandonedCartReminded(cart.id);
        continue;
      }
      const ok = await sendAbandonedCartEmail({ to: cart.email, name: cart.name, items: rows, total: Math.round(total) });
      if (ok) sent += 1;
    } catch (err) {
      console.error(`[cron] abandoned-cart email failed for ${cart.email}:`, (err as Error).message);
    }
    await markAbandonedCartReminded(cart.id);
  }
  return NextResponse.json({ ok: true, carts: carts.length, emailed: sent });
}
