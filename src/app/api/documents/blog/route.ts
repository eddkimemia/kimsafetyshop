export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPostBySlug } from "@/lib/db";
import { buildBlogPostPdf } from "@/lib/blog-pdf";
import { rateLimit, tooMany } from "@/lib/rate-limit";

const SAFE_SLUG = /^[a-z0-9-]+$/i;

/**
 * Public, visitor-facing branded PDF for a blog article:
 * GET /api/documents/blog?slug=how-to-choose-safety-helmets
 */
export async function GET(req: Request) {
  const rl = rateLimit(req, "blog-pdf", 20, 60_000);
  if (!rl.ok) return tooMany(rl.retryAfter);

  const { searchParams } = new URL(req.url);
  const slug = (searchParams.get("slug") || "").trim();
  if (!slug || !SAFE_SLUG.test(slug)) {
    return NextResponse.json({ error: "Missing or invalid slug" }, { status: 400 });
  }

  const post = await getPostBySlug(slug);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const buffer = await buildBlogPostPdf({
    slug: post.slug,
    title: post.title,
    category: post.category,
    author: post.author,
    readTime: post.read_time,
    dateIso: post.created_at,
    excerpt: post.excerpt,
    cover: post.cover || undefined,
    content: post.content || undefined,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="kimsafety-blog-${slug}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
