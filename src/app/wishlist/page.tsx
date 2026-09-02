"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Heart, Trash2, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { ProductCard } from "@/components/product/product-card";
import { PageHeader } from "@/components/layout/page-header";

export default function WishlistPage() {
  const { wishlist, toggleWishlist, liveProduct } = useStore();
  const items = wishlist.map((id) => liveProduct(id)).filter(Boolean);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 bg-surface px-4 py-24 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-card">
          <Heart className="h-10 w-10 text-gray-300" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-navy-900">Your wishlist is empty</h1>
        <p className="max-w-sm text-sm text-gray-500">
          Save products you&apos;re interested in and we&apos;ll alert you when prices drop.
        </p>
        <Link
          href="/search"
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-safety-500 px-8 py-3.5 text-sm font-bold text-white hover:bg-safety-600"
        >
          Discover Products <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface pb-20">
      <PageHeader
        bg="/images/hero/hero1.jpg"
        title="My Wishlist"
        subtitle={`${items.length} saved product${items.length === 1 ? "" : "s"}`}
      />
      <div className="mx-auto grid max-w-shell grid-cols-2 gap-5 px-4 pt-8 sm:grid-cols-3 lg:grid-cols-4 lg:px-8">
        {items.map((product) => (
          <div key={product!.id} className="relative">
            <ProductCard product={product!} compact />
            <button
              onClick={() => toggleWishlist(product!.id)}
              className="absolute right-3 top-14 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-card transition-colors hover:bg-danger hover:text-white"
              aria-label={`Remove ${product!.name} from wishlist`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
