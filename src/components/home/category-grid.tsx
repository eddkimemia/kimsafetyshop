import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { categories } from "@/lib/data/catalog";

const spotlight: [string, string, string, string][] = [
  ["Helmets", "Construction Helmets.jpg", "Construction Helmets", "construction-safety"],
  ["Gloves", "Assorted Industrial Gloves.jpg", "Assorted Industrial Gloves", "ppe"],
  ["Safety Boots", "HIVIEW SAFETY BOOT HTS4101.jpeg", "Hiview Safety Boot", "industrial-safety"],
  ["Reflective Jackets", "Reflector Jackets.png", "Reflector Jackets", "road-safety"],
  ["Respirators", "Double Respirator Mask (NP306).jpg", "Double Respirator Mask", "ppe"],
  ["First Aid Kits", "Medium Clear First Aid Kit.jpg", "Medium First Aid Kit", "emergency-response"],
  ["Fire Extinguishers", "6KG DRY POWDER FIRE EXTINGUISHER.jpg", "6kg Dry Powder Extinguisher", "fire-safety"],
  ["Ladders", "12 STEP RED EDITION MULTIPURPOSE ALUMINIUM LADDER 3.7M.jpg", "Multipurpose Aluminium Ladder", "tools"],
  ["Medical Gloves", "Latex Powdered Medical Examination Gloves.jpg", "Medical Exam Gloves", "medical-safety"],
  ["Stretchers", "Folding Canvas Stretcher.jpg", "Folding Canvas Stretcher", "emergency-response"],
  ["Safety Goggles", "PROTECTA CHEMICAL SAFETY GOGGLES.jpg", "Protecta Safety Goggles", "industrial-safety"],
  ["Ear Protection", "KRICKWOOD EAR MUFFS.jpg", "Krickwood Ear Muffs", "ppe"],
];

export function CategoryGrid() {
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
          {spotlight.map(([name, img, caption, cat]) => (
            <Link
              key={name as string}
              href={`/category/${cat}`}
              className="group overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-cardHover"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                <Image
                  src={`/images/products/${encodeURIComponent(img)}`}
                  alt={caption}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="font-display text-sm font-extrabold text-navy-900 group-hover:text-safety-600">
                  {name}
                </h3>
                <p className="mt-0.5 truncate text-[11px] text-gray-400">{caption}</p>
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
