"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check,
  Heart,
  Scale,
  ShoppingCart,
  Zap,
  ClipboardList,
  Truck,
  ShieldCheck,
  RotateCcw,
  FileText,
  Star,
  Boxes,
  Clock,
  Minus,
  Plus,
  BadgeCheck,
  Package,
  Award,
  ScrollText,
  Users,
} from "lucide-react";
import type { Product } from "@/lib/types";
import { useStore } from "@/lib/store";
import { productInCategory } from "@/lib/data/catalog";
import { activeBulkTier, bulkUnitPrice, discountPercent, formatKES, cn } from "@/lib/utils";
import { sanitizePostHtml } from "@/lib/blog";
import { ProductArt, productImageFor, useAdminImageOverrides, useAdminGalleries } from "@/components/product/product-art";
import { productGalleries } from "@/lib/data/product-images";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { ProductCard } from "@/components/product/product-card";
import { ProductReviews } from "@/components/product/product-reviews";
import { ProductQA } from "@/components/product/product-qa";
import { RatingStars } from "@/components/ui/rating";
import { Button } from "@/components/ui/button";

export function ProductDetail({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const { addToCart, toggleWishlist, wishlist, toggleCompare, compare, noteRecentlyViewed, recentlyViewed, liveProduct, refreshCatalog } = useStore();
  const overrides = useAdminImageOverrides();
  const adminGalleries = useAdminGalleries();
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("description");
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyDone, setNotifyDone] = useState(false);
  const [notifyError, setNotifyError] = useState<string | null>(null);

  // Re-sync with the live catalog on mount so admin price/stock/bulk edits show
  // up immediately, even while this page's server-rendered HTML is still from
  // the previous ISR window. Falls back to the server-rendered product prop.
  useEffect(() => {
    refreshCatalog().catch(() => {});
  }, [refreshCatalog]);
  const live = liveProduct(product.id) ?? product;

  useEffect(() => {
    noteRecentlyViewed(product.id);
  }, [product.id, noteRecentlyViewed]);

  const off = discountPercent(live.price, live.oldPrice);
  const inWish = wishlist.includes(product.id);
  const inCompare = compare.includes(product.id);
  const out = live.stock <= 0;
  const low = !out && live.stock <= live.lowStockAt;
  const unitPrice = bulkUnitPrice(live, qty);
  const bulkPriceActive = unitPrice < live.price;
  const activeTier = activeBulkTier(live, qty);

  const galleryVariants = useMemo(() => {
    // The live row's admin-edited image wins, then the overrides/static map.
    const main = live.image || productImageFor(product.sku);
    const adminGallery = adminGalleries?.[product.sku] ?? [];
    const rest = adminGallery.length > 0 ? adminGallery : productGalleries[product.sku] ?? [];
    return [main, ...rest.filter((src) => src !== main)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, product, overrides, adminGalleries]);

  const [view, setView] = useState(0);

  const handleAdd = () => {
    addToCart(product.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const handleBuyNow = () => {
    addToCart(product.id, qty);
    setBuyNowLoading(true);
    setTimeout(() => {
      setBuyNowLoading(false);
      window.location.href = "/checkout";
    }, 500);
  };

  const tabs = [
    ["description", "Description", ScrollText],
    ["specifications", "Specifications", Boxes],
    ["downloads", "Downloads & Documents", FileText],
    ["reviews", "Reviews", Star],
    ["qa", "Questions & Answers", Users],
  ] as const;

  const recentlyViewedProducts = recentlyViewed
    .filter((id) => id !== product.id)
    .map((id) => liveProduct(id))
    .filter((p): p is Product => Boolean(p))
    .slice(0, 4);

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-shell px-4 py-8 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Gallery */}
          <div>
            <div className="group relative overflow-hidden rounded-3xl border border-line shadow-card">
              <motion.div
                key={view}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <ProductArt
                  tags={product.tags}
                  categoryName={product.categoryName}
                  brand={product.brand}
                  sku={product.sku}
                  name={product.name}
                  src={overrides === null ? undefined : galleryVariants[view]}
                  className="aspect-square"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  quality={90}
                />
              </motion.div>
              <div className="absolute left-4 top-4 flex gap-2">
                {off && (
                  <span className="rounded-full bg-danger px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                    Save {formatKES(live.oldPrice! - live.price)} (-{off}%)
                  </span>
                )}
                {product.new && (
                  <span className="rounded-full bg-navy-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm">NEW</span>
                )}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
              {galleryVariants.map((image, i) => (
                <button
                  key={i}
                  onClick={() => setView(i)}
                  aria-label={`View ${i + 1}`}
                  className={cn(
                    "overflow-hidden rounded-2xl border-2 transition-all",
                    view === i ? "border-safety-500 shadow-card" : "border-transparent opacity-70 hover:opacity-100"
                  )}
                >
                  <ProductArt
                    tags={product.tags}
                    categoryName={product.categoryName}
                    brand={product.brand}
                    sku={product.sku}
                    name={product.name}
                    src={overrides === null ? undefined : image}
                    className="aspect-square"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <Link
                href={`/brands/${product.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                className="rounded-full bg-safety-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-safety-700 transition-colors hover:bg-safety-100"
              >
                {product.brand}
              </Link>
              <span className="font-mono text-xs text-gray-400">
                SKU: {product.sku}{product.model ? ` · Model: ${product.model}` : ""}
              </span>
            </div>

            <h1 className="mt-4 font-display text-2xl font-extrabold leading-tight tracking-tight text-navy-900 sm:text-3xl">
              {product.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
              <RatingStars rating={product.rating} reviews={product.reviews} size="md" />
              <span className="text-xs font-semibold text-gray-400">{product.sold.toLocaleString()} sold</span>
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                  out ? "bg-red-50 text-danger" : low ? "bg-amber-50 text-warning" : "bg-emerald-50 text-emerald-700"
                )}
              >
                {out ? "Out of stock" : low ? `Only ${live.stock} left — low stock` : `${live.stock} in stock`}
              </span>
            </div>

            <div className="mt-5 flex items-end gap-3 rounded-2xl bg-surface p-5">
              <div>
                <div className="flex items-end gap-2.5">
                  <span className="font-display text-4xl font-extrabold tracking-tight text-navy-900">
                    {formatKES(unitPrice)}
                  </span>
                  {bulkPriceActive && (
                    <span className="pb-1 text-base text-gray-400 line-through">{formatKES(live.price)}</span>
                  )}
                  {!bulkPriceActive && off && live.oldPrice != null && live.oldPrice > live.price && (
                    <span className="pb-1 text-base text-gray-400 line-through">{formatKES(live.oldPrice)}</span>
                  )}
                </div>
                {bulkPriceActive && activeTier && (
                  <p className="mt-1 text-xs font-semibold text-emerald-600">
                    Bulk price unlocked — {formatKES(live.price - unitPrice)} off per unit ({activeTier.savings})
                  </p>
                )}
                {!bulkPriceActive && off && live.oldPrice != null && live.oldPrice > live.price && (
                  <p className="mt-1 text-xs font-semibold text-emerald-600">
                    You save {formatKES(live.oldPrice - live.price)} ({off}%)
                  </p>
                )}
              </div>
              <div className="ml-auto text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Incl. 16% VAT</p>
                <p className="text-[10px] text-gray-400">KES 0 delivery on orders over 10K</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-line p-4">
              <p className="mb-2.5 flex items-center gap-2 text-xs font-bold text-navy-900">
                <BadgePercent className="h-4 w-4 text-safety-500" /> Bulk pricing
              </p>
              <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                {live.bulk.map((tier) => {
                  const active = activeBulkTier(live, qty)?.qty === tier.qty;
                  return (
                    <div
                      key={tier.qty}
                      className={cn(
                        "rounded-xl bg-surface px-2 py-2.5 transition-colors",
                        active && "bg-safety-50 ring-2 ring-safety-500"
                      )}
                    >
                      <p className="font-bold text-navy-900">{tier.qty}</p>
                      <p className="text-gray-500">units</p>
                      <p className="mt-1 font-extrabold text-safety-600">{tier.price}</p>
                      {tier.savings !== "Standard" && (
                        <p className="mt-0.5 text-[10px] font-bold text-emerald-600">{tier.savings}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-line">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="flex h-12 w-12 items-center justify-center text-gray-500 transition-colors hover:text-navy-900"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-base font-bold">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(999, qty + 1))}
                  className="flex h-12 w-12 items-center justify-center text-gray-500 transition-colors hover:text-navy-900"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button
                onClick={handleAdd}
                disabled={out}
                size="lg"
                variant={added ? "success" : "primary"}
                className="flex-1"
              >
                {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                {added ? "Added to Cart" : "Add to Cart"}
              </Button>
            </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button onClick={handleBuyNow} disabled={out} size="lg" variant="secondary">
                  <Zap className="h-4 w-4 text-safety-400" />
                  {buyNowLoading ? "Redirecting…" : "Buy Now"}
                </Button>
                <Link
                  href={`/quote?product=${product.id}`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-line px-6 py-3.5 text-sm font-bold text-navy-900 transition-colors hover:bg-surface"
                >
                  <ClipboardList className="h-4 w-4 text-safety-500" /> Request Quote
                </Link>
              </div>

              {out && (
                <div className="mt-4 rounded-xl border border-line bg-surface p-4">
                  {notifyDone ? (
                    <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                      <Check className="h-4 w-4" /> We&apos;ll email you the moment it&apos;s back.
                    </p>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!notifyEmail.trim()) return;
                        setNotifyLoading(true);
                        fetch("/api/products/restock-notify", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ productId: product.id, email: notifyEmail.trim() }),
                        })
                          .then((r) => r.json())
                          .then((j) => {
                            if (j.error) throw new Error(j.error);
                            setNotifyDone(true);
                          })
                          .catch(() => setNotifyError("Could not save your request — try again."))
                          .finally(() => setNotifyLoading(false));
                      }}
                      className="space-y-2"
                    >
                      <label className="block text-xs font-bold text-navy-900">
                        Out of stock — get notified when it&apos;s back
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          required
                          placeholder="you@example.com"
                          value={notifyEmail}
                          onChange={(e) => setNotifyEmail(e.target.value)}
                          className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none transition-all focus:border-safety-400 focus:ring-4 focus:ring-safety-500/10"
                        />
                        <button
                          type="submit"
                          disabled={notifyLoading}
                          className="shrink-0 rounded-lg bg-navy-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-safety-500 disabled:opacity-60"
                        >
                          {notifyLoading ? "Saving…" : "Notify me"}
                        </button>
                      </div>
                      {notifyError && <p className="text-[11px] font-semibold text-danger">{notifyError}</p>}
                    </form>
                  )}
                </div>
              )}

            <div className="mt-3 flex items-center gap-3">
              <a
                href={`https://wa.me/254715135141?text=${encodeURIComponent(
                  `Hello KimSafety! I'd like to order:\n• ${product.name} (${product.sku})\n• Quantity: ${qty}\n• Unit price: ${formatKES(unitPrice)}${bulkPriceActive ? " (bulk price)" : ""}\n• Total: ${formatKES(qty * unitPrice)}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 text-sm font-bold text-white transition-colors hover:bg-[#1DA851]"
              >
                <WhatsAppIcon className="h-4 w-4 shrink-0 text-white" /> Order via WhatsApp
              </a>
              <button
                onClick={() => toggleWishlist(product.id)}
                aria-pressed={inWish}
                aria-label={inWish ? "Remove from wishlist" : "Add to wishlist"}
                title={inWish ? "Remove from wishlist" : "Add to wishlist"}
                className={cn(
                  "flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition-colors sm:w-auto sm:flex-1",
                  inWish ? "border-danger/30 bg-danger/5 text-danger" : "border-line text-navy-900 hover:bg-surface"
                )}
              >
                <Heart className={cn("h-4 w-4", inWish && "fill-danger")} />
                <span className="hidden sm:inline">{inWish ? "In Wishlist" : "Wishlist"}</span>
              </button>
              <button
                onClick={() => toggleCompare(product.id)}
                aria-pressed={inCompare}
                aria-label={inCompare ? "Remove from compare" : "Add to compare"}
                title={inCompare ? "Remove from compare" : "Add to compare"}
                className={cn(
                  "flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition-colors sm:w-auto sm:flex-1",
                  inCompare ? "border-navy-200 bg-navy-50 text-navy-800" : "border-line text-navy-900 hover:bg-surface"
                )}
              >
                <Scale className="h-4 w-4" />
                <span className="hidden sm:inline">{inCompare ? "Comparing" : "Compare"}</span>
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-2.5 rounded-2xl border border-line p-4 text-[13px] text-gray-600 sm:grid-cols-2">
              <span className="flex items-center gap-2">
                <Truck className="h-4 w-4 shrink-0 text-safety-500" />
                Nairobi same-day · Countrywide 24–72h
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                {product.certification ?? "Certified genuine stock"}
              </span>
              <span className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 shrink-0 text-safety-500" />
                {product.warranty ?? "Free returns within 7 days"}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-emerald-600" />
                Order before 3 PM for same-day dispatch
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-14">
          <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line" role="tablist" aria-label="Product information">
            {tabs.map(([key, label, Icon]) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex shrink-0 items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-bold transition-colors",
                  tab === key
                    ? "border-safety-500 text-navy-900"
                    : "border-transparent text-gray-400 hover:text-navy-900"
                )}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
          <div className="py-8">
            {tab === "description" && (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <h2 className="font-display text-lg font-extrabold text-navy-900">Product Description</h2>
                  {product.description && product.description.includes("<") ? (
                    <div
                      className="blog-prose mt-3"
                      dangerouslySetInnerHTML={{ __html: sanitizePostHtml(product.description) }}
                    />
                  ) : (
                    <p className="mt-3 whitespace-pre-line leading-relaxed text-gray-600">{product.description}</p>
                  )}
                  <ul className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {product.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 rounded-2xl bg-surface p-5">
                    <p className="mb-2 flex items-center gap-2 text-sm font-bold text-navy-900">
                      <BadgeCheck className="h-4 w-4 text-emerald-600" /> What&apos;s included
                    </p>
                    <ul className="grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2">
                      <li>• 1 × {product.name}</li>
                      <li>• Certificate of conformance</li>
                      <li>• Product datasheet & user guide</li>
                      <li>• KimSafety 12-month warranty cover</li>
                    </ul>
                  </div>
                </div>
                <aside className="space-y-4">
                  <div className="rounded-2xl border border-line p-5">
                    <p className="mb-3 text-sm font-bold text-navy-900">Typical industries</p>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.slice(0, 6).map((t) => (
                        <span key={t} className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-navy-800 capitalize">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-line p-5">
                    <p className="mb-2 flex items-center gap-2 text-sm font-bold text-navy-900">
                      <Award className="h-4 w-4 text-safety-500" /> Certifications
                    </p>
                    <p className="text-sm text-gray-600">{product.certification ?? "CE · ISO compliant"}</p>
                    <p className="mt-1 text-sm text-gray-600">Standard: {product.standard ?? "EN ISO"}</p>
                  </div>
                </aside>
              </div>
            )}

            {tab === "specifications" && (
              <div className="max-w-3xl overflow-hidden rounded-2xl border border-line">
                <table className="w-full text-sm">
                  <caption className="sr-only">Product specifications</caption>
                  <tbody>
                    {product.specs.map((spec, i) => (
                      <tr key={spec.label} className={i % 2 === 0 ? "bg-surface" : "bg-white"}>
                        <th scope="row" className="w-1/3 px-5 py-3.5 text-left font-bold text-navy-900">
                          {spec.label}
                        </th>
                        <td className="px-5 py-3.5 text-gray-600">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "downloads" && (
              <div className="max-w-2xl space-y-3">
                {product.downloads.map((d, i) => (
                  <a
                    key={d.name + i}
                    href={`/api/documents/${encodeURIComponent(product.sku)}/${i}`}
                    download={d.name}
                    className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-safety-300 hover:bg-safety-50"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-card">
                      <FileText className="h-5 w-5 text-danger" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-bold text-navy-900">{d.name}</span>
                      <span className="block text-[11px] text-gray-400">
                        {d.type} · {d.file ? "Download file" : "Free download"}
                      </span>
                    </span>
                    <Button variant="outline" size="sm">Download</Button>
                  </a>
                ))}
              </div>
            )}

            {tab === "reviews" && <ProductReviews product={product} />}

            {tab === "qa" && <ProductQA productId={product.id} />}
          </div>
        </div>

        {/* Related */}
        <RelatedSections product={product} related={related} recentlyViewedProducts={recentlyViewedProducts} />
      </div>
    </div>
  );
}

function BadgePercent({ className }: { className?: string }) {
  return <Package className={className ?? "h-4 w-4 text-safety-500"} />;
}

function RelatedSections({
  product,
  related,
  recentlyViewedProducts,
}: {
  product: Product;
  related: Product[];
  recentlyViewedProducts: Product[];
}) {
  const frequently = related
    .filter((r) => productInCategory(r, product.category) || (product.categories ?? []).some((c) => productInCategory(r, c)))
    .slice(0, 4);
  const accessories = related.slice(0, 8);

  return (
    <div className="mt-16 space-y-12">
      {frequently.length > 0 && (
        <section aria-label="Frequently bought together">
          <h2 className="mb-6 font-display text-2xl font-extrabold tracking-tight text-navy-900">
            Frequently Bought Together
          </h2>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {frequently.map((p) => (
              <ProductCard key={p.id} product={p} compact />
            ))}
          </div>
        </section>
      )}
      <section aria-label="Customers also bought">
        <h2 className="mb-6 font-display text-2xl font-extrabold tracking-tight text-navy-900">
          Customers Also Bought
        </h2>
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {related.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} compact />
          ))}
        </div>
      </section>
      <section aria-label="Recommended accessories">
        <h2 className="mb-6 font-display text-2xl font-extrabold tracking-tight text-navy-900">
          Recommended Accessories
        </h2>
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {accessories.slice(4, 8).map((p) => (
            <ProductCard key={p.id} product={p} compact />
          ))}
        </div>
      </section>
      {recentlyViewedProducts.length > 0 && (
        <section aria-label="Recently viewed">
          <h2 className="mb-6 font-display text-2xl font-extrabold tracking-tight text-navy-900">
            Recently Viewed
          </h2>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {recentlyViewedProducts.map((p) => (
              <ProductCard key={p.id} product={p} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
