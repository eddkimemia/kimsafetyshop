import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { q1 } from "@/lib/db";
import { getCachedAdminRows } from "@/lib/catalog";
import { products } from "@/lib/data/products";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [totals, pendingOrders, customersCount, ordersCount, quotesCount, adminRows] = await Promise.all([
    q1<{ s: number }>("SELECT COALESCE(SUM(total), 0)::int AS s FROM orders WHERE status != 'Cancelled' AND paid = 1"),
    q1<{ c: number }>("SELECT COUNT(*)::int AS c FROM orders WHERE status IN ('Processing', 'In transit')"),
    q1<{ c: number }>("SELECT COUNT(*)::int AS c FROM users WHERE role = 'user'"),
    q1<{ c: number }>("SELECT COUNT(*)::int AS c FROM orders"),
    q1<{ c: number }>("SELECT COUNT(*)::int AS c FROM quotes"),
    getCachedAdminRows()
      .then((rows) => rows ?? [])
      .catch(() => [] as NonNullable<Awaited<ReturnType<typeof getCachedAdminRows>>>),
  ]);
  const adminRowsSafe = (adminRows ?? []) as NonNullable<Awaited<ReturnType<typeof getCachedAdminRows>>>;
  const lowStock = adminRowsSafe.filter((p) => {
    const data = p.data as { stock?: number; lowStockAt?: number };
    return typeof data.stock === "number" && typeof data.lowStockAt === "number" && data.stock <= data.lowStockAt;
  });
  const lowStockStatic = products.filter((p) => p.stock <= p.lowStockAt).length;

  return NextResponse.json({
    stats: {
      revenue: totals?.s ?? 0,
      orders: ordersCount?.c ?? 0,
      pendingOrders: pendingOrders?.c ?? 0,
      users: customersCount?.c ?? 0,
      quotes: quotesCount?.c ?? 0,
      lowStock: lowStock.length + lowStockStatic,
      products: products.length + adminRowsSafe.filter((p) => !(p.data as { static?: boolean }).static).length,
    },
  });
}
