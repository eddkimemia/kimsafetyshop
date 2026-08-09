import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, Clock, ClipboardList, BookOpen } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { guides } from "@/lib/data/content";
import { mergedGuides, sanitizeGuideHtml } from "@/lib/knowledge";
import { liveCatalog } from "@/lib/catalog";
import { ProductCard } from "@/components/product/product-card";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const guide = guides.find((g) => g.slug === params.slug);
  return {
    title: guide ? `${guide.title} — KimSafety Knowledge` : "Guide not found",
    description: guide?.excerpt,
    alternates: { canonical: guide ? `/knowledge/${guide.slug}` : undefined },
    openGraph: {
      title: guide ? `${guide.title} — KimSafety Knowledge` : undefined,
      description: guide?.excerpt,
      type: "article",
      url: guide ? `/knowledge/${guide.slug}` : undefined,
      images: guide ? [{ url: guide.image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: guide ? `${guide.title} — KimSafety Knowledge` : undefined,
      description: guide?.excerpt,
      images: guide ? [guide.image] : undefined,
    },
  };
}

export default async function GuidePage({ params }: { params: { slug: string } }) {
  const allGuides = await mergedGuides();
  const guide = allGuides.find((g) => g.slug === params.slug);
  if (!guide) return notFound();

  const hasEditorContent = Boolean(guide.content?.trim());
  const sections = guideBody();
  const recommendations = (await liveCatalog()).filter((p) => p.featured).slice(0, 4);
  const moreGuides = allGuides.filter((g) => g.slug !== guide.slug).slice(0, 4);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.excerpt,
    image: guide.image ?? `${siteUrl}/og-image.jpg`,
    dateModified: new Date().toISOString(),
    author: { "@type": "Organization", name: "KimSafety HSE Team" },
    publisher: { "@type": "Organization", name: "KimSafety", url: siteUrl },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/knowledge/${guide.slug}`,
    },
    inLanguage: "en-KE",
  };

  return (
    <div className="bg-surface pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className="border-b border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
          <nav className="mb-6 text-xs text-gray-400" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5">
              <li><Link href="/" className="hover:text-navy-900">Home</Link></li>
              <li>/</li>
              <li><Link href="/knowledge" className="hover:text-navy-900">Knowledge Center</Link></li>
              <li>/</li>
              <li className="font-semibold text-navy-900" aria-current="page">{guide.title}</li>
            </ol>
          </nav>

          <span className="text-xs font-bold uppercase tracking-widest text-safety-600">{guide.category}</span>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight text-navy-900 lg:text-4xl">
            {guide.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {guide.readTime}</span>
            <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Updated July 2026</span>
            <span>By the KimSafety HSE Team</span>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 pt-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <article className="min-w-0">
          {guide.image ? (
            <div className="overflow-hidden rounded-3xl border border-line shadow-card">
              <Image
                src={guide.image}
                alt={guide.title}
                width={1200}
                height={600}
                priority
                sizes="(max-width: 1024px) 100vw, 768px"
                className="aspect-[16/8] w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-[16/8] items-center justify-center rounded-3xl bg-gradient-to-br from-navy-800 to-navy-900 shadow-card">
              <BookOpen className="h-14 w-14 text-safety-500" />
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-card">
            <p className="text-[15px] leading-relaxed text-gray-600">{guide.excerpt}</p>
          </div>

          {hasEditorContent ? (
            <div
              className="blog-prose mt-8 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-10"
              dangerouslySetInnerHTML={{ __html: sanitizeGuideHtml(guide.content ?? "") }}
            />
          ) : (
            <div className="mt-8 space-y-10">
            {sections.map((section, i) => (
              <section key={i}>
                <h2 className="font-display text-xl font-extrabold text-navy-900">{section.heading}</h2>
                <p className="mt-3 leading-relaxed text-gray-600">{section.body}</p>
                {section.points && (
                  <ul className="mt-4 space-y-2.5">
                    {section.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-600">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-safety-500" />
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
                {section.table && (
                  <div className="mt-5 overflow-hidden rounded-2xl border border-line">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-navy-900 text-left text-white">
                          {section.table[0].map((h) => (
                            <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.slice(1).map((row, r) => (
                          <tr key={r} className={r % 2 === 0 ? "bg-white" : "bg-surface"}>
                            {row.map((cell, c) => (
                              <td key={c} className="px-4 py-3 text-gray-600">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}
          </div>
          )}

          <div className="mt-12 rounded-2xl bg-gradient-to-br from-navy-800 to-navy-900 p-8 text-white">
            <h2 className="font-display text-xl font-extrabold">Need certified equipment to implement this?</h2>
            <p className="mt-2 text-sm text-white/60">
              Our specialists will help you select the right products and pricing for your team.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-xl bg-safety-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-safety-600"
              >
                Shop Safety Equipment <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://wa.me/254715135141"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/20"
              >
                <WhatsAppIcon className="h-4 w-4" /> Ask a Specialist
              </a>
            </div>
          </div>
        </article>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-navy-900">
              <BookOpen className="h-4.5 w-4.5 text-emerald-600" /> More guides
            </h2>
            <div className="mt-4 space-y-4">
              {moreGuides.map((g) => (
                <Link key={g.slug} href={`/knowledge/${g.slug}`} className="group flex gap-3">
                  <span className="relative flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-navy-900">
                    {g.image ? (
                      <Image
                        src={g.image}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                      />
                    ) : (
                      <BookOpen className="h-5 w-5 text-safety-500" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">{g.category}</span>
                    <span className="mt-1 block line-clamp-2 text-[13px] font-bold leading-snug text-navy-900 transition-colors group-hover:text-emerald-700">
                      {g.title}
                    </span>
                    <span className="mt-1 block text-[11px] text-gray-400">{g.readTime}</span>
                  </span>
                </Link>
              ))}
            </div>
            <Link
              href="/knowledge"
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              All guides <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-navy-800 to-navy-900 p-5 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-safety-500">
              <ClipboardList className="h-5 w-5" />
            </span>
            <h2 className="mt-3 font-display text-base font-extrabold">Outfitting a team?</h2>
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
        </aside>
      </div>

      <section className="mx-auto max-w-shell px-4 pt-14 lg:px-8">
        <h2 className="mb-6 font-display text-2xl font-extrabold text-navy-900">Recommended products</h2>
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {recommendations.map((p) => (
            <ProductCard key={p.id} product={p} compact />
          ))}
        </div>
      </section>
    </div>
  );
}

function guideBody(): { heading: string; body: string; points?: string[]; table?: string[][] }[] {
  return [
    {
      heading: "Why this matters",
      body: `Every Kenyan workplace is bound by the Occupational Safety and Health Act, 2007. Under Section 6, employers must provide — free of charge — suitable protective equipment and ensure it is properly used and maintained. This guide translates the requirements into a practical purchasing plan.`,
      points: [
        "Non-compliance risks fines, stop-work orders and liability in the event of injury.",
        "Buying certified equipment protects both the worker and the organization's legal position.",
        "Correct selection and fit are as important as the equipment itself.",
      ],
    },
    {
      heading: "Key selection criteria",
      body: `Selection starts with a hazard assessment of the task, environment and worker. The table below shows the common hazards and the corresponding protective equipment to budget for.`,
      table: [
        ["Hazard", "Required protection", "Typical standard"],
        ["Impact / falling objects", "Safety helmet (EN 397)", "EN 397"],
        ["Chemical splash", "Goggles or face shield (EN 166)", "EN 166"],
        ["Noise above 85 dB", "Ear muffs or plugs (SNR 31)", "EN 352"],
        ["Falling from height", "Full-body harness (EN 361)", "EN 361"],
        ["Cuts & abrasions", "Gloves (EN 388)", "EN 388"],
        ["Electrical work", "Insulated gloves & tools", "IEC 60900"],
      ],
    },
    {
      heading: "Budgeting for compliance",
      body: `A realistic PPE budget should include inspection, replacement and training costs — typically 15–25% above the purchase price. KimSafety's bulk pricing tiers make full-team outfitting predictable and cost-effective.`,
      points: [
        "Tier 1 (1–9 units): standard pricing",
        "Tier 2 (10–49 units): 5% discount",
        "Tier 3 (50–199 units): 9% discount",
        "Tier 4 (200+ units): 13%+ discount, negotiable",
      ],
    },
  ];
}
