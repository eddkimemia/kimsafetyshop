import Database from "better-sqlite3";
import path from "path";
import { randomUUID, scryptSync, randomBytes, timingSafeEqual } from "crypto";

const DB_PATH = path.join(process.cwd(), "data", "kimsafety.db");

export type DbUser = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: "user" | "admin";
  company: string | null;
  phone: string | null;
  verified: number;
  created_at: string;
};

export type DbOrder = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string;
  address: string;
  items: string;
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  status: string;
  payment: string;
  paid: number;
  created_at: string;
};

export type DbQuote = {
  id: string;
  user_id: string | null;
  name: string;
  company: string | null;
  items: string;
  total: number;
  status: string;
  attachment: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  valid_until: string | null;
  created_at: string;
};

export type DbCorporateApplication = {
  id: string;
  company: string;
  kra_pin: string;
  industry: string;
  contact_name: string;
  phone: string;
  email: string;
  notes: string | null;
  documents: string;
  status: string;
  created_at: string;
};

export type DbPurchaseOrder = {
  id: string;
  company: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  po_file: string;
  status: string;
  created_at: string;
};

export type SupplierOrderItem = { name: string; qty: number; unitPrice: number };

export type DbSupplierOrder = {
  id: string;
  supplier: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  items: string;
  subtotal: number;
  shipping: number;
  total: number;
  expected_date: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  initSchema(db);
  return db;
}

