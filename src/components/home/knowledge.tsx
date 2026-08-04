import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Gavel, HardHat, Flame, Hand, Layers, Clock } from "lucide-react";
import { guides } from "@/lib/data/content";
import type { Guide } from "@/lib/types";

const icons: Record<string, typeof BookOpen> = {
  helmet: HardHat,
  ppe: Layers,
  law: Gavel,
  fire: Flame,
  glove: Hand,
  height: Layers,
};

export function KnowledgeCenter() {
  return (
    <section className="bg-white py-16 lg:py-20" aria-labelledby="knowledge-heading">
      <div className="mx-auto max-w-shell px-4 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Learn with us</span>
            <h2 id="knowledge-heading" className="mt-2 font-display text-3xl font-extrabold tracking-tight text-navy-900 lg:text-4xl">
              Safety Knowledge Center
            </h2>
            <p className="mt-2 max-w-xl text-sm text-gray-500">
              Buying guides, standards, regulations and training resources written for Kenyan safety officers.
            </p>
          </div>
          <Link
            href="/knowledge"
            className="hidden items-center gap-2 rounded-xl border border-line px-5 py-2.5 text-sm font-bold text-navy-900 transition-colors hover:border-emerald-300 hover:text-emerald-700 sm:flex"
          >
            All Guides <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <GuideCard key={guide.slug} guide={guide} />
          ))}
        </div>
      </div>
    </section>
  );
}

function GuideCard({ guide }: { guide: Guide }) {
  const Icon = icons[guide.icon] ?? BookOpen;
  return (
    <Link
      href={`/knowledge/${guide.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-cardHover"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={guide.image}
          alt={guide.title}
          fill
          sizes="(max-width: 768px) 100vw, 384px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-gray-600 shadow-sm">
          <Clock className="h-3 w-3" /> {guide.readTime}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5 pt-4">
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-safety-600">
          <Icon className="h-3.5 w-3.5 text-emerald-600" /> {guide.category}
        </span>
        <h3 className="mt-1.5 font-display text-[15px] font-extrabold leading-snug text-navy-900 transition-colors group-hover:text-emerald-700">
          {guide.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-gray-500">{guide.excerpt}</p>
        <span className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
          Read guide <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
