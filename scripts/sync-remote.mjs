// One-way sync of admin-created content (blog posts + knowledge guides)
// from the local Postgres (used during development) to the hosted Prisma
// Postgres used by the Vercel deployment.
//
// Usage:  node scripts/sync-remote.mjs
// Reads DATABASE_URL from .env.local (source) and .env (target).

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

const localEnv = { ...process.env, ...loadEnv(".env.local") };
const remoteEnv = { ...process.env, ...loadEnv(".env") };

function mk(url) {
  const ssl = /sslmode=require|sslmode=verify-full/.test(url) || !["localhost", "127.0.0.1", "::1"].includes(new URL(url).hostname);
  return new Pool({ connectionString: url, ssl: ssl ? { rejectUnauthorized: false } : false, max: 2 });
}

const local = mk(localEnv.DATABASE_URL);
const remote = mk(remoteEnv.DATABASE_URL);

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

async function main() {
  const posts = (await local.query("SELECT * FROM posts ORDER BY created_at ASC")).rows;
  const guides = (await local.query("SELECT * FROM admin_guides ORDER BY updated_at ASC")).rows;
  console.log(`Source: ${posts.length} posts, ${guides.length} guides`);

  let postStats = { added: 0, updated: 0 };
  for (const p of posts) {
    const exists = (await rq(remote, "SELECT id FROM posts WHERE slug = $1", [p.slug])).rows[0];
    if (exists) {
      await rq(remote,
        "UPDATE posts SET title = $1, category = $2, excerpt = $3, content = $4, cover = $5, author = $6, read_time = $7, published = $8, updated_at = $9 WHERE slug = $10",
        [p.title, p.category, p.excerpt, p.content, p.cover, p.author, p.read_time, p.published, p.updated_at, p.slug]
      );
      postStats.updated++;
    } else {
      await rq(remote,
        "INSERT INTO posts (id, slug, title, category, excerpt, content, cover, author, read_time, published, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
        [p.id, p.slug, p.title, p.category, p.excerpt, p.content, p.cover, p.author, p.read_time, p.published, p.created_at, p.updated_at]
      );
      postStats.added++;
    }
  }

  let guideStats = { added: 0, updated: 0 };
  for (const g of guides) {
    const exists = (await rq(remote, "SELECT slug FROM admin_guides WHERE slug = $1", [g.slug])).rows[0];
    if (exists) {
      await rq(remote, "UPDATE admin_guides SET data = $1, updated_at = $2 WHERE slug = $3", [g.data, g.updated_at, g.slug]);
      guideStats.updated++;
    } else {
      await rq(remote, "INSERT INTO admin_guides (slug, data, updated_at) VALUES ($1,$2,$3)", [g.slug, g.data, g.updated_at]);
      guideStats.added++;
    }
  }

  const campaignCols = ["name", "slug", "description", "discount_label", "image", "cta_href", "start_date", "end_date", "active", "created_at", "updated_at"];
  const campaigns = (await local.query("SELECT * FROM marketing_campaigns ORDER BY id")).rows;
  let campaignStats = { added: 0, updated: 0 };
  for (const c of campaigns) {
    const exists = (await rq(remote, "SELECT id FROM marketing_campaigns WHERE id = $1", [c.id])).rows[0];
    const vals = campaignCols.map((k) => c[k] ?? null);
    if (exists) {
      await rq(remote, 
        `UPDATE marketing_campaigns SET ${campaignCols.map((k, i) => `${k} = $${i + 1}`).join(", ")} WHERE id = ${c.id}`,
        vals
      );
      campaignStats.updated++;
    } else {
      await rq(remote, 
        `INSERT INTO marketing_campaigns (id, ${campaignCols.join(", ")}) VALUES ($${campaignCols.length + 1}, ${campaignCols.map((_, i) => `$${i + 1}`).join(", ")})`,
        [...vals, c.id]
      );
      campaignStats.added++;
    }
  }

  const bannerCols = ["title", "subtitle", "kicker", "cta", "cta_href", "cta2", "image", "card_kicker", "card_title", "card_subtitle", "stat1_label", "stat1_value", "stat2_label", "stat2_value", "sort", "active", "created_at", "updated_at"];
  const banners = (await local.query("SELECT * FROM marketing_banners ORDER BY id")).rows;
  let bannerStats = { added: 0, updated: 0 };
  for (const b of banners) {
    const exists = (await rq(remote, "SELECT id FROM marketing_banners WHERE id = $1", [b.id])).rows[0];
    const vals = bannerCols.map((k) => b[k] ?? null);
    if (exists) {
      await rq(remote, 
        `UPDATE marketing_banners SET ${bannerCols.map((k, i) => `${k} = $${i + 1}`).join(", ")} WHERE id = ${b.id}`,
        vals
      );
      bannerStats.updated++;
    } else {
      await rq(remote, 
        `INSERT INTO marketing_banners (id, ${bannerCols.join(", ")}) VALUES ($${bannerCols.length + 1}, ${bannerCols.map((_, i) => `$${i + 1}`).join(", ")})`,
        [...vals, b.id]
      );
      bannerStats.added++;
    }
  }

  const settings = (await local.query("SELECT key, value FROM settings ORDER BY key")).rows;
  let settingsStats = { updated: 0 };
  for (const s of settings) {
    await rq(remote, 
      "INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, $3) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
      [s.key, s.value, new Date().toISOString()]
    );
    settingsStats.updated++;
  }

  console.log(`Posts: ${postStats.added} added, ${postStats.updated} updated`);
  console.log(`Guides: ${guideStats.added} added, ${guideStats.updated} updated`);
  console.log(`Campaigns: ${campaignStats.added} added, ${campaignStats.updated} updated`);
  console.log(`Banners: ${bannerStats.added} added, ${bannerStats.updated} updated`);
  console.log(`Settings: ${settingsStats.updated} synced`);
  console.log("Sync complete.");
}

main()
  .catch((e) => {
    console.error("Sync failed:", e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await local.end().catch(() => {});
    await remote.end().catch(() => {});
  });
