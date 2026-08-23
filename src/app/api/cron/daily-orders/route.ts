import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { listOrdersCreatedBetween } from "@/lib/db";
import { liveCatalog } from "@/lib/catalog";
import { sendDailyOrdersEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const KENYA_OFFSET_MS = 3 * 60 * 60 * 1000;
const DEFAULT_TO = "edwinkimemia21@gmail.com";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function kenyaDateLabel(d: Date): string {
  const k = new Date(d.getTime() + KENYA_OFFSET_MS);
  return `${k.getDate()} ${MONTHS[k.getUTCMonth()]} ${k.getUTCFullYear()}`;
}

function kenyaTimestamp(d: string): string {
  const k = new Date(new Date(d).getTime() + KENYA_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${k.getUTCFullYear()}-${pad(k.getUTCMonth() + 1)}-${pad(k.getUTCDate())} ${pad(k.getUTCHours())}:${pad(k.getUTCMinutes())}`;
}

/**
 * Sends the "orders placed today" summary to the owner at 11:00 PM Kenya time.
 *
 * Scheduled via vercel.json cron: "0 20 * * *" (UTC) = 23:00 EAT (UTC+3).
 * Auth: ONLY the `Authorization: Bearer $CRON_SECRET` token Vercel injects on
 * cron invocations when CRON_SECRET is set. The `x-vercel-cron` header is
 * spoofable by any caller and is NOT accepted — set CRON_SECRET in Vercel env.
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

  // "Today" in the Kenyan calendar runs 21:00 UTC (yesterday) → until now.
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - KENYA_OFFSET_MS);
  const orders = await listOrdersCreatedBetween(start.toISOString(), now.toISOString());
  const dateLabel = kenyaDateLabel(now);

  const catalog = await liveCatalog();
  const nameOf = (productId: string) => catalog.find((p) => p.id === productId)?.name ?? productId;

  const rows = orders.map((o) => {
    const items = JSON.parse(o.items) as { productId: string; qty: number; name?: string }[];
    // Prefer the item name captured on the order; live catalog is a fallback.
    const summary = items.filter((i) => i.qty > 0).map((i) => `${i.qty}× ${i.name || nameOf(i.productId)}`).join(", ");
    return {
      "Order": o.id,
      "Date (EAT)": kenyaTimestamp(o.created_at),
      "Customer": o.name,
      "Company": o.company ?? "",
      "Email": o.email,
      "Phone": o.phone,
      "Payment": o.payment,
      "Status": o.paid === 1 ? "Paid" : "Unpaid",
      "Fulfilment": o.status,
      "Items": summary,
      "Subtotal (KES)": o.subtotal,
      "Discount (KES)": o.discount,
      "Delivery (KES)": o.shipping,
      "Total (KES)": o.total,
      "Address": o.address,
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ "Order": "(no orders today)" }]);
  ws["!cols"] = [
    { wch: 10 }, { wch: 18 }, { wch: 24 }, { wch: 20 }, { wch: 26 }, { wch: 15 }, { wch: 9 },
    { wch: 8 }, { wch: 12 }, { wch: 60 }, { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 12 }, { wch: 44 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Orders");
  const xlsx = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const paidCount = orders.filter((o) => o.paid === 1).length;

  const to = process.env.DAILY_ORDERS_EMAIL || DEFAULT_TO;
  await sendDailyOrdersEmail({ to, dateLabel, orderCount: orders.length, paidCount, revenue, xlsx });

  return NextResponse.json({ ok: true, sent: to, date: dateLabel, orders: orders.length });
}