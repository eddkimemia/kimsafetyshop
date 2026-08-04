import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { products } from "@/lib/data/products";
import { listAdminProducts, getAdminProduct, upsertAdminProduct, deleteAdminProduct } from "@/lib/db";

function mergedCatalog() {
  const overrides = listAdminProducts().reduce<Record<string, { data: unknown; isStatic: boolean }>>((acc, row) => {
    const data = JSON.parse(String(row.data)) as { sku: string; static?: boolean };
    acc[data.sku] = { data, isStatic: Boolean(data.static) };
    return acc;
  }, {});

  const merged = products.map((p) => {
    const override = overrides[p.sku];
    return override ? { ...p, ...(override.data as Record<string, unknown>) } : p;
  });

  const custom = listAdminProducts()
    .filter((row) => !(JSON.parse(String(row.data)) as { static?: boolean }).static)
    .map((row) => JSON.parse(String(row.data)));

  return [...merged, ...custom];
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ products: mergedCatalog() });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  let body: Record<string, unknown> & { name?: string; price?: number; sku?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.name || typeof body.price !== "number") {
    return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
  }
  const sku = body.sku?.trim() || `KS-CUS-${Math.floor(1000 + Math.random() * 9000)}`;
  if (getAdminProduct(sku)) {
    return NextResponse.json({ error: `SKU ${sku} already exists` }, { status: 409 });
  }
  const record = {
    sku,
    name: body.name,
    brand: body.brand ?? "KimSafety",
    category: body.category ?? "industrial-safety",
    categoryName: body.categoryName ?? "Industrial Safety",
    price: body.price,
    oldPrice: body.oldPrice ?? undefined,
    stock: body.stock ?? 0,
    lowStockAt: body.lowStockAt ?? 10,
    rating: body.rating ?? 4.5,
    reviews: body.reviews ?? 0,
    sold: body.sold ?? 0,
    tags: Array.isArray(body.tags) ? body.tags : ["safety"],
    description: body.description ?? "",
    features: Array.isArray(body.features) ? body.features : [],
    image: typeof body.image === "string" ? body.image : undefined,
    gallery: Array.isArray(body.gallery) ? body.gallery.filter((p): p is string => typeof p === "string") : [],
    static: false,
  };
  upsertAdminProduct(sku, record);
  return NextResponse.json({ product: record }, { status: 201 });
}

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  let body: Record<string, unknown> & { sku?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const sku = body.sku;
  if (!sku) return NextResponse.json({ error: "Missing SKU" }, { status: 400 });

  const existing = getAdminProduct(sku) ?? (products.find((p) => p.sku === sku) as unknown as Record<string, unknown>);
  if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const isStatic = Boolean((existing as { static?: boolean }).static) || Boolean(products.find((p) => p.sku === sku));
  const merged = { ...existing, ...body, sku, static: isStatic };
  delete merged.id;
  upsertAdminProduct(sku, merged);
  return NextResponse.json({ product: merged });
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const url = new URL(req.url);
  const sku = url.searchParams.get("sku");
  if (!sku) return NextResponse.json({ error: "Missing SKU" }, { status: 400 });
  const existing = getAdminProduct(sku);
  if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (existing.static) {
    return NextResponse.json({ error: "Seed products cannot be deleted — adjust stock to 0 instead" }, { status: 400 });
  }
  deleteAdminProduct(sku);
  return NextResponse.json({ ok: true });
}
