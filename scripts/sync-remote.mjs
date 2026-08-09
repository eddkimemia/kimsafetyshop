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

async function main() {
  const posts = (await local.query("SELECT * FROM posts ORDER BY created_at ASC")).rows;
  const guides = (await local.query("SELECT * FROM admin_guides ORDER BY updated_at ASC")).rows;
  console.log(`Source: ${posts.length} posts, ${guides.length} guides`);

  let postStats = { added: 0, updated: 0 };
  for (const p of posts) {
    const exists = (await remote.query("SELECT id FROM posts WHERE slug = $1", [p.slug])).rows[0];
    if (exists) {
      await remote.query(
        "UPDATE posts SET title = $1, category = $2, excerpt = $3, content = $4, cover = $5, author = $6, read_time = $7, published = $8, updated_at = $9 WHERE slug = $10",
        [p.title, p.category, p.excerpt, p.content, p.cover, p.author, p.read_time, p.published, p.updated_at, p.slug]
      );
      postStats.updated++;
    } else {
      await remote.query(
        "INSERT INTO posts (id, slug, title, category, excerpt, content, cover, author, read_time, published, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
        [p.id, p.slug, p.title, p.category, p.excerpt, p.content, p.cover, p.author, p.read_time, p.published, p.created_at, p.updated_at]
      );
      postStats.added++;
    }
  }

  let guideStats = { added: 0, updated: 0 };
  for (const g of guides) {
    const exists = (await remote.query("SELECT slug FROM admin_guides WHERE slug = $1", [g.slug])).rows[0];
    if (exists) {
      await remote.query("UPDATE admin_guides SET data = $1, updated_at = $2 WHERE slug = $3", [g.data, g.updated_at, g.slug]);
      guideStats.updated++;
    } else {
      await remote.query("INSERT INTO admin_guides (slug, data, updated_at) VALUES ($1,$2,$3)", [g.slug, g.data, g.updated_at]);
      guideStats.added++;
    }
  }

  console.log(`Posts: ${postStats.added} added, ${postStats.updated} updated`);
  console.log(`Guides: ${guideStats.added} added, ${guideStats.updated} updated`);
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
