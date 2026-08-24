import fs from "fs";
import pg from "pg";
const env = fs.readFileSync(".env", "utf8");
const url = env.match(/^DATABASE_URL='?([^'\r\n]+)'?/m)[1];
const key = env.match(/^PAYSTACK_SECRET_KEY=(.+)$/m)[1].trim();
const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, max: 1 });
const { rows } = await pool.query("SELECT id, total, paystack_reference FROM orders WHERE payment='card' AND paid=0 AND paystack_reference IS NOT NULL ORDER BY created_at DESC");
let paidButUnmarked = [];
for (const r of rows) {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(r.paystack_reference)}`, { headers: { Authorization: `Bearer ${key}` } });
  const j = await res.json().catch(() => ({}));
  const st = j?.data?.status;
  console.log(`${r.id}  total=${r.total}  ps_status=${st}  ps_amount=${j?.data?.amount}`);
  if (st === "success") paidButUnmarked.push({ id: r.id, db_total: r.total, ps_amount_pesewas: j.data.amount });
}
console.log("\nPAID ON PAYSTACK BUT UNMARKED IN DB:", JSON.stringify(paidButUnmarked));
await pool.end();
