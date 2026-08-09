"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { useSettings } from "@/lib/settings";

export function WhatsAppButton() {
  const { whatsapp, site_name } = useSettings();
  const pathname = usePathname();
  const [product, setProduct] = useState<{ name: string; sku?: string; price?: string } | null>(null);

  useEffect(() => {
    setProduct(null);
    const match = pathname?.match(/^\/product\/([^/]+)/);
    if (!match) return;
    let cancelled = false;
    fetch(`/api/catalog?slug=${encodeURIComponent(match[1])}`)
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d: { products?: { name?: string; sku?: string; price?: number }[] }) => {
        if (cancelled) return;
        const p = d.products?.[0];
        if (p?.name) {
          setProduct({
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

  return (
    <a
      href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.45)] transition-transform hover:scale-110 lg:bottom-8"
    >
      <WhatsAppIcon className="h-7 w-7" />
      <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
      </span>
    </a>
  );
}
