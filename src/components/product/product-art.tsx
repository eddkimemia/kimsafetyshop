"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { productImages } from "@/lib/data/product-images";
import {
  Activity,
  Anchor,
  BadgeAlert,
  Beaker,
  Building2,
  Camera,
  Cone,
  Ear,
  Eye,
  Flame,
  Gavel,
  Hand,
  HardHat,
  HeartPulse,
  Info,
  Layers,
  Lightbulb,
  Lock,
  LucideIcon,
  Microscope,
  Package,
  Plug,
  Refrigerator,
  ShieldCheck,
  Shirt,
  Sparkles,
  SprayCan,
  Thermometer,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";

const themes = [
  { bg: "from-navy-700 to-navy-900", glow: "bg-safety-500/30" },
  { bg: "from-safety-500 to-safety-700", glow: "bg-navy-900/30" },
  { bg: "from-emerald-600 to-emerald-800", glow: "bg-white/20" },
  { bg: "from-slate-600 to-slate-800", glow: "bg-safety-400/30" },
  { bg: "from-navy-600 to-safety-700", glow: "bg-emerald-400/30" },
  { bg: "from-safety-600 to-safety-900", glow: "bg-navy-900/30" },
  { bg: "from-emerald-700 to-navy-800", glow: "bg-safety-500/25" },
  { bg: "from-slate-700 to-navy-900", glow: "bg-emerald-400/25" },
];

export const artIconFor = (tags: string[], categoryName: string): LucideIcon => {
  const t = tags.join(" ");
  if (/helmet|hard.?hat/.test(t)) return HardHat;
  if (/glove/.test(t)) return Hand;
  if (/boot/.test(t)) return Layers;
  if (/vest|jacket|shirt|gown|apron|coverall/.test(t)) return Shirt;
  if (/respirator|mask/.test(t)) return ShieldCheck;
  if (/fire|extinguisher|blanket/.test(t)) return Flame;
  if (/cone|road|barrier|traffic/.test(t)) return Cone;
  if (/first.?aid|emergency|stretcher|blanket|kit/.test(t)) return HeartPulse;
  if (/medical|syringe|thermometer/.test(t)) return Thermometer;
  if (/lab|microscope|flask|chemical/.test(t)) return Microscope;
  if (/goggle|eye|sight|vision/.test(t)) return Eye;
  if (/ear|hearing|noise|muff/.test(t)) return Ear;
  if (/electrical|insulated|voltage|electric/.test(t)) return Plug;
  if (/clean|disinfect|sanit/.test(t)) return SprayCan;
  if (/marine|life.?jacket|lifebuoy|buoy|float/.test(t)) return Anchor;
  if (/cctv|camera|security/.test(t)) return Camera;
  if (/food|kitchen|cater/.test(t)) return UtensilsCrossed;
  if (/sign|label|warning|exit/.test(t)) return BadgeAlert;
  if (/tool|screwdriver|pliers|hammer/.test(t)) return Wrench;
  if (/harness|lifeline|knee|fall/.test(t)) return Lock;
  if (/detector|alarm|sensor/.test(t)) return Activity;
  if (/thermometer/.test(t)) return Thermometer;
  if (/dispenser|soap/.test(t)) return Sparkles;
  if (/fridge|cold|store/.test(t)) return Refrigerator;
  if (/lamp|light/.test(t)) return Lightbulb;
  if (/glassware|beaker/.test(t)) return Beaker;
  if (/pack|box|case/.test(t)) return Package;
  if (/school|office/.test(t)) return Building2;
  if (/government|tender/.test(t)) return Gavel;
  if (/ppe/i.test(categoryName) && /coverall|suit/.test(t)) return Shirt;
  return Info;
};

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// Admin image overrides are fetched client-side and shared across all product
// cards via this module-level cache. A stale-while-revalidate TTL keeps renders
// instant while still picking up admin edits ~30s after they're saved (a
// fetch-once-per-session cache showed OLD images indefinitely).
const OVERRIDES_TTL_MS = 30_000;
let overrideCache: { at: number; images: Record<string, string>; galleries: Record<string, string[]> } | null = null;
let overridesInflight: Promise<void> | null = null;

function loadOverrides(): Promise<void> {
  if (overrideCache && Date.now() - overrideCache.at < OVERRIDES_TTL_MS) return Promise.resolve();
  if (overridesInflight) return overridesInflight;
  overridesInflight = fetch("/api/products/image-overrides", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (d?.images) {
        overrideCache = { at: Date.now(), images: d.images, galleries: d.galleries ?? {} };
      }
    })
    .catch(() => {})
    .finally(() => {
      overridesInflight = null;
    });
  return overridesInflight;
}

export function useAdminImageOverrides(): Record<string, string> | null {
  const [map, setMap] = useState<Record<string, string> | null>(overrideCache?.images ?? null);
  useEffect(() => {
    let alive = true;
    loadOverrides().then(() => {
      if (alive && overrideCache) setMap(overrideCache.images);
    });
    return () => {
      alive = false;
    };
  }, []);
  return map;
}

export function useAdminGalleries(): Record<string, string[]> | null {
  const [map, setMap] = useState<Record<string, string[]> | null>(overrideCache?.galleries ?? null);
  useEffect(() => {
    let alive = true;
    loadOverrides().then(() => {
      if (alive && overrideCache) setMap(overrideCache.galleries);
    });
    return () => {
      alive = false;
    };
  }, []);
  return map;
}

export function productImageFor(sku: string): string {
  return overrideCache?.images[sku] ?? productImages[sku] ?? `/images/products/${sku}.jpg`;
}

export function ProductArt({
  tags = [],
  categoryName = "",
  brand = "",
  sku = "",
  name = "",
  className,
  icon,
  src,
  alt,
  sizes = "(max-width: 768px) 48vw, (max-width: 1200px) 33vw, 25vw",
  quality = 85,
}: {
  tags?: string[];
  categoryName?: string;
  brand?: string;
  sku?: string;
  name?: string;
  className?: string;
  icon?: LucideIcon;
  src?: string;
  alt?: string;
  sizes?: string;
  quality?: number;
}) {
  const [failed, setFailed] = useState(false);
  const overrides = useAdminImageOverrides();
  const Icon = icon ?? artIconFor(tags, categoryName);
  const theme = themes[hashStr(sku + brand + categoryName) % themes.length];
  const imageSrc = src ?? (sku && overrides !== null ? productImageFor(sku) : undefined);
  const defaultAlt = name
    ? `${name} — KimSafety`
    : categoryName || brand || "KimSafety product";

  useEffect(() => {
    setFailed(false);
  }, [imageSrc]);

  return (
    <div
      className={cn(
        "relative flex aspect-square w-full items-center justify-center overflow-hidden bg-gradient-to-br",
        theme.bg,
        className
      )}
    >
      {imageSrc && !failed ? (
        <Image
          src={imageSrc}
          alt={alt ?? defaultAlt}
          fill
          sizes={sizes}
          quality={quality}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <>
          <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />
          <div
            className={cn(
              "pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl",
              theme.glow
            )}
          />
          <div
            className={cn(
              "pointer-events-none absolute -bottom-20 -left-14 h-56 w-56 rounded-full blur-3xl",
              theme.glow
            )}
          />
          <Icon className="relative h-1/3 w-1/3 text-white/90 drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]" strokeWidth={1.4} />
        </>
      )}
      <span className="pointer-events-none absolute right-3 top-3 font-mono text-[9px] tracking-widest text-white/50">
        {sku || ""}
      </span>
    </div>
  );
}
