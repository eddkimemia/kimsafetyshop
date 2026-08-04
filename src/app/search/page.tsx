import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogView } from "@/components/catalog/catalog-view";

export const metadata: Metadata = {
  title: "Shop All Safety Equipment",
  description:
    "Browse KimSafety's full catalogue — certified PPE, medical, fire, road, lab and emergency safety equipment with bulk pricing.",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogView title="All Safety Products" />
    </Suspense>
  );
}

function CatalogSkeleton() {
  return (
    <div className="bg-surface pb-20">
      <div className="relative overflow-hidden bg-navy-900">
        <div className="mx-auto max-w-shell px-4 py-14 lg:px-8 lg:py-16">
          <div className="h-4 w-40 animate-pulse rounded bg-white/20" />
          <div className="mt-3 h-9 w-72 animate-pulse rounded-lg bg-white/20" />
        </div>
      </div>
      <div className="mx-auto grid max-w-shell grid-cols-2 gap-5 px-4 pt-6 sm:grid-cols-3 lg:grid-cols-4 lg:px-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
