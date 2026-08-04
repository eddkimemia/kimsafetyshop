"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Lock, Truck, ArrowRight, Package, Loader2, FileDown, CircleAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatKES, cn } from "@/lib/utils";
import { ProductArt } from "@/components/product/product-art";
import { PageHeader } from "@/components/layout/page-header";

const steps = ["Contact", "Delivery", "Payment", "Review"];

const isInstantPayment = (m: string) => m !== "po";

export default function CheckoutPage() {
  const { cart, cartTotal, cartOldTotal, clearCart, liveProduct } = useStore();
  const [step, setStep] = useState(0);
  const [placed, setPlaced] = useState(false);
  const [checkoutType, setCheckoutType] = useState<"guest" | "account" | "corporate">("guest");
  const [payment, setPayment] = useState("mpesa");
  const [momo, setMomo] = useState("");
  const [form, setForm] = useState({ first: "", last: "", email: "", phone: "", county: "Nairobi", town: "", address: "", notes: "", po: "" });
  const [orderId, setOrderId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const savings = cartOldTotal - cartTotal;
  const freeDelivery = cartTotal >= 10000;
  const shipping = cart.length === 0 ? 0 : freeDelivery ? 0 : 350;
  const total = cartTotal + shipping;

  const field =
    "w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none transition-all focus:border-safety-400 focus:ring-4 focus:ring-safety-500/10";
  const errField =
    "w-full rounded-xl border border-danger bg-white px-3.5 py-3 text-sm outline-none transition-all focus:border-danger focus:ring-4 focus:ring-danger/10";
  const fieldCls = (k: string) => (errors[k] ? errField : field);
  const errMsg = (k: string) =>
    errors[k] ? <p className="text-xs font-semibold text-danger">{errors[k]}</p> : null;

  const placeOrder = async () => {
    setPlacing(true);
    setOrderError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${form.first} ${form.last}`.trim(),
          email: form.email,
          phone: form.phone,
          address: `${form.address}, ${form.town}, ${form.county}`,
          payment,
          total,
          items: cart.map((i) => {
            const p = liveProduct(i.productId);
            return { productId: i.productId, name: p?.name ?? i.productId, qty: i.qty, price: p?.price ?? 0 };
          }),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Failed to place order");
      setOrderId(json.order?.id ?? null);
      setPlaced(true);
      clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : "Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  const next = async () => {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!form.first.trim()) errs.first = "First name is required";
      if (!form.last.trim()) errs.last = "Last name is required";
      if (!form.email.trim()) errs.email = "Email address is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Enter a valid email address";
      if (!form.phone.trim()) errs.phone = "Phone number is required";
      else if (!/^(\+?\d{9,13})$/.test(form.phone.replace(/[\s-]/g, ""))) errs.phone = "Enter a valid phone number";
      if (checkoutType === "corporate" && !form.po.trim()) errs.po = "Company name / PO number is required";
    }
    if (step === 1) {
      if (!form.town.trim()) errs.town = "Town / area is required";
      if (!form.address.trim()) errs.address = "Street / building / estate is required";
    }
    if (step === 2 && payment === "mpesa") {
      if (!momo.trim()) errs.momo = "M-Pesa number is required";
      else if (!/^(\+?254|0)\d{9}$/.test(momo.replace(/[\s-]/g, ""))) errs.momo = "Enter a valid M-Pesa number, e.g. 07XX XXX XXX";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (step < steps.length - 1) setStep(step + 1);
    else await placeOrder();
  };

  const clearErr = (k: string) => setErrors((prev) => (prev[k] ? { ...prev, [k]: "" } : prev));

  const summaryItems = useMemo(
    () => cart.map((i) => ({ product: liveProduct(i.productId), qty: i.qty })).filter((i) => i.product),
    [cart, liveProduct]
  );

  if (placed) {
    const paid = isInstantPayment(payment);
    return (
      <div className="flex flex-col items-center gap-4 bg-surface px-4 py-24 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50">
          <Check className="h-12 w-12 text-emerald-600" />
        </div>
        <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-700">
          Order #{orderId ?? `KS-${Math.floor(10000 + Math.random() * 89999)}`}
        </span>
        <h1 className="font-display text-3xl font-extrabold text-navy-900">Thank you for your order!</h1>
        <p className="max-w-md text-sm text-gray-500">
          A confirmation has been sent to <strong>{form.email || "your email"}</strong>. You&apos;ll receive
          a dispatch notification once your order leaves our Nairobi warehouse.
        </p>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold",
            paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          )}
        >
          {paid ? <Check className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}
          {paid ? "Payment received — invoice marked PAID" : "Payment pending — invoice marked UNPAID"}
        </span>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <a
            href={`/api/orders/${orderId ?? ""}/invoice`}
            className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-7 py-3.5 text-sm font-bold text-white hover:bg-navy-800"
          >
            <FileDown className="h-4 w-4" /> Download Invoice (PDF)
          </a>
          <Link href="/account" className="rounded-xl border border-line bg-white px-7 py-3.5 text-sm font-bold text-navy-900 hover:bg-surface">
            Track Order
          </Link>
          <Link href="/search" className="rounded-xl border border-line bg-white px-7 py-3.5 text-sm font-bold text-navy-900 hover:bg-surface">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 bg-surface px-4 py-24 text-center">
        <Package className="h-12 w-12 text-gray-300" />
        <h1 className="font-display text-2xl font-extrabold text-navy-900">Nothing to check out</h1>
        <Link href="/search" className="rounded-xl bg-safety-500 px-7 py-3.5 text-sm font-bold text-white hover:bg-safety-600">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface pb-20">
      <PageHeader bg="/images/hero/hero3.jpg" title="Checkout">
        <ol className="mt-6 flex flex-wrap items-center gap-2 text-xs font-bold" aria-label="Checkout progress">
            {steps.map((label, i) => (
              <li key={label} className="flex items-center gap-2 text-white/80">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border-2",
                    i < step
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : i === step
                        ? "border-safety-500 bg-safety-500 text-white"
                        : "border-white/20 text-white/40"
                  )}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                {label}
                {i < steps.length - 1 && <span className="h-0.5 w-6 rounded bg-white/20" />}
              </li>
            ))}
          </ol>
      </PageHeader>

      <div className="mx-auto grid max-w-shell grid-cols-1 gap-8 px-4 pt-8 lg:grid-cols-3 lg:px-8">
        <div className="space-y-6 lg:col-span-2">
          {step === 0 && (
            <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <h2 className="font-display text-lg font-extrabold text-navy-900">How would you like to check out?</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  ["guest", "Guest Checkout", "Fastest — no account needed"],
                  ["account", "Account Checkout", "Track orders & save details"],
                  ["corporate", "Corporate Account", "PO, credit terms & invoicing"],
                ].map(([value, label, sub]) => (
                  <button
                    key={value}
                    onClick={() => setCheckoutType(value as typeof checkoutType)}
                    className={cn(
                      "rounded-2xl border-2 p-4 text-left transition-all",
                      checkoutType === value
                        ? "border-safety-500 bg-safety-50"
                        : "border-line hover:border-safety-300"
                    )}
                  >
                    <p className="text-sm font-bold text-navy-900">{label}</p>
                    <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p>
                  </button>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <input required placeholder="First name *" className={fieldCls("first")} value={form.first} onChange={(e) => { setForm({ ...form, first: e.target.value }); clearErr("first"); }} />
                  {errMsg("first")}
                </div>
                <div className="space-y-1.5">
                  <input required placeholder="Last name *" className={fieldCls("last")} value={form.last} onChange={(e) => { setForm({ ...form, last: e.target.value }); clearErr("last"); }} />
                  {errMsg("last")}
                </div>
                <div className="space-y-1.5">
                  <input required type="email" placeholder="Email address *" className={fieldCls("email")} value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); clearErr("email"); }} />
                  {errMsg("email")}
                </div>
                <div className="space-y-1.5">
                  <input required type="tel" placeholder="Phone (M-Pesa number) *" className={fieldCls("phone")} value={form.phone} onChange={(e) => { setForm({ ...form, phone: e.target.value }); clearErr("phone"); }} />
                  {errMsg("phone")}
                </div>
                {checkoutType === "corporate" && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <input required placeholder="Company name / PO number *" className={fieldCls("po")} value={form.po} onChange={(e) => { setForm({ ...form, po: e.target.value }); clearErr("po"); }} />
                    {errMsg("po")}
                  </div>
                )}
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <h2 className="font-display text-lg font-extrabold text-navy-900">Delivery details</h2>
              <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <select className={field} value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })}>
                  {["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Machakos", "Other"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <input placeholder="Town / area *" className={fieldCls("town")} value={form.town} onChange={(e) => { setForm({ ...form, town: e.target.value }); clearErr("town"); }} />
                <input placeholder="Street / building / estate *" className={fieldCls("address")} value={form.address} onChange={(e) => { setForm({ ...form, address: e.target.value }); clearErr("address"); }} />
                <textarea placeholder="Delivery notes (optional)" rows={3} className={cn(field, "sm:col-span-2")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {errMsg("town")}
                {errMsg("address")}
              </div>
              <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-safety-50 px-4 py-3 text-xs font-semibold text-safety-700">
                <Truck className="h-4 w-4" />
                {freeDelivery ? "Free same-day delivery within Nairobi unlocked" : "Same-day delivery within Nairobi (KES 350) · Free over KES 10,000"}
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <h2 className="font-display text-lg font-extrabold text-navy-900">Payment method</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ["mpesa", "M-Pesa", "Pay instantly via STK push — most popular"],
                  ["card", "Card", "Visa & Mastercard via Paystack"],
                  ["bank", "Bank Transfer", "Easypay / PesaLink — instant confirmation"],
                  ["po", "Purchase Order", "B2B & corporate — pay in 30 days"],
                ].map(([value, label, sub]) => (
                  <button
                    key={value}
                    onClick={() => setPayment(value)}
                    className={cn(
                      "rounded-2xl border-2 p-4 text-left transition-all",
                      payment === value ? "border-safety-500 bg-safety-50" : "border-line hover:border-safety-300"
                    )}
                  >
                    <p className="text-sm font-bold text-navy-900">{label}</p>
                    <p className="mt-0.5 text-[11px] text-gray-400">{sub}</p>
                  </button>
                ))}
              </div>
              <div className="mt-5 rounded-2xl bg-surface p-5">
                {payment === "mpesa" && (
                  <div>
                    <p className="mb-2 text-sm font-bold text-navy-900">Enter M-Pesa phone number</p>
                    <input
                      type="tel"
                      placeholder="07XX XXX XXX"
                      className={fieldCls("momo")}
                      value={momo}
                      onChange={(e) => { setMomo(e.target.value); clearErr("momo"); }}
                    />
                    {errMsg("momo")}
                    <p className="mt-2 text-xs text-gray-400">
                      You&apos;ll receive an STK push on this number to authorize {formatKES(total)}.
                    </p>
                  </div>
                )}
                {payment === "bank" && (
                  <p className="text-sm text-gray-500">
                    Pay to <strong>KimSafety Ltd — 0110 2123 4567</strong>, Equity Bank (Business account). Use order
                    reference <strong>KSCK-{Date.now() % 100000}</strong> and SMS proof of payment to +254 712 345 678.
                  </p>
                )}
                {payment === "card" && (
                  <p className="text-sm text-gray-500">
                    You&apos;ll be redirected to Paystack&apos;s secure payment page to complete your card payment.
                  </p>
                )}
                {payment === "po" && (
                  <p className="text-sm text-gray-500">
                    Approved corporate accounts can pay via purchase order with 30-day terms. We&apos;ll verify your
                    account and send the proforma invoice for sign-off.
                  </p>
                )}
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <h2 className="font-display text-lg font-extrabold text-navy-900">Review & confirm</h2>
              <dl className="mt-4 space-y-2.5 rounded-2xl bg-surface p-5 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">Contact</dt><dd className="font-bold text-navy-900">{form.first} {form.last} · {form.phone}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Deliver to</dt><dd className="text-right font-bold text-navy-900">{form.town}, {form.county}<br /><span className="text-xs font-normal text-gray-400">{form.address}</span></dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Payment</dt><dd className="font-bold text-navy-900 capitalize">{payment === "mpesa" ? `M-Pesa ${momo || ""}` : payment.replace("-", " ")}</dd></div>
              </dl>
              <ul className="mt-5 max-h-56 space-y-3 overflow-auto pr-1">
                {summaryItems.map(({ product, qty }) => (
                  <li key={product!.id} className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                      <ProductArt tags={product!.tags} categoryName={product!.categoryName} brand={product!.brand} sku={product!.sku} className="h-full w-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy-900">{product!.name}</p>
                      <p className="text-[11px] text-gray-400">Qty {qty}</p>
                    </div>
                    <span className="text-sm font-bold text-navy-900">{formatKES(product!.price * qty)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="flex items-center justify-between">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)} className="rounded-xl border border-line bg-white px-6 py-3 text-sm font-bold text-navy-900 hover:bg-surface">
                ← Back
              </button>
            ) : (
              <Link href="/cart" className="rounded-xl border border-line bg-white px-6 py-3 text-sm font-bold text-navy-900 hover:bg-surface">
                ← Back to cart
              </Link>
            )}
            <button
              onClick={next}
              disabled={placing}
              className="inline-flex items-center gap-2 rounded-xl bg-safety-500 px-8 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(245,124,0,0.35)] transition-colors hover:bg-safety-600 disabled:opacity-60"
            >
              {step === steps.length - 1 ? (
                placing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {step === steps.length - 1
                ? placing ? "Placing order…" : `Place Order · ${formatKES(total)}`
                : "Continue"}
            </button>
          </div>
          {orderError && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{orderError}</p>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-line bg-white p-6 shadow-card lg:sticky lg:top-28">
          <h2 className="font-display text-lg font-extrabold text-navy-900">Order Summary</h2>
          <ul className="mt-4 max-h-64 space-y-3 overflow-auto pr-1">
            {summaryItems.map(({ product, qty }) => (
              <li key={product!.id} className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                  <ProductArt tags={product!.tags} categoryName={product!.categoryName} brand={product!.brand} sku={product!.sku} className="h-full w-full" />
                </div>
                <p className="min-w-0 flex-1 truncate text-xs font-semibold text-navy-900">
                  {product!.name}
                  <span className="block text-[10px] font-normal text-gray-400">× {qty}</span>
                </p>
                <span className="text-xs font-bold text-navy-900">{formatKES(product!.price * qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Subtotal (full price)</dt><dd className="font-bold">{formatKES(cartOldTotal)}</dd></div>
            {savings > 0 && <div className="flex justify-between text-emerald-600"><dt>Discount</dt><dd className="font-bold">-{formatKES(savings)}</dd></div>}
            <div className="flex justify-between"><dt className="text-gray-500">Delivery</dt><dd className="font-bold">{shipping === 0 ? "FREE" : formatKES(shipping)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3"><dt className="font-bold text-navy-900">Total (after discount)</dt><dd className="font-display text-xl font-extrabold text-navy-900">{formatKES(total)}</dd></div>
          </dl>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <Lock className="h-3 w-3" /> Encrypted & secure checkout · PCI-DSS compliant
          </p>
        </aside>
      </div>
    </div>
  );
}
