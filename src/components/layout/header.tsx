"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Heart,
  ShoppingCart,
  ClipboardList,
  Globe,
  Menu,
  X,
  FileText,
  Search,
  Scale,
} from "lucide-react";
import { Logo } from "./logo";
import { SmartSearch } from "./smart-search";
import { AuthStatus } from "./auth-status";
import { useStore } from "@/lib/store";
import { megaCategories } from "@/lib/data/catalog";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/settings";

const megaLabels: Record<string, string> = {
  "Medical Safety": "medical-safety",
  "Industrial Safety": "industrial-safety",
  "Road Safety": "road-safety",
  "Construction Safety": "construction-safety",
  "Fire Safety": "fire-safety",
  "Electrical Safety": "electrical-safety",
  "Laboratory Equipment": "laboratory-equipment",
  "Cleaning & Hygiene": "cleaning-hygiene",
  "Emergency Response": "emergency-response",
  "Marine Safety": "marine-safety",
  "Security Equipment": "security-equipment",
  "Food Safety": "food-safety",
  PPE: "ppe",
  Tools: "tools",
  "Signs & Labels": "signs-labels",
};

export function Header() {
  const { cartCount, wishlist, compare } = useStore();
  const { whatsapp } = useSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenuOpen(true);
  };
  const closeMenu = () => {
    closeTimer.current = setTimeout(() => setMenuOpen(false), 160);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-shell px-4 lg:px-8">
        <div className="flex h-[72px] items-center gap-4">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-navy-900 lg:hidden"
            onClick={() => setMobileNav(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Logo className="shrink-0" />

          <SmartSearch className="hidden flex-1 lg:block" />

          <div className="ml-auto flex items-center gap-1 lg:ml-4">
            <AuthStatus />
            <button
              onClick={() => setMobileSearch((v) => !v)}
              className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-surface lg:hidden"
              aria-label="Search products"
              aria-expanded={mobileSearch}
            >
              <Search className="h-5 w-5 text-navy-900" />
            </button>
            <Link
              href="/compare"
              className="relative hidden h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-surface sm:flex"
              aria-label={`Compare, ${compare.length} items`}
            >
              <Scale className="h-5 w-5 text-navy-900" />
              {compare.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-safety-500 px-1 text-[10px] font-bold text-white">
                  {compare.length}
                </span>
              )}
            </Link>
            <Link
              href="/wishlist"
              className="relative hidden h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-surface sm:flex"
              aria-label={`Wishlist, ${wishlist.length} items`}
            >
              <Heart className="h-5 w-5 text-navy-900" />
              {wishlist.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              className="relative flex h-11 items-center gap-2 rounded-xl bg-navy-900 px-3.5 text-white transition-colors hover:bg-navy-800"
              aria-label={`Cart, ${cartCount} items`}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden text-xs font-bold md:block">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-safety-500 px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {mobileSearch && (
          <div className="pb-3 lg:hidden">
            <SmartSearch />
          </div>
        )}

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Categories">
          <div onMouseEnter={openMenu} onMouseLeave={closeMenu}>
            <button
              className="flex h-11 items-center gap-1.5 rounded-t-xl bg-surface px-4 text-sm font-bold text-navy-900"
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              <Menu className="h-4 w-4" />
              All Categories
              <ChevronDown className={cn("h-4 w-4 transition-transform", menuOpen && "rotate-180")} />
            </button>
          </div>
          <Link href="/brands" className="flex h-11 items-center px-4 text-sm font-medium text-navy-800 transition-colors hover:text-safety-600">
            Brands
          </Link>
          <Link href="/corporate" className="flex h-11 items-center px-4 text-sm font-medium text-navy-800 transition-colors hover:text-safety-600">
            Corporate
          </Link>
          <Link href="/deals" className="flex h-11 items-center px-4 text-sm font-bold text-navy-900 transition-colors hover:text-safety-600">
            Deals
          </Link>
          <Link
            href="/quote"
            className="mx-2 flex h-8 items-center gap-1.5 rounded-full bg-safety-50 px-3.5 text-xs font-bold text-safety-700 transition-colors hover:bg-safety-100"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Request Quote
          </Link>
          <Link href="/knowledge" className="flex h-11 items-center px-4 text-sm font-medium text-navy-800 transition-colors hover:text-safety-600">
            Knowledge Center
          </Link>
          <Link href="/blog" className="flex h-11 items-center px-4 text-sm font-medium text-navy-800 transition-colors hover:text-safety-600">
            Blog
          </Link>
          <Link href="/support" className="flex h-11 items-center px-4 text-sm font-medium text-navy-800 transition-colors hover:text-safety-600">
            Support
          </Link>
          <Link href="/contact" className="flex h-11 items-center px-4 text-sm font-medium text-navy-800 transition-colors hover:text-safety-600">
            Contact
          </Link>
          <Link href="/about" className="flex h-11 items-center px-4 text-sm font-medium text-navy-800 transition-colors hover:text-safety-600">
            About
          </Link>
          <span className="ml-auto flex items-center gap-2 text-xs text-gray-400">
            <Globe className="h-3.5 w-3.5" /> EN / KSh
          </span>
        </nav>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-x-0 top-full hidden border-t border-line bg-white shadow-soft lg:block"
            onMouseEnter={openMenu}
            onMouseLeave={closeMenu}
          >
            <div className="mx-auto grid max-w-shell grid-cols-5 gap-x-6 gap-y-4 px-8 py-8">
              {megaCategories.map((cat) => (
                <Link
                  key={cat.title}
                  href={`/category/${megaLabels[cat.title]}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center rounded-xl border border-line bg-surface px-4 py-3.5 text-center text-sm font-bold text-navy-900 transition-colors hover:border-safety-300 hover:bg-safety-50 hover:text-safety-700"
                >
                  {cat.title}
                </Link>
              ))}
            </div>
            <div className="border-t border-line bg-navy-900">
              <div className="mx-auto flex max-w-shell items-center justify-between px-8 py-4">
                <p className="text-sm text-white/80">
                  Need help choosing the right PPE?{" "}
                  <a href={`https://wa.me/${whatsapp}`} className="font-bold text-safety-400">
                    Chat with a safety specialist
                  </a>
                </p>
                <Link
                  href="/corporate"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-sm font-bold text-white"
                >
                  <FileText className="h-4 w-4 text-safety-400" /> Corporate Solutions
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>

      <MobileNav open={mobileNav} onClose={() => setMobileNav(false)} />
    </>
  );
}

function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { whatsapp } = useSettings();
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white shadow-soft"
          >
            <div className="flex items-center justify-between border-b border-line p-4">
              <Logo />
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-line"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <SmartSearch className="mb-4 lg:hidden" />
              <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                {[
                  ["All Products", "/search"],
                  ["Deals", "/deals"],
                  ["Request Quote", "/quote"],
                  ["Brands", "/brands"],
                  ["Corporate Solutions", "/corporate"],
                  ["Knowledge Center", "/knowledge"],
                  ["Blog", "/blog"],
                  ["Support", "/support"],
                  ["Contact", "/contact"],
                  ["About", "/about"],
                  ["My Account", "/account"],
                  ["Compare", "/compare"],
                  ["Wishlist", "/wishlist"],
                ].map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className="rounded-xl px-3 py-3 text-sm font-semibold text-navy-900 transition-colors hover:bg-surface"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <p className="mb-2 mt-5 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Categories
              </p>
              <nav className="flex flex-col gap-1">
                {megaCategories.map((cat) => (
                  <Link
                    key={cat.title}
                    href={`/category/${megaLabels[cat.title]}`}
                    onClick={onClose}
                    className="rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-surface"
                  >
                    {cat.title}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="border-t border-line p-4">
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-bold text-white"
              >
                WhatsApp Us
              </a>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
