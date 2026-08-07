import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKES(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatKESCompact(amount: number): string {
  if (amount >= 1_000_000) return `KSh ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `KSh ${(amount / 1_000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
  return `KSh ${amount}`;
}

export function discountPercent(price: number, oldPrice?: number): number | null {
  if (!oldPrice || oldPrice <= price) return null;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export type BulkTierLike = { qty: string; price: string; savings?: string };

export function bulkUnitPrice(
  product: { price: number; bulk?: BulkTierLike[] },
  qty: number
): number {
  const base = Math.round(Number(product.price));
  if (!Number.isFinite(base) || qty <= 0) return base;
  const tiers = product.bulk ?? [];
  if (tiers.length === 0) return base;

  let best = base;
  let bestFrom = 0;
  for (const tier of tiers) {
    const m = /(\d+)/.exec(String(tier.qty ?? "").replace(/\s/g, ""));
    if (!m) continue;
    const from = Number(m[1]);
    const parsed = Number(String(tier.price ?? "").replace(/[^\d.]/g, ""));
    const unit = Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : base;
    if (from <= qty && from >= bestFrom) {
      bestFrom = from;
      best = unit;
    }
  }
  return best;
}

export function activeBulkTier(
  product: { bulk?: BulkTierLike[] },
  qty: number
): BulkTierLike | undefined {
  const tiers = product.bulk ?? [];
  let best: BulkTierLike | undefined;
  let bestFrom = 0;
  for (const tier of tiers) {
    const m = /(\d+)/.exec(String(tier.qty ?? "").replace(/\s/g, ""));
    if (!m) continue;
    const from = Number(m[1]);
    if (from <= qty && from >= bestFrom) {
      bestFrom = from;
      best = tier;
    }
  }
  return best;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
