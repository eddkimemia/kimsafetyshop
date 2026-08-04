import { guides } from "@/lib/data/content";
import { listAdminGuides } from "@/lib/db";
import { sanitizePostHtml } from "@/lib/blog";
import type { Guide } from "@/lib/types";

export function mergedGuides(): Guide[] {
  const overrides = listAdminGuides().reduce<Record<string, Record<string, unknown>>>((acc, row) => {
    acc[row.slug] = JSON.parse(String(row.data)) as Record<string, unknown>;
    return acc;
  }, {});

  const merged = guides.map((g) => ({ ...g, ...(overrides[g.slug] ?? {}) }));

  const custom = listAdminGuides()
    .filter((row) => !(JSON.parse(String(row.data)) as { static?: boolean }).static)
    .map((row) => JSON.parse(String(row.data)) as Guide);
  return [...merged, ...custom];
}

export function sanitizeGuideHtml(html: string): string {
  return sanitizePostHtml(html);
}
