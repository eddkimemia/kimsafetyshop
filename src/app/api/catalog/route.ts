import { NextResponse } from "next/server";
import { liveCatalog, liveGetBySlug } from "@/lib/catalog";

// Fully dynamic: the merged catalog is memoized in-process for 5s (catalog.ts
// TTL) and busted instantly on admin saves, so an extra HTTP caching layer
// here only ever served STALE prices/images to the browser. no-store keeps
// every storefront fetch honest.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (slug) {
    const product = await liveGetBySlug(slug);
    return NextResponse.json(
      { products: product ? [product] : [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
  return NextResponse.json(
    { products: await liveCatalog() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
