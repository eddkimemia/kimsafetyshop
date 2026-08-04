"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Heart, Scale, ShoppingCart } from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { cartCount, wishlist, compare } = useStore();

  const items = [
    { href: "/", label: "Home", icon: Home, match: pathname === "/" },
    { href: "/search", label: "Shop", icon: LayoutGrid, match: pathname.startsWith("/search") },
    { href: "/compare", label: "Compare", icon: Scale, match: pathname === "/compare", count: compare.length },
    { href: "/wishlist", label: "Wishlist", icon: Heart, match: pathname === "/wishlist", count: wishlist.length },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white/95 backdrop-blur-md lg:hidden"
      aria-label="Mobile navigation"
    >
      {items.map(({ href, label, icon: Icon, match, count }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold",
            match ? "text-safety-600" : "text-gray-400"
          )}
        >
          <span className="relative">
            <Icon className="h-5 w-5" />
            {!!count && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                {count}
              </span>
            )}
          </span>
          {label}
        </Link>
      ))}
      <Link
        href="/cart"
        className="relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold text-gray-400"
        aria-label="Open cart"
      >
        <span className="relative">
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-safety-500 px-1 text-[9px] font-bold text-white">
              {cartCount}
            </span>
          )}
        </span>
        Cart
      </Link>
    </nav>
  );
}
