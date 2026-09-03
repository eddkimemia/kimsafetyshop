import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getLiveBrands } from "@/lib/brands";
import fs from "fs";
import path from "path";

function hasLogoFile(image: string): boolean {
  if (!image) return false;
  if (image.startsWith("/api/uploads/")) return true;
  if (image.startsWith("/images/")) {
    const full = path.join(process.cwd(), "public", image.replace(/^\//, ""));
    try {
      return fs.existsSync(full);
    } catch {
      return false;
    }
  }
  if (image.startsWith("http")) return true;
  return false;
}

export async function BrandStrip() {
  const allBrands = await getLiveBrands();
  // Show all brands that have a logo file (static or uploaded) — user asked "show all with logo"
  const brandsWithLogo = allBrands.filter((b) => hasLogoFile(b.image));
  const brands = brandsWithLogo.length > 0 ? brandsWithLogo : allBrands;
  // Fallback to all if every brand somehow has no logo file
  const loop = brands.length > 0 ? [...brands, ...brands] : [];

  return (
    <section className="border-y border-line bg-surface py-14" aria-label="Shop by brand">
      <div className="mx-auto max-w-shell px-4 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-safety-600">Authorized stockists</span>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-navy-900 lg:text-3xl">
              Shop by Brand
            </h2>
          </div>
          <Link
            href="/brands"
            className="hidden items-center gap-2 text-sm font-bold text-navy-900 transition-colors hover:text-safety-600 sm:flex"
          >
            All brands <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <div className="relative overflow-hidden" aria-hidden>
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-surface to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-surface to-transparent" />
        <div className="flex w-max animate-marquee gap-4 hover:[animation-play-state:paused]">
          {loop.map((brand, i) => (
            <Link
              key={`${brand.slug}-${i}`}
              href={`/brands/${brand.slug}`}
              className="flex h-20 w-36 items-center justify-center rounded-2xl border border-line bg-white px-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-safety-300 hover:shadow-cardHover"
              title={brand.name}
            >
              <span className="relative h-14 w-full">
                {hasLogoFile(brand.image) ? (
                  (() => {
                    const clean = brand.image.split("?")[0];
                    const isUpload = clean.startsWith("/api/uploads/") || clean.startsWith("/uploads/") || clean.startsWith("/documents/");
                    return (
                      <Image
                        src={brand.image}
                        alt={`${brand.name} logo`}
                        fill
                        sizes="144px"
                        unoptimized={isUpload}
                        className="object-contain"
                      />
                    );
                  })()
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-center text-xs font-bold text-navy-900">
                    {brand.name}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
