import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { getLiveBrands, saveLiveBrands } from "@/lib/brands";
import type { Brand } from "@/lib/types";

export const dynamic = "force-dynamic";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const brands = await getLiveBrands();
  return NextResponse.json({ brands });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  let body: Partial<Brand>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = (body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
  const slug = slugify((body.slug || name).trim());
  if (!slug) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });

  const brands = await getLiveBrands();
  if (brands.some((b) => b.slug === slug)) {
    return NextResponse.json({ error: `Brand slug "${slug}" already exists` }, { status: 409 });
  }

  const newBrand: Brand = {
    slug,
    name,
    tagline: (body.tagline || "").trim() || `${name} safety equipment`,
    origin: (body.origin || "").trim() || "Kenya",
    image: (body.image || "").trim() || `/images/brands/${slug}.jpg`,
  };

  const updated = [...brands, newBrand];
  await saveLiveBrands(updated);
  return NextResponse.json({ brand: newBrand }, { status: 201 });
}

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  let body: Partial<Brand> & { slug?: string; newSlug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const slug = (body.slug || "").trim();
  if (!slug) return NextResponse.json({ error: "Brand slug is required" }, { status: 400 });

  const brands = await getLiveBrands();
  const idx = brands.findIndex((b) => b.slug === slug);
  if (idx === -1) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  const existing = brands[idx];
  const newSlugRaw = (body.newSlug ?? body.slug ?? existing.slug).trim();
  const newSlug = slugify(newSlugRaw || existing.slug);
  if (newSlug !== slug && brands.some((b) => b.slug === newSlug)) {
    return NextResponse.json({ error: `Brand slug "${newSlug}" already exists` }, { status: 409 });
  }

  const updatedBrand: Brand = {
    slug: newSlug,
    name: (body.name ?? existing.name).trim() || existing.name,
    tagline: (body.tagline ?? existing.tagline).trim(),
    origin: (body.origin ?? existing.origin).trim(),
    image: (body.image ?? existing.image).trim(),
  };

  if (!updatedBrand.name) return NextResponse.json({ error: "Brand name is required" }, { status: 400 });

  const updated = [...brands];
  updated[idx] = updatedBrand;
  await saveLiveBrands(updated);
  return NextResponse.json({ brand: updatedBrand });
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { searchParams } = new URL(req.url);
  const slug = (searchParams.get("slug") || "").trim();
  if (!slug) return NextResponse.json({ error: "Brand slug is required (query ?slug=)" }, { status: 400 });

  const brands = await getLiveBrands();
  const idx = brands.findIndex((b) => b.slug === slug);
  if (idx === -1) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  const updated = brands.filter((b) => b.slug !== slug);
  await saveLiveBrands(updated);
  return NextResponse.json({ ok: true });
}
