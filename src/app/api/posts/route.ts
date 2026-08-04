export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { listPosts } from "@/lib/db";

export async function GET() {
  const posts = listPosts().map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    category: p.category,
    excerpt: p.excerpt,
    cover: p.cover,
    author: p.author,
    read_time: p.read_time,
    created_at: p.created_at,
  }));
  return NextResponse.json({ posts });
}
