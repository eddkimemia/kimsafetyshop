// Seed the `reviews` table with generated reviews derived from each static
// product's rating/review-count data, so storefront reviews are backed by real
// rows that admins can view, approve, hide, edit and delete.
//
// Usage:  node scripts/seed-reviews.mjs [--local] [--remote]
// Defaults to both databases (.env.local source, .env target).
// Re-running is safe: seed rows (user_id LIKE 'seed-%') are replaced.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function loadEnv(file) {
  const out = {};
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

function mk(url) {
  const ssl = !["localhost", "127.0.0.1", "::1"].includes(new URL(url).hostname);
  return new Pool({ connectionString: url, ssl: ssl ? { rejectUnauthorized: false } : false, max: 2 });
}

const NAMES = [
  "James K.", "Mercy N.", "Peter W.", "Grace A.", "David O.", "Faith M.", "Brian T.", "Lucy W.",
  "Samuel K.", "Esther J.", "Kevin M.", "Agnes C.", "John O.", "Ruth G.", "Daniel K.", "Mary W.",
  "Collins M.", "Jane W.", "Victor O.", "Ann N.", "George K.", "Sarah M.", "Joseph O.", "Naomi W.",
  "Anthony M.", "Diana K.", "Patrick N.", "Eunice M.", "Stephen K.", "Caroline M.",
];

const TITLES = [
  "Excellent quality, exactly as certified",
  "Our go-to supplier for safety equipment",
  "Great product, quick delivery",
  "Meets all standards — highly recommend",
  "Bulk pricing is very competitive",
  "Perfect for our site crew",
  "Genuine product, verified with manufacturer",
  "Fast delivery to our office",
  "Outstanding value for money",
  "Durable and reliable",
];

const TEXTS = [
  "Ordered for our site crew. Certification documents arrived with the goods and everything meets the required standards exactly as listed. Delivery took only two days.",
  "Bulk pricing is competitive and the team responds to quotations within hours. The products are genuine and well packaged.",
  "Same-day delivery to our office. The team was helpful over WhatsApp and the quality matches the description.",
  "We use these for our facility team across multiple sites. Consistent quality and the documentation makes compliance audits easy.",
  "Excellent quality and the bulk discount made it very affordable for our project. Would recommend to any procurement team.",
  "Genuine, certified product with clear labelling. Delivery was on time and the customer service was responsive.",
  "Very satisfied with the purchase. The products arrived in great condition and have held up well in daily use.",
  "Good value for money. The team helped us choose the right products for our industry requirements.",
  "Reliable supplier — second order this year. Products meet the spec sheet and delivery is always on schedule.",
  "Highly recommend to any facility or safety team. Great quality, fair pricing, and dependable delivery.",
];

function rand(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function ratingFor(avg, r) {
  const candidates = [3, 4, 5];
  const rnd = r();
  if (rnd < 0.15) return Math.max(1, Math.round(avg - 1.2));
  if (rnd < 0.35) return Math.max(2, Math.round(avg - 0.4));
  return Math.min(5, Math.round(avg + (r() < 0.6 ? 0.2 : 0.8)));
}

const RETRIES = 5;
async function rq(pool, text, params = []) {
  for (let i = 0; ; i++) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      const msg = err.message ?? "";
      const transient = /too many connections|connection terminated|ECONNRESET|ECONNREFUSED|ETIMEDOUT|53300/.test(msg);
      if (!transient || i >= RETRIES) throw err;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
}

async function seed(pool, products, label) {
  await rq(pool, "DELETE FROM reviews WHERE user_id LIKE 'seed-%'");
  let inserted = 0;
  const now = Date.now();
  for (const p of products) {
    const count = Math.max(0, Math.min(Number(p.reviews) || 0, 12));
    if (count === 0) continue;
    const r = rand(p.sku.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 31 + 7);
    const avg = Number(p.rating) || 4.5;
    const rows = [];
    for (let i = 0; i < count; i++) {
      const name = NAMES[Math.floor(r() * NAMES.length)];
      const rating = ratingFor(avg, r);
      const title = TITLES[Math.floor(r() * TITLES.length)];
      const text = TEXTS[Math.floor(r() * TEXTS.length)];
      const created = new Date(now - Math.floor(r() * 180 * 86400000)).toISOString();
      rows.push([`seed-${p.sku}-${i}`, p.id ?? p.sku, `seed-${p.sku}-${i}`, name, rating, title, text, "approved", 1, 0, created]);
    }
    if (rows.length === 0) continue;
    const values = rows
      .map((_, i) => `($${i * 11 + 1},$${i * 11 + 2},$${i * 11 + 3},$${i * 11 + 4},$${i * 11 + 5},$${i * 11 + 6},$${i * 11 + 7},$${i * 11 + 8},$${i * 11 + 9},$${i * 11 + 10},$${i * 11 + 11})`)
      .join(",");
    await rq(
      pool,
      `INSERT INTO reviews (id, product_id, user_id, user_name, rating, title, text, status, verified, helpful, created_at) VALUES ${values}`,
      rows.flat()
    );
    inserted += rows.length;
  }
  console.log(`${label}: ${inserted} reviews seeded`);
}

const env = { ...process.env, ...loadEnv(".env.local") };
const localUrl = env.DATABASE_URL;
const remoteEnv = { ...process.env, ...loadEnv(".env") };
const remoteUrl = remoteEnv.DATABASE_URL;

// Deliberately explicit: this writes FABRICATED reviews, so the database must
// be named on the command line. It never defaults to the remote (production)
// database — pass --remote only if you really mean it.
const args = process.argv.slice(2);
if (!args.includes("--local") && !args.includes("--remote")) {
  console.error("Usage: node scripts/seed-reviews.mjs --local [--remote]\n--remote writes fabricated reviews to PRODUCTION — use with care.");
  process.exit(1);
}
const doLocal = args.includes("--local");
const doRemote = args.includes("--remote");

// Bundle the static catalog (products.ts) via esbuild into a temp CJS file.
import { execSync } from "child_process";
import { createRequire } from "module";
const bundle = path.join(root, ".tmp-products.cjs");
execSync(`npx esbuild src/lib/data/products.ts --bundle --platform=node --format=cjs --outfile=${JSON.stringify(bundle)}`, {
  cwd: root,
  stdio: "pipe",
});
const require = createRequire(import.meta.url);
const { products } = require(bundle);
fs.unlinkSync(bundle);

const main = async () => {
  if (doLocal && localUrl) {
    const pool = mk(localUrl);
    await seed(pool, products, "Local");
    await pool.end().catch(() => {});
  }
  if (doRemote && remoteUrl) {
    const pool = mk(remoteUrl);
    await seed(pool, products, "Remote");
    await pool.end().catch(() => {});
  }
  console.log("Seed complete.");
};

main().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exitCode = 1;
});
