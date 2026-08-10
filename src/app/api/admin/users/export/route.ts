import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireSuperAdmin } from "@/lib/api-helpers";
import { listOrders, listUsers } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  const [users, orders] = await Promise.all([listUsers(), listOrders()]);
  const customers = users.filter((u) => u.role === "user");

  const spendByUser = new Map<string, { orders: number; total: number }>();
  for (const o of orders) {
    if (!o.user_id) continue;
    const agg = spendByUser.get(o.user_id) ?? { orders: 0, total: 0 };
    agg.orders += 1;
    agg.total += o.paid ? o.total : 0;
    spendByUser.set(o.user_id, agg);
  }

  const rows = customers.map((u) => {
    const agg = spendByUser.get(u.id) ?? { orders: 0, total: 0 };
    return {
      Name: u.name,
      Email: u.email,
      Phone: u.phone ?? "",
      Company: u.company ?? "",
      Status: u.verified ? "Verified" : "Unverified",
      Orders: agg.orders,
      "Total Spent (KES)": agg.total,
      Joined: new Date(u.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }),
    };
  });

  rows.sort((a, b) => (b["Total Spent (KES)"] as number) - (a["Total Spent (KES)"] as number));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 24 },
    { wch: 30 },
    { wch: 18 },
    { wch: 24 },
    { wch: 12 },
    { wch: 8 },
    { wch: 16 },
    { wch: 14 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Customers");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="kimsafety-customers-${date}.xlsx"`,
    },
  });
}
