import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, ImageIcon, Tag } from "lucide-react";

export type CampaignCard = {
  id: number;
  name: string;
  slug: string;
  description: string;
  discount_label: string;
  image: string | null;
  cta_href: string;
  start_date: string | null;
  end_date: string | null;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatRange(start: string | null, end: string | null): string {
  if (!start && !end) return "All year";
  const fmt = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return `${d} ${MONTHS[(m ?? 1) - 1] ?? ""}${y ? `, ${y}` : ""}`;
  };
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  return end ? `Until ${fmt(end)}` : "All year";
}

export function CampaignStrip({ campaigns }: { campaigns: CampaignCard[] }) {
  if (campaigns.length === 0) return null;
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-shell px-4 py-10 lg:px-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-safety-600">
              <Tag className="h-3.5 w-3.5" /> Promotions
            </span>
            <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-navy-900">
              Seasonal Deals
            </h2>
          </div>
          <Link href="/deals" className="flex items-center gap-1.5 text-xs font-bold text-safety-600 hover:text-safety-700">
            View all deals <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={c.cta_href}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-navy-900 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-soft"
            >
              {c.image ? (
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-navy-700 to-navy-900">
                  <ImageIcon className="h-8 w-8 text-white/40" />
                  <p className="px-6 text-center text-xs font-bold uppercase tracking-widest text-white/70">Promotion</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/25 to-transparent" />
              {c.discount_label && (
                <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-safety-500 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                  <Tag className="h-3 w-3" /> {c.discount_label}
                </span>
              )}
              <div className="absolute inset-x-4 bottom-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900/75 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                    <CalendarDays className="h-3.5 w-3.5 text-safety-400" /> {formatRange(c.start_date, c.end_date)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-safety-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all group-hover:gap-2 group-hover:bg-safety-600">
                    Shop now <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
