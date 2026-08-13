import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { mergedGuides } from "@/lib/knowledge";
import { getAdminGuide, upsertAdminGuide, deleteAdminGuide } from "@/lib/db";
import { sendContentNewsletter } from "@/lib/newsletter-send";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ guides: await mergedGuides() });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  let body: Record<string, unknown> & { title?: string; slug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const title = body.title?.trim();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  const slug = body.slug?.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (await getAdminGuide(slug)) {
    return NextResponse.json({ error: `Guide "${slug}" already exists` }, { status: 409 });
  }
  const record = {
    slug,
    title,
    category: body.category ?? "Guide",
    readTime: body.readTime ?? "5 min read",
    excerpt: body.excerpt ?? "",
    content: body.content ?? "",
    icon: body.icon ?? "info",
    image: body.image ?? "",
    static: false,
  };
  await upsertAdminGuide(slug, record);
  // A new knowledge guide is live immediately — mail it to subscribers.
  sendContentNewsletter({
    slug,
    title,
    excerpt: String(record.excerpt ?? ""),
    content: String(record.content ?? ""),
    cover: typeof record.image === "string" && record.image ? record.image : null,
    kind: "knowledge",
  }).catch((err) => console.error("[content] newsletter hook failed:", err));
  return NextResponse.json({ guide: record }, { status: 201 });
}

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  let body: Record<string, unknown> & { slug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const slug = body.slug;
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  const existing = (await getAdminGuide(slug)) ?? (await mergedGuides()).find((g) => g.slug === slug) as unknown as Record<string, unknown>;
  if (!existing) return NextResponse.json({ error: "Guide not found" }, { status: 404 });
  // `static` comes from the DB record only — checking membership in
  // mergedGuides() is always true (it includes admin-created guides too) and
  // would stamp every guide as a seed guide, blocking deletion.
  const isStatic = Boolean((existing as { static?: boolean }).static);
  const merged = { ...existing, ...body, slug, static: isStatic };
  await upsertAdminGuide(slug, merged);
  return NextResponse.json({ guide: merged });
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  const existing = await getAdminGuide(slug);
  if (!existing) return NextResponse.json({ error: "Guide not found" }, { status: 404 });
  if (existing.static) {
    return NextResponse.json({ error: "Seed guides cannot be deleted" }, { status: 400 });
  }
  await deleteAdminGuide(slug);
  return NextResponse.json({ ok: true });
}
