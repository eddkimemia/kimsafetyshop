"use client";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { brandedUrl, useSettings } from "@/lib/settings";
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults";
import Link from "next/link";

export function Logo({ light, className }: { light?: boolean; className?: string }) {
  const settings = useSettings();
  const raw = settings.logo || DEFAULT_SETTINGS.logo || "/images/logo/logoy.png";
  const src = brandedUrl(raw);
  // Upload-backed logos live in DB (rewrite /uploads/documents/* -> /api/uploads/documents/*).
  // Next's optimizer fetch for those fails on serverless (ephemeral disk) and shows a
  // blank logo — bypass optimization for any upload/document path.
  const clean = src.split("?")[0];
  const isUpload = clean.startsWith("/uploads/") || clean.startsWith("/api/uploads/") || clean.startsWith("/documents/");

  return (
    <Link href="/" className={cn("flex items-center", className)} aria-label="KimSafety home">
      <Image
        src={src}
        alt="KimSafety — Safety Equipment Kenya"
        width={360}
        height={120}
        quality={90}
        unoptimized={isUpload}
        className={cn("h-10 w-auto object-contain lg:h-12", light && "rounded-lg bg-white px-2 py-1 shadow-sm")}
        priority
        onError={(e) => {
          // If the configured upload 404s (DB missing), fall back to bundled default so header never blank
          const img = e.currentTarget as HTMLImageElement;
          if (img.src !== DEFAULT_SETTINGS.logo) img.src = DEFAULT_SETTINGS.logo;
        }}
      />
    </Link>
  );
}
