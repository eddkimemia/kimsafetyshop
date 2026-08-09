"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  FileText,
  ClipboardList,
  MapPin,
  RotateCcw,
  LifeBuoy,
  Download,
  Bell,
  KeyRound,
  LogOut,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export type OrderItem = {
  productId: string;
  name?: string;
  qty: number;
  price?: number;
  sku?: string;
  datasheetIndex?: number;
};
export type AccountOrder = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string | null;
  po_ref?: string | null;
  items: OrderItem[];
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  status: string;
  payment: string;
  paid?: number;
  created_at: string;
};
export type AccountQuote = {
  id: string;
  name?: string;
  company?: string | null;
  items: OrderItem[];
  total: number;
  status: string;
  created_at: string;
};

type Stats = {
  session: { user?: { name?: string; email?: string } } | null;
  orders: AccountOrder[];
  quotes: AccountQuote[];
  tickets: { id: string; status: string }[];
  unread: number;
  loading: boolean;
};

const StatsContext = createContext<Stats>({ session: null, orders: [], quotes: [], tickets: [], unread: 0, loading: true });
export const useAccountStats = () => useContext(StatsContext);

const nav = [
  ["/account", "Overview", LayoutDashboard],
  ["/account/orders", "Orders", Package],
  ["/account/invoices", "Invoices", FileText],
  ["/account/quotes", "Saved Quotes", ClipboardList],
  ["/account/addresses", "Addresses", MapPin],
  ["/account/password", "Password", KeyRound],
  ["/account/returns", "Returns", RotateCcw],
  ["/account/tickets", "Support Tickets", LifeBuoy],
  ["/account/downloads", "Downloads", Download],
  ["/account/notifications", "Notifications", Bell],
] as const;

export function AccountShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { wishlist, liveProduct } = useStore();
  const [stats, setStats] = useState<Stats>({ session: null, orders: [], quotes: [], tickets: [], unread: 0, loading: true });

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/session").then((r) => r.json()),
      fetch("/api/orders").then((r) => (r.ok ? r.json() : { orders: [] })),
      fetch("/api/quotes").then((r) => (r.ok ? r.json() : { quotes: [] })),
      fetch("/api/tickets").then((r) => (r.ok ? r.json() : { tickets: [] })),
      fetch("/api/notifications").then((r) => (r.ok ? r.json() : { unread: 0 })),
    ])
      .then(([s, o, q, t, n]) => {
        setStats({
          session: s,
          orders: o.orders ?? [],
          quotes: q.quotes ?? [],
          tickets: t.tickets ?? [],
          unread: n.unread ?? 0,
          loading: false,
        });
      })
      .finally(() => setStats((prev) => ({ ...prev, loading: false })));
  }, []);

  const user = stats.session?.user;
  const initials = (user?.name ?? "KS")
    .split(" ")
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const wishlistCount = wishlist.map((id) => liveProduct(id)).filter(Boolean).length;

  return (
    <StatsContext.Provider value={stats}>
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
              <div className="ml-auto grid grid-cols-2 gap-x-8 gap-y-3 text-center sm:flex sm:items-center sm:gap-6">
                <div>
                  <p className="font-display text-xl font-extrabold">{stats.loading ? "…" : stats.orders.length}</p>
                  <p className="text-[11px] text-white/60">Orders</p>
                </div>
                <div>
                  <p className="font-display text-xl font-extrabold">{wishlistCount}</p>
                  <p className="text-[11px] text-white/60">Wishlist</p>
                </div>
                <div>
                  <p className="font-display text-xl font-extrabold">{stats.quotes.length}</p>
                  <p className="text-[11px] text-white/60">Quotes</p>
                </div>
                <div>
                  <p className="font-display text-xl font-extrabold">{stats.loading ? "…" : stats.tickets.length}</p>
                  <p className="text-[11px] text-white/60">Tickets</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-shell px-4 pt-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-[13.5rem_minmax(0,1fr)] md:gap-8">
            {/* Mobile: horizontal tab bar at the top (Returns hidden on mobile) */}
            <aside className="sticky top-20 z-20 h-fit rounded-2xl border border-line bg-white p-1.5 shadow-card md:hidden">
              <nav className="no-scrollbar flex items-center gap-1 overflow-x-auto" aria-label="Account navigation">
                {nav
                  .filter(([href]) => href !== "/account/returns")
                  .map(([href, label, Icon]) => {
                    const active = pathname === href;
                    return (
                      <Link
                        key={href}
                        href={href}
                        aria-current={active ? "page" : undefined}
                        title={label}
                        className={cn(
                          "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                          active ? "bg-navy-900 text-white" : "text-gray-500 hover:bg-surface hover:text-navy-900"
                        )}
                      >
                        <Icon className="h-4.5 w-4.5 shrink-0" />
                        <span className="hidden sm:inline">{label}</span>
                      </Link>
                    );
                  })}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  title="Sign out"
                  className="ml-auto flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border-l border-line px-3 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4.5 w-4.5 shrink-0" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </nav>
            </aside>

            {/* Desktop: sidebar on the left */}
            <aside className="sticky top-20 hidden h-fit rounded-2xl border border-line bg-white p-2 shadow-card md:top-24 md:block md:p-3">
              <nav className="flex flex-col gap-0.5" aria-label="Account navigation">
                {nav.map(([href, label, Icon]) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      title={label}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                        active ? "bg-navy-900 text-white" : "text-gray-500 hover:bg-surface hover:text-navy-900"
                      )}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  title="Sign out"
                  className="mt-2 flex items-center gap-3 rounded-xl border-t border-line px-4 py-3 text-sm font-semibold text-danger"
                >
                  <LogOut className="h-4.5 w-4.5 shrink-0" />
                  <span>Sign Out</span>
                </button>
              </nav>
            </aside>

            <div className="min-w-0">{children}</div>
          </div>
        </div>
      </div>
    </StatsContext.Provider>
  );
}
