"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  FileText,
  Heart,
  ClipboardList,
  MapPin,
  RotateCcw,
  LifeBuoy,
  Download,
  Bell,
  Clock,
  LogOut,
  ChevronRight,
  Truck,
  Check,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn, formatKES } from "@/lib/utils";
import { getProduct } from "@/lib/data/products";
import { ProductArt } from "@/components/product/product-art";
import { AddressesTab } from "@/components/account/addresses-tab";
import { ReturnsTab } from "@/components/account/returns-tab";
import { TicketsTab } from "@/components/account/tickets-tab";
import { DownloadsTab } from "@/components/account/downloads-tab";
import { NotificationsTab } from "@/components/account/notifications-tab";

const nav = [
  ["overview", "Overview", LayoutDashboard],
  ["orders", "Orders", Package],
  ["invoices", "Invoices", FileText],
  ["wishlist", "Wishlist", Heart],
  ["quotes", "Saved Quotes", ClipboardList],
  ["addresses", "Addresses", MapPin],
  ["returns", "Returns", RotateCcw],
  ["tickets", "Support Tickets", LifeBuoy],
  ["downloads", "Downloads", Download],
  ["notifications", "Notifications", Bell],
] as const;

type Tab = (typeof nav)[number][0];

type OrderItem = { productId: string; name: string; qty: number; price: number };
type AccountOrder = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  items: OrderItem[];
  total: number;
  status: string;
  payment: string;
  paid: number;
  created_at: string;
};
type AccountQuote = {
  id: string;
  name: string;
  company: string | null;
  items: OrderItem[];
  total: number;
  status: string;
  created_at: string;
};

