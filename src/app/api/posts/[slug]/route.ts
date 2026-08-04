export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getPostBySlug } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  return NextResponse.json({ post });
}
