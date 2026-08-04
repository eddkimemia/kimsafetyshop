"use client";

import Link from "next/link";
import { Eye, Heart, Scale, ShoppingCart, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { discountPercent, formatKES, cn } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { ProductArt } from "./product-art";
import { RatingStars } from "@/components/ui/rating";
import { Badge } from "@/components/ui/button";
import { useState } from "react";

export function ProductCard({
  product,
  compact,
  className,
}: {
  product: Product;
  compact?: boolean;
  className?: string;
}) {
  const { toggleWishlist, wishlist, toggleCompare, compare, addToCart } = useStore();
  const [added, setAdded] = useState(false);
  const inWish = wishlist.includes(product.id);
  const inCompare = compare.includes(product.id);
  const off = discountPercent(product.price, product.oldPrice);
  const low = product.stock > 0 && product.stock <= product.lowStockAt;
  const out = product.stock <= 0;

  const handleAdd = () => {
    addToCart(product.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-cardHover",
        className
      )}
    >
      <Link
        href={`/product/${product.slug}`}
        className="relative block overflow-hidden"
        aria-label={product.name}
      >
        <ProductArt
          tags={product.tags}
          categoryName={product.categoryName}
          brand={product.brand}
          sku={product.sku}
          className="transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {off && (
            <span className="rounded-full bg-danger px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              -{off}%
            </span>
          )}
          {product.new && (
            <span className="rounded-full bg-navy-900 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              NEW
            </span>
          )}
        </div>
        {out ? (
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-danger shadow-sm">
            Out of stock
          </span>
        ) : low ? (
          <span className="absolute right-3 top-3 rounded-full bg-warning/95 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
            Low stock
          </span>
        ) : (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm">
            <Check className="h-3 w-3" /> In stock
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-safety-600">
            {product.brand}
          </span>
          <span className="font-mono text-[10px] text-gray-400">{product.sku}</span>
        </div>
        <Link
          href={`/product/${product.slug}`}
          className={cn(
            "font-semibold leading-snug text-navy-900 transition-colors hover:text-safety-600 line-clamp-2",
            compact ? "text-[13px]" : "text-[15px]"
          )}
        >
          {product.name}
        </Link>
        <RatingStars rating={product.rating} reviews={product.reviews} size="xs" />
        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-lg font-extrabold text-navy-900">
              {formatKES(product.price)}
            </span>
             {off && product.oldPrice != null && product.oldPrice > product.price && (
              <span className="text-xs text-gray-400 line-through">
                {formatKES(product.oldPrice)}
              </span>
            )}
          </div>
          <span className="text-[10px] text-gray-400">{product.sold.toLocaleString()} sold</span>
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <button
            onClick={handleAdd}
            aria-label={`Add ${product.name} to cart`}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-navy-900 text-xs font-semibold text-white transition-colors hover:bg-safety-500"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {added ? "Added" : "Add to Cart"}
          </button>
          <button
            onClick={() => toggleWishlist(product.id)}
            aria-label="Toggle wishlist"
            aria-pressed={inWish}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
              inWish
                ? "border-danger/30 bg-danger/5 text-danger"
                : "border-line text-gray-500 hover:border-safety-300 hover:text-safety-600"
            )}
          >
            <Heart className={cn("h-4 w-4", inWish && "fill-danger text-danger")} />
          </button>
          <button
            onClick={() => toggleCompare(product.id)}
            aria-label="Add to compare"
            aria-pressed={inCompare}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
              inCompare
                ? "border-navy-200 bg-navy-50 text-navy-800"
                : "border-line text-gray-500 hover:border-navy-300 hover:text-navy-800"
            )}
          >
            <Scale className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Link
        href={`/product/${product.slug}`}
        aria-label="Quick view"
        className="absolute right-3 top-1/2 hidden translate-y-[-50%] rounded-xl bg-white/95 p-2.5 shadow-card opacity-0 transition-all duration-200 group-hover:opacity-100 lg:block hover:bg-safety-500 hover:text-white"
      >
        <Eye className="h-4 w-4" />
      </Link>
      {off && (
        <Badge tone="safety" className="absolute bottom-3 left-3 hidden group-hover:flex">
          Save {formatKES(product.oldPrice! - product.price)}
        </Badge>
      )}
    </div>
  );
}
