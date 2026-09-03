import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";
import { categories } from "@/lib/data/catalog";
import { getFeaturedCategories } from "@/lib/db";
import fs from "fs";
import path from "path";

function hasImageFile(image: string): boolean {
  if (!image) return false;
  if (image.startsWith("/api/uploads/") || image.startsWith("/uploads/") || image.startsWith("/documents/")) return true;
  if (image.startsWith("/images/")) {
    const full = path.join(process.cwd(), "public", image.replace(/^\//, "").split("?")[0]);
    try {
      return fs.existsSync(decodeURIComponent(full));
    } catch {
      return false;
    }
  }
  if (image.startsWith("http")) return true;
  return false;
}

export async function CategoryGrid() {
  const spotlight = await getFeaturedCategories();
  return (
    <section className="bg-surface py-16 lg:py-20" aria-labelledby="categories-heading">
      <div className="mx-auto max-w-shell px-4 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-safety-600">Browse the catalogue</span>
            <h2 id="categories-heading" className="mt-2 font-display text-3xl font-extrabold tracking-tight text-navy-900 lg:text-4xl">
              Featured Categories
            </h2>
          </div>
          <Link
            href="/search"
            className="hidden items-center gap-2 rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-bold text-navy-900 transition-colors hover:border-safety-300 hover:text-safety-600 sm:flex"
          >
            All Categories <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {spotlight.map((item) => (
            <Link
              key={item.category + item.name}
              href={`/category/${item.category}`}
              className="group overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-cardHover"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center">
                {item.image && hasImageFile(item.image) ? (
                  (() => {
                    const clean = item.image.split("?")[0];
                    const isUpload = clean.startsWith("/api/uploads/") || clean.startsWith("/uploads/") || clean.startsWith("/documents/");
                    return (
                      <Image
                        src={item.image}
                        alt={item.caption || item.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                        quality={85}
                        unoptimized={isUpload}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    );
                  })()
                ) : (
                  <Tag className="h-10 w-10 text-white/80" />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-display text-sm font-extrabold text-navy-900 group-hover:text-safety-600">
                  {item.name}
                </h3>
                <p className="mt-0.5 truncate text-[11px] text-gray-400">{item.caption}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.slice(0, 8).map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 transition-colors hover:border-safety-300 hover:bg-safety-50"
            >
              <span className="text-sm font-semibold text-navy-900">{c.name}</span>
              <ArrowRight className="ml-auto h-3.5 w-3.5 text-gray-300 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
