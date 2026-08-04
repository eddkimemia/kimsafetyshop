import Link from "next/link";
import { ArrowRight, BadgePercent } from "lucide-react";

export function DealsBanner() {
  return (
    <section className="bg-white pb-16 lg:pb-20" aria-label="Deals">
      <div className="mx-auto max-w-shell px-4 lg:px-8">
        <Link
          href="/deals"
          className="group relative block overflow-hidden rounded-3xl bg-gradient-to-r from-navy-900 via-navy-800 to-safety-700"
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.1] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:20px_20px]" />
          <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-safety-500/30 blur-3xl" />
          <div className="relative flex flex-col items-start gap-6 p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-danger px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
                <BadgePercent className="h-3.5 w-3.5" /> Limited time
              </span>
              <h2 className="mt-4 font-display text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                Safety Week Mega Sale
                <br className="hidden sm:block" /> Up to 35% off bulk orders
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Helmets, gloves, boots, respirators & first aid — while stock lasts.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm">
                Ends Sunday
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl bg-safety-500 px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(245,124,0,0.4)] transition-all group-hover:bg-safety-400">
                Shop Deals <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
