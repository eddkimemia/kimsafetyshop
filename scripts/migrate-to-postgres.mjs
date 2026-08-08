#!/usr/bin/env node
/* One-off migration: data/kimsafety.db (SQLite) -> Postgres (DATABASE_URL).
   Usage: node scripts/migrate-to-postgres.mjs [path/to/kimsafety.db] */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import pg from "pg";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dbPath = path.resolve(process.argv[2] ?? path.join(root, "data", "kimsafety.db"));
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}
if (!fs.existsSync(dbPath)) {
  console.error("SQLite database not found:", dbPath);
  process.exit(1);
}

const TABLES = [
  "users",
  "orders",
  "quotes",
  "corporate_applications",
  "purchase_orders",
  "supplier_orders",
  "admin_products",
  "admin_guides",
  "posts",
  "addresses",
  "support_tickets",
  "ticket_replies",
  "returns",
  "notifications",
  "settings",
  "marketing_banners",
  "marketing_campaigns",
  "letters",
];

function extractDdl() {
  const src = fs.readFileSync(path.join(root, "src", "lib", "db.ts"), "utf8");
  const m = src.match(/await d\.query\(`([\s\S]*?)`\);/);
  if (!m) throw new Error("Could not extract DDL from src/lib/db.ts");
  return m[1];
}

const sqlite = new Database(dbPath, { readonly: true });
const ssl = /sslmode=require|sslmode=verify-full/.test(url) ? { rejectUnauthorized: false } : false;
const client = new pg.Client({ connectionString: url, ssl });

async function main() {
  await client.connect();
  const ddl = extractDdl();
  await client.query(ddl);
  console.log("Schema ensured on Postgres.");

  for (const table of TABLES) {
    const rows = sqlite.prepare(`SELECT * FROM "${table}"`).all();
    if (rows.length === 0) {
      console.log(`${table}: 0 rows (skip)`);
      continue;
    }
    const columns = Object.keys(rows[0]);
    const existing = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
      [table]
    );
    const existingCols = new Set(existing.rows.map((r) => r.column_name));
    const cols = columns.filter((c) => existingCols.has(c));
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
    const insert = `INSERT INTO "${table}" ("${cols.join('", "')}") VALUES (${placeholders})`;
    let inserted = 0;
    for (const row of rows) {
      const values = cols.map((c) => (row[c] === undefined ? null : row[c]));
      try {
        await client.query(insert, values);
        inserted += 1;
      } catch (err) {
        console.error(`  ${table}: FAILED row (${row.id ?? row.sku ?? row.key ?? row.slug}): ${err.message}`);
      }
    }
    console.log(`${table}: ${inserted}/${rows.length} rows copied`);
  }

  for (const table of ["marketing_banners", "marketing_campaigns"]) {
    await client.query(
      `SELECT setval(pg_get_serial_sequence('${table}', 'id'), (SELECT COALESCE(MAX(id), 1) FROM "${table}"))`
    );
  }
  console.log("Serial sequences advanced.");

  await client.end();
  sqlite.close();
  console.log("Done. Close the dev server before re-running.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
