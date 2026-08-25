"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Phone, ClipboardList } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { useSettings } from "@/lib/settings";

export function WhatsAppButton() {
  const { whatsapp, site_name, phone } = useSettings();
  const pathname = usePathname();
  const [product, setProduct] = useState<{ id?: string; name: string; sku?: string; price?: string } | null>(null);

  useEffect(() => {
    setProduct(null);
    const match = pathname?.match(/^\/product\/([^/]+)/);
    if (!match) return;
    let cancelled = false;
    fetch(`/api/catalog?slug=${encodeURIComponent(match[1])}`)
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d: { products?: { id?: string; name?: string; sku?: string; price?: number }[] }) => {
        if (cancelled) return;
        const p = d.products?.[0];
        if (p?.name) {
          setProduct({
            id: p.id,
            name: p.name,
            sku: p.sku,
            price: p.price != null ? `KSh ${p.price.toLocaleString()}` : undefined,
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const message = product
    ? `Hello ${site_name}! I'd like to order: ${product.name}${product.sku ? ` (${product.sku})` : ""}${product.price ? ` — ${product.price}` : ""}.`
    : `Hello ${site_name}! I need help with a safety equipment order.`;

  const waHref = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
  const telHref = `tel:${(phone || "+254715135141").replace(/[^\d+]/g, "")}`;
  const quoteHref = product?.id ? `/quote?product=${encodeURIComponent(product.id)}` : "/quote";

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2.5 lg:bottom-6 lg:right-6 lg:gap-3">
      {/* Get Quote — top */}
      <Link
        href={quoteHref}
        aria-label="Get quote"
        className="group flex h-12 w-12 items-center justify-center rounded-full bg-safety-500 text-white shadow-[0_8px_24px_rgba(245,124,0,0.4)] transition-transform hover:scale-105 lg:h-auto lg:w-auto lg:justify-start lg:gap-2.5 lg:rounded-full lg:px-5 lg:py-3 lg:shadow-lg"
      >
        <ClipboardList className="h-5 w-5 shrink-0 lg:h-5 lg:w-5" />
        <span className="hidden text-sm font-bold lg:inline">Get Quote</span>
        <span className="sr-only lg:hidden">Get Quote</span>
      </Link>

      {/* Call us — middle */}
      <a
        href={telHref}
        aria-label="Call us"
        className="group flex h-12 w-12 items-center justify-center rounded-full bg-navy-900 text-white shadow-[0_8px_24px_rgba(15,40,71,0.35)] transition-transform hover:scale-105 lg:h-auto lg:w-auto lg:justify-start lg:gap-2.5 lg:rounded-full lg:px-5 lg:py-3 lg:shadow-lg"
      >
        <Phone className="h-5 w-5 shrink-0 lg:h-5 lg:w-5" />
        <span className="hidden text-sm font-bold lg:inline">Call Us</span>
        <span className="sr-only lg:hidden">Call Us</span>
      </a>

      {/* WhatsApp — bottom (primary) */}
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.45)] transition-transform hover:scale-105 lg:h-auto lg:w-auto lg:justify-start lg:gap-2.5 lg:rounded-full lg:px-5 lg:py-3 lg:shadow-lg"
      >
        <WhatsAppIcon className="h-5 w-5 shrink-0 lg:h-5 lg:w-5" />
        <span className="hidden text-sm font-bold lg:inline">WhatsApp Us</span>
        <span className="sr-only lg:hidden">WhatsApp Us</span>
        <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 lg:hidden">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
        </span>
      </a>
    </div>
  );
}
