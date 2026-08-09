import { NextResponse } from "next/server";
import { liveCatalog, liveGetBySlug } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (slug) {
    const product = await liveGetBySlug(slug);
    return NextResponse.json({ products: product ? [product] : [] });
  }
  return NextResponse.json({ products: await liveCatalog() });
}
