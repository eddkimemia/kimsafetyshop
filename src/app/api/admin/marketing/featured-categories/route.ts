import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api-helpers";
import { getFeaturedCategories, saveFeaturedCategories, type FeaturedCategory } from "@/lib/db";
import { categories } from "@/lib/data/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireSuperAdmin();
  if (denied) return denied;
  const items = await getFeaturedCategories();
  return NextResponse.json({
    items,
    categories: categories.map((c) => ({ slug: c.slug, name: c.name })),
  });
}

export async function POST(req: Request) {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  let body: { items?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: "items must be an array" }, { status: 400 });
  }

  const validSlugs = new Set(categories.map((c) => c.slug));
  const items: FeaturedCategory[] = [];
  for (const raw of body.items as Record<string, unknown>[]) {
    if (!raw || typeof raw !== "object") {
      return NextResponse.json({ error: "Invalid featured category item" }, { status: 400 });
    }
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    const category = typeof raw.category === "string" ? raw.category : "";
    const image = typeof raw.image === "string" ? raw.image.trim() : "";
    const caption = typeof raw.caption === "string" ? raw.caption : "";
    if (!name) {
      return NextResponse.json({ error: "Every featured category needs a display name" }, { status: 400 });
    }
    if (!validSlugs.has(category)) {
      return NextResponse.json({ error: `Unknown category: ${category}` }, { status: 400 });
    }
    items.push({ name, caption, image, category, sort: items.length });
  }

  await saveFeaturedCategories(items);
  return NextResponse.json({ ok: true, items });
}
