import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { mergedGuides } from "@/lib/knowledge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Safety Knowledge Center",
  description:
    "Buying guides, safety standards, PPE selection and Kenyan workplace regulations — free resources for safety officers and facility managers.",
};

export default function KnowledgePage() {
  const guides = mergedGuides();
  return (
    <div className="bg-surface pb-20">
      <PageHeader
        bg="/images/hero/hero2.jpg"
        eyebrow="Learn with us"
        title="Safety Knowledge Center"
        subtitle="Practical guides on buying, standards and compliance — written for Kenyan safety officers, procurement teams and facility managers."
      />
      <div className="mx-auto max-w-shell px-4 pt-8 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/knowledge/${guide.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-cardHover"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                {guide.image ? (
                  <Image
                    src={guide.image}
                    alt={guide.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 384px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-800 to-navy-900">
                    <BookOpen className="h-10 w-10 text-safety-500" />
                  </div>
                )}
                <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-gray-600 shadow-sm">
                  {guide.readTime}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6 pt-4">
                <span className="text-[11px] font-bold uppercase tracking-widest text-safety-600">{guide.category}</span>
                <h2 className="mt-1.5 font-display text-base font-extrabold leading-snug text-navy-900 transition-colors group-hover:text-emerald-700">
                  {guide.title}
                </h2>
                <p className="mt-2 line-clamp-3 flex-1 text-[13px] leading-relaxed text-gray-500">{guide.excerpt}</p>
                <span className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  Read guide <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
