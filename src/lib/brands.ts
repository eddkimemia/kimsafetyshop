import { brands as staticBrands } from "@/lib/data/catalog";
import { products as staticProducts } from "@/lib/data/products";
import { getSetting, setSetting } from "@/lib/db";
import type { Brand } from "@/lib/types";

const BRANDS_KEY = "brands_data";
const CACHE_TTL_MS = 60 * 1000;
let cached: { at: number; brands: Brand[] } | null = null;

function isValidBrand(b: unknown): b is Brand {
  if (!b || typeof b !== "object") return false;
  const o = b as Record<string, unknown>;
  return (
    typeof o.slug === "string" &&
    !!o.slug.trim() &&
    typeof o.name === "string" &&
    !!o.name.trim() &&
    typeof o.tagline === "string" &&
    typeof o.origin === "string" &&
    typeof o.image === "string"
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getLiveBrands(): Promise<Brand[]> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_TTL_MS) return cached.brands;
  let base: Brand[];
  try {
    const raw = await getSetting(BRANDS_KEY);
    if (!raw) {
      base = [...staticBrands];
    } else {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        base = [...staticBrands];
      } else {
        const filtered = parsed.filter(isValidBrand);
        base = filtered.length > 0 ? filtered : [...staticBrands];
      }
    }
  } catch {
    base = [...staticBrands];
  }

  // Ensure every brand that appears in products exists in the brand list,
  // otherwise the brands page misses brands that have products (e.g. KimSafety, Jua Kali, HIVIEW, Sandak).
  const existingNames = new Set(base.map((b) => b.name.toLowerCase()));
  const existingSlugs = new Set(base.map((b) => b.slug));
  for (const p of staticProducts) {
    const name = (p.brand || "").trim();
    if (!name || existingNames.has(name.toLowerCase())) continue;
    const slug = slugify(name);
    if (!slug) continue;
    let uniqueSlug = slug;
    let n = 1;
    while (existingSlugs.has(uniqueSlug)) {
      uniqueSlug = `${slug}-${n}`;
      n++;
    }
    base.push({
      slug: uniqueSlug,
      name,
      tagline: `${name} safety equipment`,
      origin: "Kenya",
      image: `/images/brands/${uniqueSlug}.jpg`,
    });
    existingNames.add(name.toLowerCase());
    existingSlugs.add(uniqueSlug);
  }

  cached = { at: now, brands: base };
  return base;
}

export async function saveLiveBrands(brands: Brand[]): Promise<void> {
  const clean = brands.filter(isValidBrand).map((b) => ({
    slug: slugify(b.slug || b.name),
    name: b.name.trim(),
    tagline: (b.tagline || "").trim(),
    origin: (b.origin || "").trim(),
    image: (b.image || "").trim(),
  }));
  // Ensure unique slugs
  const seen = new Set<string>();
  const deduped: Brand[] = [];
  for (const b of clean) {
    let s = b.slug;
    let n = 1;
    while (seen.has(s)) {
      s = `${b.slug}-${n}`;
      n++;
    }
    seen.add(s);
    deduped.push({ ...b, slug: s });
  }
  await setSetting(BRANDS_KEY, JSON.stringify(deduped));
  cached = { at: Date.now(), brands: deduped };
}

export function invalidateBrandsCache() {
  cached = null;
}

export async function getLiveBrand(slug: string): Promise<Brand | undefined> {
  const all = await getLiveBrands();
  return all.find((b) => b.slug === slug);
}
