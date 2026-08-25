import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, CalendarDays, User, Newspaper } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { listPosts } from "@/lib/db";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog — Safety News & Insights in Kenya | KimSafety",
  description:
    "Safety news, product updates, compliance insights and practical tips from the KimSafety team. PPE, fire safety & Kenyan workplace regulations.",
  keywords: ["KimSafety blog", "safety news Kenya", "PPE insights", "workplace safety Kenya"],
  alternates: { canonical: `${siteUrl}/blog` },
  openGraph: {
    title: "Blog — Safety News & Insights — KimSafety Kenya",
    description: "Product updates, workplace safety tips & compliance news from KimSafety's HSE specialists.",
    type: "website",
    url: `${siteUrl}/blog`,
    siteName: "KimSafety",
    images: [{ url: `${siteUrl}/og-image.jpg`, width: 1200, height: 630, alt: "KimSafety Blog" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — Safety News & Insights — KimSafety Kenya",
    description: "Safety news & practical tips from KimSafety.",
    images: [`${siteUrl}/og-image.jpg`],
  },
};

export default async function BlogPage() {
  const posts = await listPosts();

  return (
    <div className="bg-surface pb-20">
      <PageHeader
        bg="/images/hero/hero2.jpg"
        eyebrow="KimSafety Blog"
        title="Safety News & Insights"
        subtitle="Product updates, workplace safety tips, compliance news and practical advice from our HSE and product specialists."
      />

      <div className="mx-auto max-w-shell px-4 pt-8 lg:px-8">
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-14 text-center shadow-card">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-safety-50 text-safety-600">
              <Newspaper className="h-7 w-7" />
            </span>
            <h2 className="font-display text-lg font-extrabold text-navy-900">No posts yet</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
              Articles published from the admin panel will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-cardHover"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-navy-700 to-navy-900">
                  {post.cover ? (
                    <Image
                      src={post.cover}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Newspaper className="h-10 w-10 text-white/40" />
                    </div>
                  )}
                  <span className="absolute left-4 top-4 rounded-full bg-safety-500 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                    {post.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-400">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {new Date(post.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {post.read_time}
                    </span>
                  </div>
                  <h2 className="mt-2 font-display text-base font-extrabold leading-snug text-navy-900 transition-colors group-hover:text-safety-600">
                    {post.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 flex-1 text-[13px] leading-relaxed text-gray-500">
                    {post.excerpt}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400">
                      <User className="h-3 w-3" /> {post.author}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-safety-600">
                      Read <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
