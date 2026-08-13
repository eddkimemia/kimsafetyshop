"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ClipboardList, Bell, LifeBuoy, Gift, Check, Copy, ExternalLink } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatKES } from "@/lib/utils";
import { ProductArt } from "@/components/product/product-art";
import { AccountShell, useAccountStats } from "@/components/account/account-shell";
import { OrdersTable } from "@/components/account/orders-table";

export default function AccountPage() {
  return (
    <AccountShell>
      <Overview />
    </AccountShell>
  );
}

function Overview() {
  const { wishlist, liveProduct } = useStore();
  const { orders, quotes, tickets, unread, loading } = useAccountStats();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const wishlistItems = wishlist.map((id) => liveProduct(id)).filter(Boolean);
  const code = referralCode;
  const shareLink = code && typeof window !== "undefined" ? `${window.location.origin}/register?ref=${encodeURIComponent(code)}` : "";

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => s?.user?.referral_code && setReferralCode(s.user.referral_code))
      .catch(() => {});
  }, []);

  const copy = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {([
          [Package, "Active orders", String(orders.filter((o) => ["Processing", "In transit"].includes(o.status)).length), "Track deliveries", "/account/orders"],
          [ClipboardList, "Pending quotes", String(quotes.filter((q) => q.status === "Pending").length), "Awaiting response", "/account/quotes"],
          [Bell, "Notifications", String(unread), "Unread updates", "/account/notifications"],
          [LifeBuoy, "Open tickets", String(tickets.filter((t) => t.status !== "Closed").length), "Get support", "/account/tickets"],
        ] as const).map(([Icon, label, value, sub, href]) => (
          <Link
            key={label}
            href={href}
            className="rounded-2xl border border-line bg-white p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover"
          >
            <Icon className="mb-3 h-5 w-5 text-safety-500" />
            <p className="text-xs text-gray-400">{label}</p>
            <p className="font-display text-xl font-extrabold text-navy-900">{value}</p>
            <p className="mt-1 text-[11px] font-semibold text-safety-600">{sub} →</p>
          </Link>
        ))}
      </section>

      {code && (
        <section className="rounded-2xl border border-safety-200 bg-gradient-to-br from-safety-50 to-white p-6 shadow-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-navy-900">
                <Gift className="h-5 w-5 text-safety-500" /> Invite friends, get rewarded
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Share your referral link — friends who register or checkout get your code applied, and we keep track
                of who you&apos;ve referred.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <code className="rounded-xl border border-safety-300 bg-white px-4 py-2.5 text-sm font-extrabold tracking-wide text-safety-700">
                {code}
              </code>
              <button
                onClick={copy}
                className="flex items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-safety-500"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy link"}
              </button>
              <a
                href={shareLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-navy-900/15 bg-white px-4 py-2.5 text-sm font-bold text-navy-900 transition-colors hover:border-safety-400 hover:text-safety-600"
              >
                <ExternalLink className="h-4 w-4" /> Share
              </a>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold text-navy-900">Recent orders</h2>
          <Link href="/account/orders" className="text-xs font-bold text-safety-600">
            View all →
          </Link>
        </div>
        <OrdersTable orders={orders} loading={loading} limit={3} />
      </section>

      <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold text-navy-900">Wishlist</h2>
          <Link href="/wishlist" className="text-xs font-bold text-safety-600">View all →</Link>
        </div>
        {wishlistItems.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">No saved items yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {wishlistItems.slice(0, 4).map((p) => (
              <Link key={p!.id} href={`/product/${p!.slug}`} className="group">
                <div className="overflow-hidden rounded-xl">
                  <ProductArt tags={p!.tags} categoryName={p!.categoryName} brand={p!.brand} sku={p!.sku} name={p!.name} className="aspect-square" />
                </div>
                <p className="mt-2 line-clamp-1 text-xs font-semibold text-navy-900 group-hover:text-safety-600">{p!.name}</p>
                <p className="text-xs font-extrabold text-safety-600">{formatKES(p!.price)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
