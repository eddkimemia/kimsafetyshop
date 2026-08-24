/**
 * One-time (idempotent) migration: push every product from the static seed
 * file (src/lib/data/products.ts) into the admin_products table as
 * `static:true` override rows.
 *
 * Purpose: make the database the single source of truth for products so the
 * storefront/admin no longer depend on a hardcoded array that can drift out of
 * sync with DB overrides.
 *
 * Safety:
 * - Existing rows are NEVER overwritten (`ON CONFLICT (sku) DO NOTHING`) —
 *   any admin edits already stored in the DB are preserved.
 * - Only rows that are missing entirely are inserted.
 *
 * Usage:
 *   DATABASE_URL=postgres://... npx tsx scripts/sync-seed-products.ts
 *   (or `npm run sync:seed-products`; .env.local overrides .env like elsewhere)
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { products } from "../src/lib/data/products";
import pg from "pg";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/** .env.local wins over .env, matching how scripts/sync-remote.mjs treats them. */
function loadEnv(file: string): Record<string, string> {
  const out: Record<string, string> = {};
  const abs = path.join(root, file);
  if (!fs.existsSync(abs)) return out;
  for (const line of fs.readFileSync(abs, "utf8").split("\n")) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

const env = { ...process.env, ...loadEnv(".env"), ...loadEnv(".env.local") };
const url = env.DATABASE_URL;
if (!url) {
  console.error("sync-seed-products: DATABASE_URL is required");
  process.exit(1);
}

async function main(databaseUrl: string) {
  const host = new URL(databaseUrl).hostname;
  const ssl = !["localhost", "127.0.0.1", "::1"].includes(host) ? { rejectUnauthorized: false } : false;
  const client = new pg.Client({ connectionString: databaseUrl, ssl });
  await client.connect();

  const existing = new Set(
    (await client.query("SELECT sku FROM admin_products")).rows.map((r: { sku: string }) => r.sku)
  );

  let inserted = 0;
  let skipped = 0;
  for (const p of products) {
    if (existing.has(p.sku)) {
      skipped++;
      continue;
    }
    await client.query(
      "INSERT INTO admin_products (sku, data, updated_at) VALUES ($1, $2, $3)",
      [p.sku, JSON.stringify({ ...p, static: true }), new Date().toISOString()]
    );
    inserted++;
  }

  console.log(`sync-seed-products: ${products.length} seed products -> ${inserted} inserted, ${skipped} already present (left untouched).`);
  await client.end();
}

main(url).catch((err) => {
  console.error("sync-seed-products failed:", err.message);
  process.exitCode = 1;
});
