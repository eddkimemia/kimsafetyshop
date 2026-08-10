"use client";

import Link from "next/link";
import { ShoppingCart, Heart, Scale, Check } from "lucide-react";
import { getProduct } from "@/lib/data/products";
import { useStore } from "@/lib/store";
import { formatKES, discountPercent, cn } from "@/lib/utils";
import { ProductArt } from "@/components/product/product-art";
import { RatingStars } from "@/components/ui/rating";
import { useState } from "react";

export function ProductRow({ productId }: { productId: string }) {
  const { addToCart, toggleWishlist, wishlist, toggleCompare, compare, liveProduct } = useStore();
  const [added, setAdded] = useState(false);
  const product = liveProduct(productId) ?? getProduct(productId);
  if (!product) return null;
  const off = discountPercent(product.price, product.oldPrice);

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-4 shadow-card transition-all duration-300 hover:shadow-cardHover sm:flex-row">
      <Link
        href={`/product/${product.slug}`}
        className="relative block h-40 w-full shrink-0 overflow-hidden rounded-xl sm:h-44 sm:w-44"
      >
        <ProductArt tags={product.tags} categoryName={product.categoryName} brand={product.brand} sku={product.sku} name={product.name} className="h-full w-full" />
        {off && (
          <span className="absolute left-2 top-2 rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-white">
            -{off}%
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-safety-600">{product.brand}</span>
          <span className="font-mono text-[10px] text-gray-400">{product.sku}</span>
        </div>
        <Link href={`/product/${product.slug}`} className="font-display text-base font-extrabold text-navy-900 hover:text-safety-600">
          {product.name}
        </Link>
        <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">
          {product.description ? product.description.replace(/<[^>]+>/g, " ") : null}
        </p>
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <RatingStars rating={product.rating} reviews={product.reviews} size="xs" />
          <span className="text-emerald-600">In stock ({product.stock})</span>
          <span className="text-gray-400">{product.sold.toLocaleString()} sold</span>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
          <div className="flex flex-col">
            <span className="text-lg font-extrabold text-navy-900">{formatKES(product.price)}</span>
            {product.oldPrice && product.oldPrice > product.price && (
              <span className="text-xs text-gray-400 line-through">{formatKES(product.oldPrice)}</span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => { addToCart(product.id); setAdded(true); setTimeout(() => setAdded(false), 1200); }}
              className={cn(
                "flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white transition-colors",
                added ? "bg-emerald-600" : "bg-safety-500 hover:bg-safety-600"
              )}
            >
              {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
              {added ? "Added" : "Add to Cart"}
            </button>
            <button
              onClick={() => toggleWishlist(product.id)}
              aria-label="Toggle wishlist"
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                wishlist.includes(product.id) ? "border-danger/30 text-danger" : "border-line text-gray-500 hover:text-safety-600"
              )}
            >
              <Heart className={cn("h-4 w-4", wishlist.includes(product.id) && "fill-danger")} />
            </button>
            <button
              onClick={() => toggleCompare(product.id)}
              aria-label="Toggle compare"
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                compare.includes(product.id) ? "border-navy-200 bg-navy-50 text-navy-800" : "border-line text-gray-500 hover:text-navy-800"
              )}
            >
              <Scale className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
