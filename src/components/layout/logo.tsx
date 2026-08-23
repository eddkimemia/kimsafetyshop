"use client";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { brandedUrl, useSettings } from "@/lib/settings";
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults";
import Link from "next/link";

export function Logo({ light, className }: { light?: boolean; className?: string }) {
  const settings = useSettings();
  const raw = settings.logo || DEFAULT_SETTINGS.logo || "/images/logo/logoy.jpg";
  // Cache-busted by the settings version — a new upload takes effect
  // immediately instead of serving the previous logo from cache.
  const src = brandedUrl(raw);

  return (
    <Link href="/" className={cn("flex items-center", className)} aria-label="KimSafety home">
      <Image
        src={src}
        alt="KimSafety — Safety Equipment Kenya"
        width={360}
        height={120}
        quality={90}
        className={cn("h-10 w-auto object-contain lg:h-12", light && "rounded-lg bg-white px-2 py-1 shadow-sm")}
        priority
      />
    </Link>
  );
}
