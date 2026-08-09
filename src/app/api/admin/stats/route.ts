import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { q1, listOrders, listQuotes } from "@/lib/db";
import { getCachedAdminRows } from "@/lib/catalog";
import { products } from "@/lib/data/products";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const totals = await q1<{ s: number }>("SELECT COALESCE(SUM(total), 0)::int AS s FROM orders WHERE status != 'Cancelled'");
  const pendingOrders = await q1<{ c: number }>("SELECT COUNT(*)::int AS c FROM orders WHERE status IN ('Processing', 'In transit')");
  const customersCount = await q1<{ c: number }>("SELECT COUNT(*)::int AS c FROM users WHERE role = 'user'");
  const [orders, quotes, adminRows] = await Promise.all([
    listOrders().catch(() => [] as Awaited<ReturnType<typeof listOrders>>),
    listQuotes().catch(() => [] as Awaited<ReturnType<typeof listQuotes>>),
    getCachedAdminRows().then((rows) => rows ?? []),
  ]);
  const lowStock = adminRows.filter((p) => {
    const data = p.data as { stock?: number; lowStockAt?: number };
    return typeof data.stock === "number" && typeof data.lowStockAt === "number" && data.stock <= data.lowStockAt;
  });
  const lowStockStatic = products.filter((p) => p.stock <= p.lowStockAt).length;

  return NextResponse.json({
    stats: {
      revenue: totals?.s ?? 0,
      orders: orders.length,
      pendingOrders: pendingOrders?.c ?? 0,
      users: customersCount?.c ?? 0,
      quotes: quotes.length,
      lowStock: lowStock.length + lowStockStatic,
      products: products.length + adminRows.filter((p) => !(p.data as { static?: boolean }).static).length,
    },
  });
}