export default function AccountPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const { wishlist, liveProduct } = useStore();
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [quotes, setQuotes] = useState<AccountQuote[]>([]);
  const [session, setSession] = useState<{ user?: { name?: string; email?: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const wishlistItems = wishlist.map((id) => liveProduct(id)).filter(Boolean);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/session").then((r) => r.json()),
      fetch("/api/orders").then((r) => (r.ok ? r.json() : { orders: [] })),
      fetch("/api/quotes").then((r) => (r.ok ? r.json() : { quotes: [] })),
      fetch("/api/notifications").then((r) => (r.ok ? r.json() : { unread: 0 })),
    ])
      .then(([s, o, q, n]) => {
        setSession(s);
        setOrders(o.orders ?? []);
        setQuotes(q.quotes ?? []);
        setUnreadNotifications(n.unread ?? 0);
      })
      .finally(() => setLoading(false));
  }, []);

  const user = session?.user;
  const initials = (user?.name ?? "KS")
    .split(" ")
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="bg-surface pb-20">
      <div className="relative overflow-hidden bg-navy-900 text-white">
        <Image
          src="/images/hero/hero3.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-900 via-navy-900/80 to-navy-900/40" />
        <div className="relative mx-auto max-w-shell px-4 py-12 lg:px-8">
          <div className="flex flex-wrap items-center gap-5">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-safety-500 font-display text-2xl font-extrabold">
              {initials}
            </span>
            <div>
              <h1 className="font-display text-2xl font-extrabold">Hello, {user?.name ?? "there"}</h1>
              <p className="text-sm text-white/60">{user?.email ?? "Your KimSafety account"}</p>
            </div>
            <div className="ml-auto flex gap-6 text-center">
              <div>
                <p className="font-display text-xl font-extrabold">{loading ? "…" : orders.length}</p>
                <p className="text-[11px] text-white/60">Orders</p>
              </div>
              <div>
                <p className="font-display text-xl font-extrabold">{wishlistItems.length}</p>
                <p className="text-[11px] text-white/60">Wishlist</p>
              </div>
              <div>
                <p className="font-display text-xl font-extrabold">{quotes.length}</p>
                <p className="text-[11px] text-white/60">Quotes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-shell grid-cols-1 gap-8 px-4 pt-8 lg:grid-cols-4 lg:px-8">
        <aside className="h-fit rounded-2xl border border-line bg-white p-3 shadow-card lg:sticky lg:top-28">
          <nav className="flex flex-col gap-0.5" aria-label="Account navigation">
            {nav.map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                aria-current={tab === key ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                  tab === key ? "bg-navy-900 text-white" : "text-gray-500 hover:bg-surface hover:text-navy-900"
                )}
              >
                <Icon className="h-4.5 w-4.5" /> {label}
              </button>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="mt-2 flex items-center gap-3 rounded-xl border-t border-line px-4 py-3 text-sm font-semibold text-danger"
            >
              <LogOut className="h-4.5 w-4.5" /> Sign Out
            </button>
          </nav>
        </aside>

        <div className="lg:col-span-3">
          {tab === "overview" && (
            <div className="space-y-6">
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {([
                  [Package, "Active orders", String(orders.filter((o) => ["Processing", "In transit"].includes(o.status)).length), "Track deliveries"],
                  [ClipboardList, "Pending quotes", String(quotes.filter((q) => q.status === "Pending").length), "Awaiting response"],
                  [Bell, "Notifications", String(unreadNotifications), "Unread updates"],
                ] as const).map(([Icon, label, value, sub]) => (
                  <button
                    key={label as string}
                    onClick={() => setTab(label === "Pending quotes" ? "quotes" : label === "Notifications" ? "notifications" : "orders")}
                    className="rounded-2xl border border-line bg-white p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover"
                  >
                    <Icon className="mb-3 h-5 w-5 text-safety-500" />
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="font-display text-xl font-extrabold text-navy-900">{value}</p>
                    <p className="mt-1 text-[11px] font-semibold text-safety-600">{sub} →</p>
                  </button>
                ))}
              </section>

              <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-lg font-extrabold text-navy-900">Recent orders</h2>
                  <button onClick={() => setTab("orders")} className="text-xs font-bold text-safety-600">
                    View all →
                  </button>
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
                          <ProductArt tags={p!.tags} categoryName={p!.categoryName} brand={p!.brand} sku={p!.sku} className="aspect-square" />
                        </div>
                        <p className="mt-2 line-clamp-1 text-xs font-semibold text-navy-900 group-hover:text-safety-600">{p!.name}</p>
                        <p className="text-xs font-extrabold text-safety-600">{formatKES(p!.price)}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === "orders" && (
            <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <h2 className="mb-4 font-display text-lg font-extrabold text-navy-900">Order history</h2>
              <OrdersTable orders={orders} loading={loading} />
            </section>
          )}

          {tab === "invoices" && (
            <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <h2 className="mb-4 font-display text-lg font-extrabold text-navy-900">Tax invoices</h2>
              <div className="space-y-3">
                {orders.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-400">Invoices appear here after your first order.</p>
                ) : (
                  orders.map((o) => (
                    <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4">
                      <div>
                        <p className="flex items-center gap-2 text-sm font-bold text-navy-900">
                          Invoice #{o.id}
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                              o.paid === 1 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                            )}
                          >
                            {o.paid === 1 ? <Check className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                            {o.paid === 1 ? "PAID" : "UNPAID"}
                          </span>
                        </p>
                        <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })} · {formatKES(o.total)} incl. VAT</p>
                      </div>
                      <a
                        href={`/api/orders/${o.id}/invoice`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-xs font-bold text-navy-900 hover:bg-surface"
                      >
                        <Download className="h-3.5 w-3.5" /> Download PDF
                      </a>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {tab === "wishlist" && (
            <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <h2 className="mb-4 font-display text-lg font-extrabold text-navy-900">Saved items</h2>
              {wishlistItems.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">Nothing saved yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {wishlistItems.map((p) => (
                    <Link key={p!.id} href={`/product/${p!.slug}`} className="group">
                      <div className="overflow-hidden rounded-xl">
                        <ProductArt tags={p!.tags} categoryName={p!.categoryName} brand={p!.brand} sku={p!.sku} className="aspect-square" />
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs font-semibold text-navy-900 group-hover:text-safety-600">{p!.name}</p>
                      <p className="text-sm font-extrabold text-safety-600">{formatKES(p!.price)}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === "quotes" && (
            <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <h2 className="mb-4 font-display text-lg font-extrabold text-navy-900">Saved quotations</h2>
              <div className="space-y-3">
                {quotes.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-400">
                    No quotes yet — request one from any product page or via the Quote Request button.
                  </p>
                ) : (
                  quotes.map((q) => (
                    <div key={q.id} className="rounded-xl border border-line p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-navy-900">{q.id} · {q.name}</p>
                          <p className="text-xs text-gray-400">{new Date(q.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })} · {q.status} · {q.items.reduce((s, i) => s + i.qty, 0)} items</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-navy-900">{formatKES(q.total)}</span>
                          <span className="rounded-lg bg-navy-900 px-4 py-2 text-xs font-bold text-white opacity-60">
                            {q.status}
                          </span>
                        </div>
                      </div>
                      <ul className="mt-3 space-y-1 border-t border-line pt-3 text-xs text-gray-500">
                        {q.items.map((i) => (
                          <li key={`${q.id}-${i.productId}-${i.name}`} className="flex justify-between">
                            <span>{i.qty} × {i.name}</span>
                            <span>{formatKES(i.price * i.qty)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {tab === "addresses" && <AddressesTab />}
          {tab === "returns" && <ReturnsTab />}
          {tab === "tickets" && <TicketsTab />}
          {tab === "downloads" && <DownloadsTab />}
          {tab === "notifications" && <NotificationsTab />}
        </div>
      </div>
    </div>
  );
}

function OrdersTable({ orders, loading, limit }: { orders: AccountOrder[]; loading: boolean; limit?: number }) {
  const rows = limit ? orders.slice(0, limit) : orders;
  if (loading) return <p className="py-8 text-center text-sm text-gray-400">Loading orders…</p>;
  if (orders.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        No orders yet — <Link href="/search" className="font-bold text-safety-600 hover:underline">start shopping</Link> and your orders will appear here.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
            <th className="pb-3">Order</th>
            <th className="pb-3">Date</th>
            <th className="pb-3">Items</th>
            <th className="pb-3">Total</th>
            <th className="pb-3">Status</th>
            <th className="pb-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id} className="border-b border-line/60 last:border-0">
              <td className="py-3.5 font-bold text-navy-900">#{o.id}</td>
              <td className="py-3.5 text-gray-500">{new Date(o.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</td>
              <td className="py-3.5">
                <div className="flex -space-x-2">
                  {o.items.slice(0, 4).map((i) => {
                    const p = getProduct(i.productId);
                    if (!p) return null;
                    return (
                      <span key={`${o.id}-${i.productId}`} className="h-9 w-9 overflow-hidden rounded-lg border-2 border-white shadow-sm">
                        <ProductArt tags={p.tags} categoryName={p.categoryName} brand={p.brand} sku={p.sku} className="h-full w-full" />
                      </span>
                    );
                  })}
                </div>
              </td>
              <td className="py-3.5 font-bold text-navy-900">{formatKES(o.total)}</td>
              <td className="py-3.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold",
                    o.status === "Delivered" && "bg-emerald-50 text-emerald-700",
                    o.status === "In transit" && "bg-safety-50 text-safety-700",
                    o.status === "Processing" && "bg-amber-50 text-amber-700",
                    o.status === "Cancelled" && "bg-red-50 text-danger"
                  )}
                >
                  {o.status === "Delivered" ? <Check className="h-3 w-3" /> : o.status === "In transit" ? <Truck className="h-3 w-3" /> : o.status === "Cancelled" ? <X className="h-3 w-3" /> : null}
                  {o.status}
                </span>
              </td>
              <td className="py-3.5">
                <button className="flex items-center gap-1 text-xs font-bold text-safety-600 hover:text-safety-700">
                  Details <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
