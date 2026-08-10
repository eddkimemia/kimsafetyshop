"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Trash2,
  Minus,
  Plus,
  ShoppingCart,
  Truck,
  ShieldCheck,
  RotateCcw,
  ClipboardList,
  Lock,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { activeBulkTier, bulkUnitPrice, formatKES } from "@/lib/utils";
import { ProductArt } from "@/components/product/product-art";
import { PageHeader } from "@/components/layout/page-header";

export default function CartPage() {
  const { cart, setQty, removeFromCart, clearCart, cartTotal, cartOldTotal, liveProduct, refreshCatalog } = useStore();
  const savings = cartOldTotal - cartTotal;
  const freeDelivery = cartTotal >= 10000;
  const shipping = cart.length === 0 ? 0 : freeDelivery ? 0 : 350;

  // Always re-sync prices with the live catalog when the cart is opened, so
  // admin price changes are reflected even if this page was open before the change.
  useEffect(() => {
    refreshCatalog().catch(() => {});
  }, [refreshCatalog]);

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 bg-surface px-4 py-24 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-card">
          <ShoppingCart className="h-10 w-10 text-gray-300" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-navy-900">Your cart is empty</h1>
        <p className="max-w-sm text-sm text-gray-500">
          Explore 400+ certified products — from PPE to medical safety, delivered nationwide.
        </p>
        <Link
          href="/search"
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-safety-500 px-8 py-3.5 text-sm font-bold text-white hover:bg-safety-600"
        >
          Start Shopping <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface pb-20">
      <PageHeader
        bg="/images/hero/hero4.jpg"
        title="Shopping Cart"
        subtitle={`${cart.length} item${cart.length > 1 ? "s" : ""} in your cart`}
      />

      <div className="mx-auto grid max-w-shell grid-cols-1 gap-8 px-4 pt-8 lg:grid-cols-3 lg:px-8">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
            <Truck className="h-4 w-4" />
            {freeDelivery
              ? "Free delivery unlocked — Nairobi orders over KES 10,000"
              : `Add ${formatKES(10000 - cartTotal)} more for free delivery within Nairobi`}
          </div>
          <ul className="space-y-5">
                {cart.map((item) => {
                  const product = liveProduct(item.productId);
                  if (!product) return null;
                  const unit = bulkUnitPrice(product, item.qty);
                  const oldPrice = product.oldPrice != null && product.oldPrice > unit ? product.oldPrice : null;
                  const lineTotal = unit * item.qty;
                  const tier = activeBulkTier(product, item.qty);
                  const stock = product.stock ?? 0;
              return (
                <li key={item.productId} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-3 shadow-card sm:flex-row sm:gap-4">
                  <Link href={`/product/${product.slug}`} className="h-[100px] w-[100px] shrink-0 self-center overflow-hidden rounded-xl sm:h-[110px] sm:w-[110px] sm:self-auto">
                    <ProductArt tags={product.tags} categoryName={product.categoryName} brand={product.brand} sku={product.sku} name={product.name} className="h-full w-full" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/product/${product.slug}`} className="line-clamp-2 font-display text-[15px] font-extrabold leading-snug text-navy-900 hover:text-safety-600">
                          {product.name}
                        </Link>
                        <div className="mt-1.5 flex items-center gap-2">
                          {unit < product.price && (
                            <span className="rounded-full bg-safety-50 px-2 py-0.5 text-[10px] font-bold text-safety-700">Bulk {tier?.savings?.replace(/off$/, "").trim()}</span>
                          )}
                          {stock === 0 ? (
                            <span className="text-[11px] font-bold text-danger">Out of stock</span>
                          ) : stock <= 5 ? (
                            <span className="text-[11px] font-bold text-amber-600">Only {stock} left</span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> In stock
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-gray-400 transition-colors hover:bg-danger/5 hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-1">
                      <div>
                        <div className="flex items-center rounded-full border border-line bg-surface p-1">
                          <button
                            onClick={() => setQty(product.id, item.qty - 1)}
                            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-white hover:text-navy-900"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-12 text-center text-sm font-bold">{item.qty}</span>
                          <button
                            onClick={() => setQty(product.id, item.qty + 1)}
                            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-white hover:text-navy-900"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mt-1.5 text-[11px] font-semibold text-gray-400">@ {formatKES(unit)} each</p>
                      </div>
                      <div className="text-right">
                        {oldPrice != null && (
                          <div className="mb-1 inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600">
                            Save {formatKES((oldPrice - unit) * item.qty)}
                          </div>
                        )}
                        {oldPrice != null && (
                          <p className="text-[13px] text-gray-400 line-through">{formatKES(oldPrice)}</p>
                        )}
                        <p className="font-display text-2xl font-extrabold tracking-tight text-navy-900">
                          {formatKES(lineTotal)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          Subtotal · {item.qty} × {formatKES(unit)}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-[11px] font-bold text-navy-900 shadow-card">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Genuine Product
            </div>
            <div className="flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-[11px] font-bold text-navy-900 shadow-card">
              <RotateCcw className="h-4 w-4 text-safety-500" /> Easy Returns
            </div>
            <div className="flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-[11px] font-bold text-navy-900 shadow-card">
              <Lock className="h-4 w-4 text-safety-500" /> Secure Checkout
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <Link href="/search" className="text-sm font-bold text-navy-900 hover:text-safety-600">
              ← Continue shopping
            </Link>
            <button
              onClick={clearCart}
              className="flex items-center gap-1.5 text-sm font-bold text-gray-400 transition-colors hover:text-danger"
            >
              <Trash2 className="h-4 w-4" /> Clear cart
            </button>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-line bg-white p-6 shadow-card lg:sticky lg:top-28">
          <h2 className="font-display text-lg font-extrabold text-navy-900">Order Summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Subtotal (full price)</dt>
              <dd className="font-bold text-navy-900">{formatKES(cartOldTotal)}</dd>
            </div>
            {savings > 0 && (
              <div className="flex justify-between text-emerald-600">
                <dt>Discount</dt>
                <dd className="font-bold">-{formatKES(savings)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">Delivery</dt>
              <dd className="font-bold text-navy-900">{shipping === 0 ? "FREE" : formatKES(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base">
              <dt className="font-bold text-navy-900">Total (after discount)</dt>
              <dd className="font-display text-2xl font-extrabold text-navy-900">
                {formatKES(cartTotal + shipping)}
              </dd>
            </div>
          </dl>
          <Link
            href="/checkout"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-safety-500 py-4 text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(245,124,0,0.35)] transition-colors hover:bg-safety-600"
          >
            Proceed to Checkout <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/quote"
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-line py-3.5 text-sm font-bold text-navy-900 transition-colors hover:bg-surface"
          >
            <ClipboardList className="h-4 w-4 text-safety-500" /> Request Bulk Quotation
          </Link>
          <ul className="mt-6 space-y-2.5 border-t border-line pt-5 text-xs text-gray-500">
            <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-safety-500" /> Same-day Nairobi delivery</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Secure M-Pesa & card payments</li>
            <li className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-safety-500" /> 7-day easy returns</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
