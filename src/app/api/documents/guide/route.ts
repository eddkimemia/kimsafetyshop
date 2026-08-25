export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { mergedGuides } from "@/lib/knowledge";
import { buildGuidePdf } from "@/lib/guide-pdf";
import { rateLimit, tooMany } from "@/lib/rate-limit";

const SAFE_SLUG = /^[a-z0-9-]+$/i;

/**
 * Public, visitor-facing branded PDF for a knowledge-center guide:
 * GET /api/documents/guide?slug=how-to-choose-safety-helmets
 */
export async function GET(req: Request) {
  const rl = rateLimit(req, "guide-pdf", 20, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const { searchParams } = new URL(req.url);
  const slug = (searchParams.get("slug") || "").trim();
  if (!slug || !SAFE_SLUG.test(slug)) {
    return NextResponse.json({ error: "Missing or invalid slug" }, { status: 400 });
  }

  const guides = await mergedGuides();
  const guide = guides.find((g) => g.slug === slug);
  if (!guide) return NextResponse.json({ error: "Guide not found" }, { status: 404 });

  const buffer = await buildGuidePdf({
    slug: guide.slug,
    title: guide.title,
    category: guide.category,
    readTime: guide.readTime,
    excerpt: guide.excerpt,
    image: guide.image || undefined,
    content: guide.content || undefined,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="kimsafety-guide-${slug}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
