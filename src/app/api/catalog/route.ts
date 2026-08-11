import { NextResponse } from "next/server";
import { liveCatalog, liveGetBySlug } from "@/lib/catalog";

// The merged catalog is already memoized in-process for 5s (catalog.ts TTL);
// caching the HTTP response for the same window means the storefront's
// per-page catalog fetch never hits the server or database twice within 5s.
export const revalidate = 5;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (slug) {
    const product = await liveGetBySlug(slug);
    return NextResponse.json({ products: product ? [product] : [] });
  }
  return NextResponse.json({ products: await liveCatalog() });
}
