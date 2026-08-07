"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Package, ShoppingCart, Users, ClipboardList, Building2, BookOpen, Newspaper, LogOut, ShieldCheck, Menu, X, ArrowLeft, Truck, Store, Settings, FileText, Megaphone, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/logo";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { useSettings } from "@/lib/settings";

const nav = [
  ["/admin", "Dashboard", LayoutDashboard],
  ["/admin/products", "Products", Package],
  ["/admin/orders", "Orders", ShoppingCart],
  ["/admin/purchases", "Purchases", Truck],
  ["/admin/quotes", "Quotes", ClipboardList],
  ["/admin/corporate", "Corporate", Building2],
  ["/admin/content", "Knowledge", BookOpen],
  ["/admin/blog", "Blog", Newspaper],
  ["/admin/marketing", "Marketing", Megaphone],
  ["/admin/tickets", "Tickets", LifeBuoy],
] as const;

const badgeHrefs: Record<string, string> = {
  "/admin/orders": "orders",
  "/admin/tickets": "tickets",
  "/admin/quotes": "quotes",
};

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-1 inline-flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { whatsapp } = useSettings();
  const [role, setRole] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [badges, setBadges] = useState<{ orders: number; tickets: number; quotes: number }>({ orders: 0, tickets: 0, quotes: 0 });

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((s) => {
        if (alive) setRole(s?.user?.role ?? null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/admin/nav-badges")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (alive && d?.badges) setBadges(d.badges);
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 60000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const navItems = (role === "superadmin" ? nav : nav.filter(([href]) => (href as string) !== "/admin/settings")) as typeof nav;

  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-surface" style={{ overflowX: "clip" }}>
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-shell items-center gap-3 px-4 lg:px-8">
          <button
            onClick={() => setDrawer(true)}
            aria-label="Open navigation"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-navy-900 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
            <Logo />
            <span className="hidden shrink-0 items-center gap-1 rounded-full bg-safety-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-safety-700 sm:flex">
              <ShieldCheck className="h-3 w-3" /> Admin Panel
            </span>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Link
              href="/admin/users"
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors",
                pathname.startsWith("/admin/users")
                  ? "border-safety-300 bg-safety-50 text-safety-600"
                  : "border-line text-navy-900 hover:bg-surface"
              )}
            >
              <Users className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Users</span>
            </Link>
            <Link
              href="/admin/docs"
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors",
                pathname.startsWith("/admin/docs")
                  ? "border-safety-300 bg-safety-50 text-safety-600"
                  : "border-line text-navy-900 hover:bg-surface"
              )}
            >
              <FileText className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Docs</span>
            </Link>
            {role === "superadmin" && (
              <Link
                href="/admin/settings"
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors",
                  pathname.startsWith("/admin/settings")
                    ? "border-safety-300 bg-safety-50 text-safety-600"
                    : "border-line text-navy-900 hover:bg-surface"
                )}
              >
                <Settings className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Settings</span>
              </Link>
            )}
            <Link
              href="/"
              className="hidden items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-bold text-navy-900 transition-colors hover:bg-surface md:flex"
            >
              <Store className="h-3.5 w-3.5" /> View storefront
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-bold text-navy-900 transition-colors hover:bg-surface"
            >
              <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
        <nav className="hidden border-t border-line lg:block" aria-label="Admin navigation">
          <div className="no-scrollbar mx-auto flex max-w-shell items-center gap-1 overflow-x-auto px-8">
            {navItems.map(([href, label, Icon]) => {
              const active = isActive(pathname, href);
              const badgeKey = badgeHrefs[href];
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-3 text-sm font-semibold transition-colors",
                    active
                      ? "border-safety-500 text-safety-600"
                      : "border-transparent text-navy-800 hover:text-safety-600"
                  )}
                >
                  <Icon className="h-4 w-4" /> {label}
                  {badgeKey ? <NavBadge count={badges[badgeKey as keyof typeof badges]} /> : null}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main id="main" className="min-w-0 flex-1 p-4 lg:p-8">{children}</main>

      <footer className="bg-navy-900 text-white">
        <div className="border-t border-white/10 py-4">
          <div className="mx-auto flex max-w-shell flex-col items-center justify-between gap-2 px-4 text-xs text-white/40 lg:flex-row lg:px-8">
            <p>© {new Date().getFullYear()} KimSafety. All rights reserved.</p>
            <p>KimSafety Admin Panel</p>
          </div>
        </div>
      </footer>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col bg-navy-900 text-white shadow-soft">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <Logo light />
              <button
                onClick={() => setDrawer(false)}
                aria-label="Close navigation"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-auto p-4" aria-label="Mobile admin navigation">
              <p className="mb-2 flex items-center gap-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-white/40">
                <ShieldCheck className="h-3.5 w-3.5 text-safety-400" /> Admin Panel
              </p>
              {navItems.map(([href, label, Icon]) => {
                const active = isActive(pathname, href);
                const badgeKey = badgeHrefs[href];
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setDrawer(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3.5 py-3.5 text-sm font-semibold transition-colors",
                      active ? "bg-safety-500 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className="h-4.5 w-4.5" /> {label}
                    {badgeKey ? <NavBadge count={badges[badgeKey as keyof typeof badges]} /> : null}
                  </Link>
                );
              })}
            </nav>
            <div className="space-y-2 border-t border-white/10 p-4">
              <Link
                href="/"
                onClick={() => setDrawer(false)}
                className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to storefront
              </Link>
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-[#25D366]/15 px-3.5 py-2.5 text-xs font-bold text-[#25D366]"
              >
                <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp Support
              </a>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