function initSchema(d: Database.Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      company TEXT,
      phone TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      items TEXT NOT NULL,
      total INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Processing',
      payment TEXT NOT NULL DEFAULT 'mpesa',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      company TEXT,
      items TEXT NOT NULL,
      total INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS corporate_applications (
      id TEXT PRIMARY KEY,
      company TEXT NOT NULL,
      kra_pin TEXT NOT NULL,
      industry TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      notes TEXT,
      documents TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      company TEXT NOT NULL,
      contact_name TEXT,
      phone TEXT,
      email TEXT,
      po_file TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS supplier_orders (
      id TEXT PRIMARY KEY,
      supplier TEXT NOT NULL,
      contact_name TEXT,
      phone TEXT,
      email TEXT,
      items TEXT NOT NULL,
      subtotal INTEGER NOT NULL DEFAULT 0,
      shipping INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      expected_date TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'Draft',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS admin_products (
      sku TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS admin_guides (
      slug TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'News',
      excerpt TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      cover TEXT,
      author TEXT NOT NULL DEFAULT 'KimSafety Team',
      read_time TEXT NOT NULL DEFAULT '5 min read',
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  addColumnIfMissing(d, "orders", "subtotal", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing(d, "orders", "discount", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing(d, "orders", "shipping", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing(d, "orders", "paid", "INTEGER NOT NULL DEFAULT 1");
  addColumnIfMissing(d, "users", "verified", "INTEGER NOT NULL DEFAULT 1");
  addColumnIfMissing(d, "quotes", "attachment", "TEXT");
  addColumnIfMissing(d, "quotes", "email", "TEXT");
  addColumnIfMissing(d, "quotes", "phone", "TEXT");
  addColumnIfMissing(d, "quotes", "notes", "TEXT");
  addColumnIfMissing(d, "quotes", "valid_until", "TEXT");
  function addColumnIfMissing(db: Database.Database, table: string, column: string, def: string) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!cols.some((c) => c.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
    }
  }
  seedUsers(d);
}

function seedUsers(d: Database.Database) {
  const count = (d.prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number }).c;
  if (count > 0) return;
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@kimsafety.co.ke";
  const adminPass = process.env.ADMIN_PASSWORD ?? "admin123";
  d.prepare(
    "INSERT INTO users (id, name, email, password_hash, role, company, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    randomUUID(),
    "KimSafety Admin",
    adminEmail,
    hashPassword(adminPass),
    "admin",
    "KimSafety Ltd",
    "+254 712 345 678",
    new Date().toISOString()
  );
  console.log(`[kimsafety] Seeded admin user: ${adminEmail} / ${adminPass}`);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function rowToUser(row: DbUser) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    company: row.company,
    phone: row.phone,
    created_at: row.created_at,
  };
}

// ---- Users ----

export function getUserByEmail(email: string): DbUser | undefined {
  return getDb().prepare("SELECT * FROM users WHERE email = ?").get(email) as DbUser | undefined;
}

export function getUserById(id: string): DbUser | undefined {
  return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as DbUser | undefined;
}

export function createUser(input: { name: string; email: string; password: string; company?: string; phone?: string; role?: "user" | "admin"; verified?: number }): DbUser {
  const user: DbUser = {
    id: randomUUID(),
    name: input.name,
    email: input.email.toLowerCase(),
    password_hash: hashPassword(input.password),
    role: input.role ?? "user",
    company: input.company ?? null,
    phone: input.phone ?? null,
    verified: input.verified ?? 1,
    created_at: new Date().toISOString(),
  };
  getDb()
    .prepare("INSERT INTO users (id, name, email, password_hash, role, company, phone, verified, created_at) VALUES (@id, @name, @email, @password_hash, @role, @company, @phone, @verified, @created_at)")
    .run(user);
  return user;
}

export function listUsers(): DbUser[] {
  return getDb().prepare("SELECT * FROM users ORDER BY created_at DESC").all() as DbUser[];
}

export function setUserRole(id: string, role: "user" | "admin") {
  getDb().prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
}

export function setUserVerified(id: string, verified: number) {
  getDb().prepare("UPDATE users SET verified = ? WHERE id = ?").run(verified, id);
}

// ---- Orders ----

export function createOrder(input: { user_id?: string | null; name: string; email: string; phone: string; address: string; items: string; total: number; subtotal?: number; discount?: number; shipping?: number; payment: string }): DbOrder {
  const order: DbOrder = {
    id: `KS-${Math.floor(10000 + Math.random() * 89999)}`,
    user_id: input.user_id ?? null,
    name: input.name,
    email: input.email,
    phone: input.phone,
    address: input.address,
    items: input.items,
    total: input.total,
    subtotal: input.subtotal ?? input.total,
    discount: input.discount ?? 0,
    shipping: input.shipping ?? 0,
    status: "Processing",
    payment: input.payment,
    paid: input.payment === "po" ? 0 : 1,
    created_at: new Date().toISOString(),
  };
  getDb()
    .prepare("INSERT INTO orders (id, user_id, name, email, phone, address, items, total, subtotal, discount, shipping, status, payment, paid, created_at) VALUES (@id, @user_id, @name, @email, @phone, @address, @items, @total, @subtotal, @discount, @shipping, @status, @payment, @paid, @created_at)")
    .run(order);
  return order;
}

export function getOrderById(id: string): DbOrder | undefined {
  return getDb().prepare("SELECT * FROM orders WHERE id = ?").get(id) as DbOrder | undefined;
}

export function setOrderPaid(id: string, paid: number) {
  getDb().prepare("UPDATE orders SET paid = ? WHERE id = ?").run(paid, id);
}

export function listOrders(): DbOrder[] {
  return getDb().prepare("SELECT * FROM orders ORDER BY created_at DESC").all() as DbOrder[];
}

export function ordersForUser(userId: string): DbOrder[] {
  return getDb().prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC").all(userId) as DbOrder[];
}

export function setOrderStatus(id: string, status: string) {
  getDb().prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
}

// ---- Quotes ----

export function createQuote(input: {
  user_id?: string | null;
  name: string;
  company?: string | null;
  items: string;
  total: number;
  attachment?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  valid_until?: string | null;
}): DbQuote {
  const quote: DbQuote = {
    id: `QUO-${Math.floor(1000 + Math.random() * 9000)}`,
    user_id: input.user_id ?? null,
    name: input.name,
    company: input.company ?? null,
    items: input.items,
    total: input.total,
    status: "Open",
    attachment: input.attachment ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    notes: input.notes ?? null,
    valid_until: input.valid_until ?? null,
    created_at: new Date().toISOString(),
  };
  getDb()
    .prepare("INSERT INTO quotes (id, user_id, name, company, items, total, status, attachment, email, phone, notes, valid_until, created_at) VALUES (@id, @user_id, @name, @company, @items, @total, @status, @attachment, @email, @phone, @notes, @valid_until, @created_at)")
    .run(quote);
  return quote;
}

export function getQuoteById(id: string): DbQuote | undefined {
  return getDb().prepare("SELECT * FROM quotes WHERE id = ?").get(id) as DbQuote | undefined;
}

export function listQuotes(): DbQuote[] {
  return getDb().prepare("SELECT * FROM quotes ORDER BY created_at DESC").all() as DbQuote[];
}

export function quotesForUser(userId: string): DbQuote[] {
  return getDb().prepare("SELECT * FROM quotes WHERE user_id = ? ORDER BY created_at DESC").all(userId) as DbQuote[];
}

export function setQuoteStatus(id: string, status: string) {
  getDb().prepare("UPDATE quotes SET status = ? WHERE id = ?").run(status, id);
}

// ---- Corporate account applications ----

export function createCorporateApplication(input: {
  company: string;
  kra_pin: string;
  industry: string;
  contact_name: string;
  phone: string;
  email: string;
  notes?: string | null;
  documents?: string[];
}): DbCorporateApplication {
  const app: DbCorporateApplication = {
    id: `CORP-${Math.floor(1000 + Math.random() * 9000)}`,
    company: input.company,
    kra_pin: input.kra_pin,
    industry: input.industry,
    contact_name: input.contact_name,
    phone: input.phone,
    email: input.email,
    notes: input.notes ?? null,
    documents: JSON.stringify(input.documents ?? []),
    status: "Pending",
    created_at: new Date().toISOString(),
  };
  getDb()
    .prepare(
      "INSERT INTO corporate_applications (id, company, kra_pin, industry, contact_name, phone, email, notes, documents, status, created_at) VALUES (@id, @company, @kra_pin, @industry, @contact_name, @phone, @email, @notes, @documents, @status, @created_at)"
    )
    .run(app);
  return app;
}

export function listCorporateApplications(): DbCorporateApplication[] {
  return getDb().prepare("SELECT * FROM corporate_applications ORDER BY created_at DESC").all() as DbCorporateApplication[];
}

export function setCorporateApplicationStatus(id: string, status: string) {
  getDb().prepare("UPDATE corporate_applications SET status = ? WHERE id = ?").run(status, id);
}

// ---- Purchase orders ----

export function createPurchaseOrder(input: {
  company: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  po_file: string;
}): DbPurchaseOrder {
  const po: DbPurchaseOrder = {
    id: `PO-${Math.floor(1000 + Math.random() * 9000)}`,
    company: input.company,
    contact_name: input.contact_name ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    po_file: input.po_file,
    status: "Pending",
    created_at: new Date().toISOString(),
  };
  getDb()
    .prepare(
      "INSERT INTO purchase_orders (id, company, contact_name, phone, email, po_file, status, created_at) VALUES (@id, @company, @contact_name, @phone, @email, @po_file, @status, @created_at)"
    )
    .run(po);
  return po;
}

export function listPurchaseOrders(): DbPurchaseOrder[] {
  return getDb().prepare("SELECT * FROM purchase_orders ORDER BY created_at DESC").all() as DbPurchaseOrder[];
}

export function setPurchaseOrderStatus(id: string, status: string) {
  getDb().prepare("UPDATE purchase_orders SET status = ? WHERE id = ?").run(status, id);
}

// ---- Supplier purchase orders (KimSafety buys stock from suppliers) ----

export function createSupplierOrder(input: {
  supplier: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  items: SupplierOrderItem[];
  shipping?: number;
  expected_date?: string | null;
  notes?: string | null;
}): DbSupplierOrder {
  const subtotal = Math.round(
    input.items.reduce((sum, i) => sum + (i.qty || 0) * (i.unitPrice || 0), 0)
  );
  const shipping = Math.round(input.shipping ?? 0);
  const po: DbSupplierOrder = {
    id: `SPO-${Math.floor(1000 + Math.random() * 9000)}`,
    supplier: input.supplier,
    contact_name: input.contact_name ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    items: JSON.stringify(input.items),
    subtotal,
    shipping,
    total: subtotal + shipping,
    expected_date: input.expected_date ?? null,
    notes: input.notes ?? null,
    status: "Draft",
    created_at: new Date().toISOString(),
  };
  getDb()
    .prepare(
      "INSERT INTO supplier_orders (id, supplier, contact_name, phone, email, items, subtotal, shipping, total, expected_date, notes, status, created_at) VALUES (@id, @supplier, @contact_name, @phone, @email, @items, @subtotal, @shipping, @total, @expected_date, @notes, @status, @created_at)"
    )
    .run(po);
  return po;
}

export function listSupplierOrders(): DbSupplierOrder[] {
  return getDb().prepare("SELECT * FROM supplier_orders ORDER BY created_at DESC").all() as DbSupplierOrder[];
}

export function getSupplierOrder(id: string): DbSupplierOrder | undefined {
  return getDb().prepare("SELECT * FROM supplier_orders WHERE id = ?").get(id) as DbSupplierOrder | undefined;
}

export function setSupplierOrderStatus(id: string, status: string) {
  getDb().prepare("UPDATE supplier_orders SET status = ? WHERE id = ?").run(status, id);
}

// ---- Admin-managed products & guides (JSON overrides) ----

export function listAdminProducts(): { sku: string; data: unknown; updated_at: string }[] {
  return getDb().prepare("SELECT * FROM admin_products ORDER BY updated_at DESC").all() as { sku: string; data: unknown; updated_at: string }[];
}

export function getAdminProduct(sku: string) {
  const row = getDb().prepare("SELECT data FROM admin_products WHERE sku = ?").get(sku) as { data: string } | undefined;
  return row ? JSON.parse(row.data) : undefined;
}

export function upsertAdminProduct(sku: string, data: unknown) {
  getDb()
    .prepare("INSERT INTO admin_products (sku, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(sku) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at")
    .run(sku, JSON.stringify(data), new Date().toISOString());
}

export function deleteAdminProduct(sku: string) {
  getDb().prepare("DELETE FROM admin_products WHERE sku = ?").run(sku);
}

export function listAdminGuides(): { slug: string; data: unknown; updated_at: string }[] {
  return getDb().prepare("SELECT * FROM admin_guides ORDER BY updated_at DESC").all() as { slug: string; data: unknown; updated_at: string }[];
}

export function getAdminGuide(slug: string) {
  const row = getDb().prepare("SELECT data FROM admin_guides WHERE slug = ?").get(slug) as { data: string } | undefined;
  return row ? JSON.parse(row.data) : undefined;
}

export function upsertAdminGuide(slug: string, data: unknown) {
  getDb()
    .prepare("INSERT INTO admin_guides (slug, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(slug) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at")
    .run(slug, JSON.stringify(data), new Date().toISOString());
}

export function deleteAdminGuide(slug: string) {
  getDb().prepare("DELETE FROM admin_guides WHERE slug = ?").run(slug);
}

// ---- Blog posts ----

export type DbPost = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  cover: string | null;
  author: string;
  read_time: string;
  published: number;
  created_at: string;
  updated_at: string;
};

export type PostInput = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  cover?: string | null;
  author?: string;
  read_time?: string;
  published?: boolean;
};

export function listPosts(includeUnpublished = false): DbPost[] {
  const sql = includeUnpublished
    ? "SELECT * FROM posts ORDER BY created_at DESC"
    : "SELECT * FROM posts WHERE published = 1 ORDER BY created_at DESC";
  return getDb().prepare(sql).all() as DbPost[];
}

export function getPostBySlug(slug: string, includeUnpublished = false): DbPost | undefined {
  const sql = includeUnpublished
    ? "SELECT * FROM posts WHERE slug = ?"
    : "SELECT * FROM posts WHERE slug = ? AND published = 1";
  return getDb().prepare(sql).get(slug) as DbPost | undefined;
}

export function createPost(input: PostInput): DbPost {
  const post: DbPost = {
    id: randomUUID(),
    slug: input.slug,
    title: input.title,
    category: input.category,
    excerpt: input.excerpt,
    content: input.content,
    cover: input.cover ?? null,
    author: input.author ?? "KimSafety Team",
    read_time: input.read_time ?? "5 min read",
    published: input.published === false ? 0 : 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  getDb()
    .prepare(
      "INSERT INTO posts (id, slug, title, category, excerpt, content, cover, author, read_time, published, created_at, updated_at) VALUES (@id, @slug, @title, @category, @excerpt, @content, @cover, @author, @read_time, @published, @created_at, @updated_at)"
    )
    .run(post);
  return post;
}

export function updatePost(slug: string, input: PostInput): DbPost | undefined {
  const existing = getPostBySlug(slug, true);
  if (!existing) return undefined;
  const updated: DbPost = {
    ...existing,
    slug: input.slug,
    title: input.title,
    category: input.category,
    excerpt: input.excerpt,
    content: input.content,
    cover: input.cover ?? existing.cover,
    author: input.author ?? existing.author,
    read_time: input.read_time ?? existing.read_time,
    published: input.published === false ? 0 : 1,
    updated_at: new Date().toISOString(),
  };
  getDb()
    .prepare(
      "UPDATE posts SET slug = @slug, title = @title, category = @category, excerpt = @excerpt, content = @content, cover = @cover, author = @author, read_time = @read_time, published = @published, updated_at = @updated_at WHERE id = @id"
    )
    .run(updated);
  return updated;
}

export function deletePost(slug: string) {
  getDb().prepare("DELETE FROM posts WHERE slug = ?").run(slug);
}
