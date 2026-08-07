"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, BadgePercent, FileText } from "lucide-react";
import { heroSlides } from "@/lib/data/content";
import { cn } from "@/lib/utils";

export type HeroSlide = {
  kicker: string;
  title: string;
  subtitle: string;
  cta: string;
  cta_href?: string;
  cta2: string;
  bg: string;
  card_kicker?: string;
  card_title?: string;
  card_subtitle?: string;
  stat1_label?: string;
  stat1_value?: string;
  stat2_label?: string;
  stat2_value?: string;
};

export function HeroSlider({ slides = heroSlides }: { slides?: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = slides.length;
  const next = useCallback(() => setIndex((i) => (i + 1) % Math.max(count, 1)), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % Math.max(count, 1)), [count]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [next, paused]);

  if (count === 0) return null;
  const slide = slides[index];

  return (
    <section
      className="relative overflow-hidden bg-navy-900"
      aria-label="Featured promotions"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute inset-0">
        <AnimatePresence>
          <motion.div
            key={slide.bg}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <Image
              src={slide.bg}
              alt={slide.title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/35 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent" />
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(circle_at_1px_1px,#0F2847_1px,transparent_0)] [background-size:22px_22px]" />
      <div className="pointer-events-none absolute -left-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-safety-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-shell px-4 lg:px-8">
        <div className="grid min-h-[520px] grid-cols-1 items-center gap-10 py-14 lg:min-h-[560px] lg:grid-cols-12 lg:py-20">
          <div className="relative z-10 lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-safety-500/30 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-safety-700 shadow-sm">
                  {slide.kicker}
                </span>
                <h1 className="mt-5 max-w-2xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-navy-950 sm:text-5xl lg:text-[3.4rem]">
                  {slide.title}
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-navy-900/70 sm:text-lg">
                  {slide.subtitle}
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href={slide.cta_href ?? "/search"}
                    className="group inline-flex h-13 items-center gap-2 rounded-xl bg-safety-500 px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(245,124,0,0.4)] transition-all hover:bg-safety-600 hover:shadow-[0_8px_32px_rgba(245,124,0,0.55)]"
                  >
                    {slide.cta}
                    <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/quote"
                    className="inline-flex h-13 items-center gap-2 rounded-xl bg-navy-900 px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(15,40,71,0.35)] transition-colors hover:bg-navy-950"
                  >
                    <FileText className="h-4.5 w-4.5" />
                    {slide.cta2}
                  </Link>
                </div>
                <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs font-medium text-navy-900/60">
                  <span className="flex items-center gap-2">
                    <BadgePercent className="h-4 w-4 text-safety-600" /> Bulk discounts up to 30%
                  </span>
                  <span>✓ 100% Genuine &amp; Certified</span>
                  <span>✓ 24–72h Nationwide Delivery</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative hidden lg:col-span-5 lg:block">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-safety-500/20 to-transparent blur-2xl" />
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95, rotate: -1 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative overflow-hidden rounded-[2.5rem] border border-white/20 bg-navy-900/45 backdrop-blur-md shadow-2xl"
              >
                <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:20px_20px]" />
                <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-safety-500/25 blur-3xl" />
                <div className="relative flex flex-col items-center justify-center gap-4 p-10 text-center">
                  <span className="rounded-full bg-safety-500 px-5 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
                    {slide.card_kicker || slide.kicker}
                  </span>
                  <p className="font-display text-2xl font-extrabold leading-snug text-white">
                    {slide.card_title || slide.title}
                  </p>
                  <p className="max-w-xs text-sm text-white/70">{slide.card_subtitle || slide.subtitle}</p>
                  <div className="mt-2 flex w-full items-center justify-between gap-6 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-md">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                        {slide.stat1_label ?? "Trusted by"}
                      </p>
                      <p className="font-display text-lg font-extrabold text-white">
                        {slide.stat1_value ?? "1,200+ Organizations"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                        {slide.stat2_label ?? "Delivered to"}
                      </p>
                      <p className="font-display text-lg font-extrabold text-white">
                        {slide.stat2_value ?? "47 Counties"}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-4 pb-8">
          <div className="flex items-center gap-2" role="tablist" aria-label="Hero slides">
            {slides.map((s, i) => (
              <button
                key={`${s.kicker}-${s.title}-${i}`}
                role="tab"
                aria-selected={i === index}
                aria-label={s.title}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === index ? "w-10 bg-safety-500" : "w-4 bg-navy-900/20 hover:bg-navy-900/40"
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              aria-label="Previous slide"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-navy-900/20 text-navy-900 transition-colors hover:bg-navy-900/5"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              aria-label="Next slide"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-navy-900/20 text-navy-900 transition-colors hover:bg-navy-900/5"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
