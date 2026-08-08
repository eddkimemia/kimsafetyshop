import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdmin } from "@/lib/api-helpers";
import { mergedCatalog } from "@/lib/admin-products";

export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const products = (await mergedCatalog()) as {
    sku: string;
    name: string;
    brand: string;
    category: string;
    categoryName: string;
    price: number;
    oldPrice?: number;
    stock: number;
    lowStockAt: number;
    rating?: number;
    reviews?: number;
    sold?: number;
    tags?: string[];
    description?: string;
    image?: string;
    static?: boolean;
  }[];

  const rows = products.map((p) => ({
    SKU: p.sku,
    "Product Name": p.name,
    Brand: p.brand,
    Category: p.categoryName,
    "Category ID": p.category,
    "Price (KES)": p.price,
    "Old Price (KES)": p.oldPrice ?? "",
    "Stock Quantity": p.stock,
    "Low Stock At": p.lowStockAt,
    Rating: p.rating ?? "",
    Reviews: p.reviews ?? "",
    "Units Sold": p.sold ?? "",
    Type: p.static ? "Seed" : "Custom",
    Tags: Array.isArray(p.tags) ? p.tags.join(", ") : "",
    Description: p.description ?? "",
    "Image URL": p.image ?? "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 14 },
    { wch: 42 },
    { wch: 14 },
    { wch: 20 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 8 },
    { wch: 8 },
    { wch: 10 },
    { wch: 8 },
    { wch: 30 },
    { wch: 60 },
    { wch: 40 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="kimsafety-products-${date}.xlsx"`,
    },
  });
}
