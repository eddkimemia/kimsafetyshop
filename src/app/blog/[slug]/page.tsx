import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, User, ClipboardList, TrendingUp, Tag } from "lucide-react";
import { getPostBySlug, listPosts } from "@/lib/db";
import { liveCatalog } from "@/lib/catalog";
import { formatKES, discountPercent } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { ProductArt } from "@/components/product/product-art";
import { ProductCard } from "@/components/product/product-card";
import { BlogNewsletter } from "@/components/blog/blog-newsletter";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: "Post not found" };
  const images = post.cover ? [{ url: post.cover, alt: post.title }] : [{ url: "/og-image.jpg", width: 1200, height: 630, alt: post.title }];
  return {
    title: `${post.title} — KimSafety Blog`,
    description: post.excerpt.slice(0, 160),
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: `${post.title} — KimSafety Blog`,
      description: post.excerpt.slice(0, 160),
      type: "article",
      url: `/blog/${post.slug}`,
      publishedTime: post.created_at,
      authors: post.author ? [post.author] : undefined,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} — KimSafety Blog`,
      description: post.excerpt.slice(0, 160),
      images,
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return notFound();

  const recent = (await listPosts())
    .filter((p) => p.slug !== post.slug)
    .slice(0, 4);

  const catalogProducts = await liveCatalog();

  const deals = (() => {
    const onSale: { product: Product; oldPrice: number }[] = [];
    for (const p of catalogProducts) {
      if (p.oldPrice != null && p.price < p.oldPrice) onSale.push({ product: p, oldPrice: p.oldPrice });
    }
    onSale.sort(
      (a, b) =>
        (discountPercent(b.product.price, b.oldPrice) ?? 0) - (discountPercent(a.product.price, a.oldPrice) ?? 0)
    );
    return onSale.slice(0, 4);
  })();

  const recommended = catalogProducts
    .filter((p) => p.featured)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 4);

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.cover ?? `${siteUrl}/og-image.jpg`,
    datePublished: post.created_at,
    dateModified: post.updated_at ?? post.created_at,
    author: { "@type": "Organization", name: post.author || "KimSafety" },
    publisher: { "@type": "Organization", name: "KimSafety", url: siteUrl },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${post.slug}`,
    },
    inLanguage: "en-KE",
  };

  return (
    <div className="bg-surface pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <div className="border-b border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
          <nav className="mb-6 text-xs text-gray-400" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5">
              <li><Link href="/" className="hover:text-navy-900">Home</Link></li>
              <li>/</li>
              <li><Link href="/blog" className="hover:text-navy-900">Blog</Link></li>
              <li>/</li>
              <li className="font-semibold text-navy-900" aria-current="page">{post.title}</li>
            </ol>
          </nav>
          <span className="mt-4 inline-block rounded-full bg-safety-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-safety-700">
            {post.category}
          </span>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-extrabold leading-tight tracking-tight text-navy-900 lg:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-gray-400">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> {post.author}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" /> {formatDate(post.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {post.read_time}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 pt-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <div className="min-w-0">
          {post.cover && (
            <div className="relative mb-8 aspect-[16/8] overflow-hidden rounded-3xl border border-line shadow-card">
              <Image src={post.cover} alt={post.title} fill priority sizes="(max-width: 1024px) 100vw, 768px" className="object-cover" />
            </div>
          )}

          <article className="rounded-3xl border border-line bg-white p-6 shadow-card lg:p-10">
            {post.excerpt && (
              <p className="mb-6 border-l-4 border-safety-500 pl-4 text-base font-medium leading-relaxed text-navy-900/80">
                {post.excerpt}
              </p>
            )}
            <div
              className="blog-prose"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            {!post.content && (
              <p className="py-10 text-center text-sm text-gray-400">This article has no body content yet.</p>
            )}
          </article>

          {recommended.length > 0 && (
            <section className="mt-12">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-safety-600">Recommended</span>
                  <h2 className="mt-1 font-display text-xl font-extrabold text-navy-900">
                    Products for this article
                  </h2>
                </div>
                <Link href="/search" className="hidden items-center gap-1.5 text-xs font-bold text-safety-600 hover:text-safety-700 sm:flex">
                  Shop all <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {recommended.map((p) => (
                  <ProductCard key={p.id} product={p} compact />
                ))}
              </div>
            </section>
          )}

          {recent.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-5 flex items-center gap-2 font-display text-xl font-extrabold text-navy-900">
                <TrendingUp className="h-5 w-5 text-safety-500" /> Latest articles
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {recent.map((p) => (
                  <Link
                    key={p.id}
                    href={`/blog/${p.slug}`}
                    className="group flex gap-4 rounded-2xl border border-line bg-white p-3.5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover"
                  >
                    <span className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-line bg-navy-900">
                      {p.cover ? (
                        <Image src={p.cover} alt="" fill sizes="96px" className="object-cover transition-transform duration-300 group-hover:scale-[1.05]" />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center font-display text-xl font-black text-white/40">K</span>
                      )}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-safety-600">{p.category}</span>
                      <span className="mt-1 line-clamp-2 text-[13px] font-bold leading-snug text-navy-900 transition-colors group-hover:text-safety-600">
                        {p.title}
                      </span>
                      <span className="mt-auto text-[11px] text-gray-400">
                        {formatShortDate(p.created_at)} · {p.read_time}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          {deals.length > 0 && (
            <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-navy-900">
                <Tag className="h-4.5 w-4.5 text-danger" /> Deals & discounts
              </h2>
              <div className="mt-4 space-y-4">
                {deals.map(({ product: p, oldPrice }) => (
                  <Link key={p.id} href={`/product/${p.slug}`} className="group flex gap-3">
                    <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
                      <ProductArt
                        tags={p.tags}
                        categoryName={p.categoryName}
                        brand={p.brand}
                        sku={p.sku}
                        className="h-full w-full"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-[13px] font-bold leading-snug text-navy-900 transition-colors group-hover:text-safety-600">
                        {p.name}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-navy-900">{formatKES(p.price)}</span>
                        <span className="text-[11px] text-gray-400 line-through">{formatKES(oldPrice)}</span>
                        <span className="rounded-full bg-danger px-1.5 py-0.5 text-[9px] font-bold text-white">
                          -{discountPercent(p.price, oldPrice)}%
                        </span>
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
              <Link
                href="/search?sort=price"
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-danger/5 py-2.5 text-xs font-bold text-danger transition-colors hover:bg-danger/10"
              >
                View all deals <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
              </Link>
            </div>
          )}

          <div className="rounded-2xl bg-gradient-to-br from-navy-800 to-navy-900 p-5 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-safety-500">
              <ClipboardList className="h-5 w-5" />
            </span>
            <h2 className="mt-3 font-display text-base font-extrabold">Buying for a team?</h2>
            <p className="mt-1 text-xs leading-relaxed text-white/65">
              Get tiered bulk pricing, negotiated corporate rates and tender-ready documentation.
            </p>
            <Link
              href="/quote"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-safety-500 py-2.5 text-xs font-bold text-white transition-colors hover:bg-safety-600"
            >
              Request a Quotation
            </Link>
          </div>

          <BlogNewsletter />
        </aside>
      </div>
    </div>
  );
}
