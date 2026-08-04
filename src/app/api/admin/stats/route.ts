import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { getDb, listOrders, listQuotes, listUsers, listAdminProducts } from "@/lib/db";
import { products } from "@/lib/data/products";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const db = getDb();
  const totals = db.prepare("SELECT COALESCE(SUM(total), 0) AS s FROM orders WHERE status != 'Cancelled'").get() as { s: number };
  const pendingOrders = db.prepare("SELECT COUNT(*) AS c FROM orders WHERE status IN ('Processing', 'In transit')").get() as { c: number };
  const lowStock = listAdminProducts().filter((p) => {
    const data = p.data as { stock?: number; lowStockAt?: number };
    return typeof data.stock === "number" && typeof data.lowStockAt === "number" && data.stock <= data.lowStockAt;
  });
  const lowStockStatic = products.filter((p) => p.stock <= p.lowStockAt).length;

  return NextResponse.json({
    stats: {
      revenue: totals.s,
      orders: listOrders().length,
      pendingOrders: pendingOrders.c,
      users: listUsers().length,
      quotes: listQuotes().length,
      lowStock: lowStock.length + lowStockStatic,
      products: products.length + listAdminProducts().filter((p) => !(p.data as { static?: boolean }).static).length,
    },
  });
}
