import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogView } from "@/components/catalog/catalog-view";
import { categories } from "@/lib/data/catalog";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const category = categories.find((c) => c.slug === params.slug);
  if (!category) return { title: "Category not found" };
  return {
    title: `${category.name} Equipment`,
    description: category.description,
    openGraph: {
      title: `${category.name} — KimSafety Kenya`,
      description: category.description,
    },
  };
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const category = categories.find((c) => c.slug === params.slug);
  if (!category) return notFound();
  return (
    <Suspense fallback={null}>
      <CatalogView
        title={`${category.name} Equipment`}
        subtitle={category.description}
        category={category.slug}
      />
    </Suspense>
  );
}
