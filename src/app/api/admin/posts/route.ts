import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { sanitizePostHtml } from "@/lib/blog";
import { listPosts, getPostBySlug, createPost, updatePost, deletePost, type PostInput } from "@/lib/db";
import { slugify } from "@/lib/utils";

function parseBody(body: unknown): PostInput | null {
  const b = body as Partial<PostInput> & { title?: string; content?: string };
  if (!b || typeof b !== "object") return null;
  const title = String(b.title ?? "").trim();
  if (!title) return null;
  const slug = String(b.slug ?? "").trim().toLowerCase() || slugify(title);
  return {
    slug: slugify(slug),
    title,
    category: String(b.category ?? "News").trim() || "News",
    excerpt: String(b.excerpt ?? "").trim().slice(0, 300),
    content: sanitizePostHtml(String(b.content ?? "")),
    cover: typeof b.cover === "string" && b.cover ? b.cover : null,
    author: String(b.author ?? "KimSafety Team").trim() || "KimSafety Team",
    read_time: String(b.read_time ?? "5 min read").trim() || "5 min read",
    published: b.published !== false,
  };
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const posts = listPosts(true).map((p) => ({ ...p, published: Boolean(p.published) }));
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const input = parseBody(body);
  if (!input) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (getPostBySlug(input.slug, true)) {
    return NextResponse.json({ error: `Slug "${input.slug}" already exists` }, { status: 409 });
  }
  const post = createPost(input);
  return NextResponse.json({ post }, { status: 201 });
}

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const b = body as { slug?: string };
  const slug = b?.slug;
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  const input = parseBody(body);
  if (!input) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  const conflict = getPostBySlug(input.slug, true);
  if (conflict && conflict.slug !== slug) {
    return NextResponse.json({ error: `Slug "${input.slug}" already exists` }, { status: 409 });
  }
  const post = updatePost(slug, input);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  return NextResponse.json({ post: { ...post, published: Boolean(post.published) } });
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  deletePost(slug);
  return NextResponse.json({ ok: true });
}
