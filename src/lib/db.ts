import Database from "better-sqlite3";
import path from "path";
import { randomUUID, scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults";

const DB_PATH = path.join(process.cwd(), "data", "kimsafety.db");

export type DbUser = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: "user" | "admin" | "superadmin";
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
  po_ref: string | null;
  company: string | null;
  po_file: string | null;
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

export type DbAddress = {
  id: string;
  user_id: string;
  label: string;
  name: string;
  phone: string;
  address_line: string;
  city: string;
  county: string;
  is_default: number;
  created_at: string;
};

export type DbTicket = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type DbTicketReply = {
  id: string;
  ticket_id: string;
  user_id: string | null;
  staff_name: string | null;
  message: string;
  created_at: string;
};

export type DbReturn = {
  id: string;
  user_id: string;
  order_id: string;
  product_name: string;
  qty: number;
  reason: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type DbNotification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: number;
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
  d.exec(`
    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT 'Home',
      name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      address_line TEXT NOT NULL,
      city TEXT NOT NULL DEFAULT '',
      county TEXT NOT NULL DEFAULT '',
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Open',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ticket_replies (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      user_id TEXT,
      staff_name TEXT,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS returns (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      order_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      qty INTEGER NOT NULL DEFAULT 1,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Requested',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'general',
      title TEXT NOT NULL,
      message TEXT NOT NULL DEFAULT '',
      link TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);
  addColumnIfMissing(d, "orders", "subtotal", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing(d, "orders", "discount", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing(d, "orders", "shipping", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing(d, "orders", "paid", "INTEGER NOT NULL DEFAULT 1");
  addColumnIfMissing(d, "orders", "po_ref", "TEXT");
  addColumnIfMissing(d, "orders", "company", "TEXT");
  addColumnIfMissing(d, "orders", "po_file", "TEXT");
  addColumnIfMissing(d, "users", "verified", "INTEGER NOT NULL DEFAULT 1");
  addColumnIfMissing(d, "quotes", "attachment", "TEXT");
  addColumnIfMissing(d, "quotes", "email", "TEXT");
  addColumnIfMissing(d, "quotes", "phone", "TEXT");
  addColumnIfMissing(d, "quotes", "notes", "TEXT");
  addColumnIfMissing(d, "quotes", "valid_until", "TEXT");
  d.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );
  `);
  d.exec(`
    CREATE TABLE IF NOT EXISTS marketing_banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL DEFAULT '',
      kicker TEXT NOT NULL DEFAULT 'KimSafety',
      cta TEXT NOT NULL DEFAULT 'Shop Now',
      cta_href TEXT NOT NULL DEFAULT '/search',
      cta2 TEXT NOT NULL DEFAULT 'Request a Quote',
      image TEXT NOT NULL,
      card_kicker TEXT NOT NULL DEFAULT '',
      card_title TEXT NOT NULL DEFAULT '',
      card_subtitle TEXT NOT NULL DEFAULT '',
      stat1_label TEXT NOT NULL DEFAULT 'Trusted by',
      stat1_value TEXT NOT NULL DEFAULT '1,200+ Organizations',
      stat2_label TEXT NOT NULL DEFAULT 'Delivered to',
      stat2_value TEXT NOT NULL DEFAULT '47 Counties',
      sort INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS marketing_campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      discount_label TEXT NOT NULL DEFAULT '',
      image TEXT,
      cta_href TEXT NOT NULL DEFAULT '/search',
      start_date TEXT,
      end_date TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  addColumnIfMissing(d, "marketing_banners", "card_kicker", "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(d, "marketing_banners", "card_title", "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(d, "marketing_banners", "card_subtitle", "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(d, "marketing_banners", "stat1_label", "TEXT NOT NULL DEFAULT 'Trusted by'");
  addColumnIfMissing(d, "marketing_banners", "stat1_value", "TEXT NOT NULL DEFAULT '1,200+ Organizations'");
  addColumnIfMissing(d, "marketing_banners", "stat2_label", "TEXT NOT NULL DEFAULT 'Delivered to'");
  addColumnIfMissing(d, "marketing_banners", "stat2_value", "TEXT NOT NULL DEFAULT '47 Counties'");
  seedMarketing(d);
  d.exec(`
    CREATE TABLE IF NOT EXISTS letters (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'Official Letter',
      recipient_name TEXT NOT NULL,
      recipient_title TEXT,
      recipient_company TEXT,
      recipient_address TEXT,
      subject TEXT NOT NULL DEFAULT '',
      salutation TEXT NOT NULL DEFAULT 'Dear Sir/Madam',
      body TEXT NOT NULL,
      closing TEXT NOT NULL DEFAULT 'Yours faithfully',
      sender_name TEXT NOT NULL,
      sender_title TEXT,
      with_stamp INTEGER NOT NULL DEFAULT 1,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  addColumnIfMissing(d, "letters", "created_by_id", "TEXT");
  function addColumnIfMissing(db: Database.Database, table: string, column: string, def: string) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!cols.some((c) => c.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
    }
  }
  seedUsers(d);
}

function seedUsers(d: Database.Database) {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@kimsafety.co.ke";
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass) {
    throw new Error("ADMIN_PASSWORD environment variable is required to seed the admin user");
  }
  const existing = d.prepare("SELECT role FROM users WHERE email = ?").get(adminEmail) as { role: string } | undefined;
  if (existing) {
    if (existing.role !== "superadmin") {
      d.prepare("UPDATE users SET role = 'superadmin' WHERE email = ?").run(adminEmail);
    }
    return;
  }
  d.prepare(
    "INSERT INTO users (id, name, email, password_hash, role, company, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    randomUUID(),
    "KimSafety Admin",
    adminEmail,
    hashPassword(adminPass),
    "superadmin",
    "KimSafety Ltd",
    "+254 715135141",
    new Date().toISOString()
  );
}

const SEED_BANNERS = [
  {
    kicker: "Industrial PPE · Certified & Genuine",
    title: "Protect Every Worker, Every Shift",
    subtitle:
      "3M, Honeywell, Ansell, Uvex and MSA — certified personal protective equipment delivered nationwide within 24–72 hours.",
    cta: "Shop PPE",
    cta_href: "/search",
    cta2: "Request Quote",
    image: "/images/hero/hero1.jpg",
    card_kicker: "KimSafety",
    card_title: "Your Trusted Safety Partner",
    card_subtitle: "Genuine & certified PPE, delivered nationwide within 24–72 hours.",
  },
  {
    kicker: "Medical Safety · Hospital Grade",
    title: "Clinical Supplies Kenyan Hospitals Trust",
    subtitle:
      "Examination gloves, masks, isolation gowns and laboratory equipment with full certification documentation.",
    cta: "Shop Medical",
    cta_href: "/search?category=medical",
    cta2: "Talk to a Specialist",
    image: "/images/hero/hero2.jpg",
    card_kicker: "Hospital Grade",
    card_title: "Clinical Supplies You Can Trust",
    card_subtitle: "Certified medical equipment and consumables for institutions and clinics.",
  },
  {
    kicker: "Bulk & Corporate · Up to 30% Off",
    title: "Bulk Discounts for Teams & Projects",
    subtitle:
      "Tiered pricing, negotiated corporate rates, tax invoices and dedicated account managers for organizations.",
    cta: "See Pricing",
    cta_href: "/deals",
    cta2: "Request Corporate Quotation",
    image: "/images/hero/hero3.jpg",
    card_kicker: "Corporate",
    card_title: "Bulk Pricing for Organizations",
    card_subtitle: "Tiered rates, tax invoices and dedicated account managers.",
  },
];

const SEED_CAMPAIGNS = [
  {
    name: "Back to School PPE",
    discount_label: "School Supplies · Up to 20% off",
    description:
      "School and institutional PPE packs — dustcoats, gloves, masks and safety footwear for staff and learners.",
    cta_href: "/search?category=safety-wear",
    start_date: "2026-08-01",
    end_date: "2026-09-15",
  },
  {
    name: "Construction Week",
    discount_label: "Site Essentials · Up to 25% off",
    description:
      "Hard hats, hi-vis vests, safety boots and harnesses — everything your site crew needs at construction-week prices.",
    cta_href: "/search?category=construction",
    start_date: "2026-09-14",
    end_date: "2026-09-20",
  },
  {
    name: "Safety Month",
    discount_label: "Annual Safety Drive · Bulk savings",
    description:
      "October is Safety Month. Stock up on the full PPE range with tiered bulk discounts and free delivery over KES 20,000.",
    cta_href: "/deals",
    start_date: "2026-10-01",
    end_date: "2026-10-31",
  },
  {
    name: "Hospital Supplies Week",
    discount_label: "Medical Grade · Up to 15% off",
    description:
      "Examination gloves, surgical masks, isolation gowns and dispensers at special hospital-supply rates for institutions.",
    cta_href: "/search?category=medical",
    start_date: "2026-11-09",
    end_date: "2026-11-15",
  },
  {
    name: "Black Friday",
    discount_label: "Mega Sale · Up to 40% off",
    description:
      "Our biggest sale of the year — deep discounts across PPE, fire safety, medical and first aid. While stocks last.",
    cta_href: "/deals",
    start_date: "2026-11-26",
    end_date: "2026-11-29",
  },
  {
    name: "Christmas Sale",
    discount_label: "Festive Deals · Up to 30% off",
    description:
      "Wrap up the year with festive pricing on safety kits, gifting bundles and end-of-year site restocks.",
    cta_href: "/deals",
    start_date: "2026-12-01",
    end_date: "2026-12-24",
  },
];

function seedMarketing(d: Database.Database) {
  const now = new Date().toISOString();
  const bannerCount = (d.prepare("SELECT COUNT(*) AS c FROM marketing_banners").get() as { c: number }).c;
  if (bannerCount === 0) {
    const insert = d.prepare(
      "INSERT INTO marketing_banners (title, subtitle, kicker, cta, cta_href, cta2, image, card_kicker, card_title, card_subtitle, sort, active, created_at, updated_at) VALUES (@title, @subtitle, @kicker, @cta, @cta_href, @cta2, @image, @card_kicker, @card_title, @card_subtitle, @sort, 1, @created_at, @updated_at)"
    );
    SEED_BANNERS.forEach((b, i) => insert.run({ ...b, sort: i, created_at: now, updated_at: now }));
    console.log("[kimsafety] Seeded marketing banners");
  }
  d.prepare(
    "UPDATE marketing_banners SET card_kicker = 'KimSafety', card_title = 'Your Trusted Safety Partner', card_subtitle = 'Genuine & certified PPE, delivered nationwide within 24–72 hours.' WHERE card_title = ''"
  ).run();
  const campaignCount = (d.prepare("SELECT COUNT(*) AS c FROM marketing_campaigns").get() as { c: number }).c;
  if (campaignCount === 0) {
    const insert = d.prepare(
      "INSERT INTO marketing_campaigns (name, slug, description, discount_label, cta_href, start_date, end_date, active, created_at, updated_at) VALUES (@name, @slug, @description, @discount_label, @cta_href, @start_date, @end_date, 1, @created_at, @updated_at)"
    );
    SEED_CAMPAIGNS.forEach((c) =>
      insert.run({
        ...c,
        slug: c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        created_at: now,
        updated_at: now,
      })
    );
    console.log("[kimsafety] Seeded marketing campaigns");
  }
  const CAMPAIGN_IMAGE_BY_KEYWORD: [string, string][] = [
    ["back-to-school", "3-Ply Face Masks.jpg"],
    ["construction", "Construction Helmets.jpg"],
    ["safety", "2Kg CO2 Fire Extinguisher.jpg"],
    ["hospital", "Powder Free Disposable Latex Gloves.jpg"],
    ["black", "Reflector Jackets.jpg"],
    ["christmas", "Designer Orange Reflector Jackets.jpg"],
  ];
  const FALLBACK_CAMPAIGN_IMAGE = "2 Stripes Reflective Vest AA12.jpg";
  const campaigns = d.prepare("SELECT id, slug FROM marketing_campaigns WHERE image IS NULL").all() as {
    id: number;
    slug: string;
  }[];
  const setImage = d.prepare("UPDATE marketing_campaigns SET image = ?, updated_at = ? WHERE id = ?");
  for (const c of campaigns) {
    const match = CAMPAIGN_IMAGE_BY_KEYWORD.find(([kw]) => c.slug.includes(kw));
    const file = match?.[1] ?? FALLBACK_CAMPAIGN_IMAGE;
    setImage.run(`/api/uploads/${encodeURIComponent(file)}`, now, c.id);
  }
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

export function createOrder(input: { user_id?: string | null; name: string; email: string; phone: string; address: string; items: string; total: number; subtotal?: number; discount?: number; shipping?: number; payment: string; po_ref?: string; company?: string; po_file?: string }): DbOrder {
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
    po_ref: input.po_ref ?? null,
    company: input.company ?? null,
    po_file: input.po_file ?? null,
    created_at: new Date().toISOString(),
  };
  getDb()
    .prepare("INSERT INTO orders (id, user_id, name, email, phone, address, items, total, subtotal, discount, shipping, status, payment, paid, po_ref, company, po_file, created_at) VALUES (@id, @user_id, @name, @email, @phone, @address, @items, @total, @subtotal, @discount, @shipping, @status, @payment, @paid, @po_ref, @company, @po_file, @created_at)")
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

// ---- Site settings ----

export function getSetting(key: string): string {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value ?? DEFAULT_SETTINGS[key] ?? "";
}

export function getAllSettings(): Record<string, string> {
  const rows = getDb().prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const out: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export function setSetting(key: string, value: string) {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
    )
    .run(key, value, now);
}

// ---- Letters ----

export type DbLetter = {
  id: string;
  type: string;
  recipient_name: string;
  recipient_title: string | null;
  recipient_company: string | null;
  recipient_address: string | null;
  subject: string;
  salutation: string;
  body: string;
  closing: string;
  sender_name: string;
  sender_title: string | null;
  with_stamp: number;
  created_by: string;
  created_by_id: string | null;
  created_at: string;
};

const normalizeLetterSubject = (s?: string) => (s ?? "").trim().toUpperCase();

export function createLetter(input: {
  type?: string;
  recipient_name: string;
  recipient_title?: string | null;
  recipient_company?: string | null;
  recipient_address?: string | null;
  subject?: string;
  salutation?: string;
  body: string;
  closing?: string;
  sender_name: string;
  sender_title?: string | null;
  with_stamp?: boolean;
  created_by: string;
  created_by_id?: string | null;
}): DbLetter {
  const letter: DbLetter = {
    id: `LTR-${Math.floor(1000 + Math.random() * 9000)}`,
    type: input.type?.trim() || "Official Letter",
    recipient_name: input.recipient_name,
    recipient_title: input.recipient_title?.trim() || null,
    recipient_company: input.recipient_company?.trim() || null,
    recipient_address: input.recipient_address?.trim() || null,
    subject: normalizeLetterSubject(input.subject),
    salutation: input.salutation?.trim() || "Dear Sir/Madam",
    body: input.body.trim(),
    closing: input.closing?.trim() || "Yours faithfully",
    sender_name: input.sender_name,
    sender_title: input.sender_title?.trim() || null,
    with_stamp: input.with_stamp === true ? 1 : 0,
    created_by: input.created_by,
    created_by_id: input.created_by_id ?? null,
    created_at: new Date().toISOString(),
  };
  getDb()
    .prepare(
      "INSERT INTO letters (id, type, recipient_name, recipient_title, recipient_company, recipient_address, subject, salutation, body, closing, sender_name, sender_title, with_stamp, created_by, created_by_id, created_at) VALUES (@id, @type, @recipient_name, @recipient_title, @recipient_company, @recipient_address, @subject, @salutation, @body, @closing, @sender_name, @sender_title, @with_stamp, @created_by, @created_by_id, @created_at)"
    )
    .run(letter);
  return letter;
}

export function updateLetter(
  id: string,
  input: {
    type?: string;
    recipient_name?: string;
    recipient_title?: string | null;
    recipient_company?: string | null;
    recipient_address?: string | null;
    subject?: string;
    salutation?: string;
    body?: string;
    closing?: string;
    sender_name?: string;
    sender_title?: string | null;
    with_stamp?: boolean;
  }
): DbLetter {
  const existing = getLetterById(id);
  if (!existing) throw new Error("Letter not found");
  const letter: DbLetter = {
    ...existing,
    type: input.type?.trim() || existing.type,
    recipient_name: input.recipient_name?.trim() || existing.recipient_name,
    recipient_title: input.recipient_title === undefined ? existing.recipient_title : input.recipient_title?.trim() || null,
    recipient_company: input.recipient_company === undefined ? existing.recipient_company : input.recipient_company?.trim() || null,
    recipient_address: input.recipient_address === undefined ? existing.recipient_address : input.recipient_address?.trim() || null,
    subject: input.subject === undefined ? existing.subject : normalizeLetterSubject(input.subject),
    salutation: input.salutation?.trim() || existing.salutation,
    body: input.body === undefined ? existing.body : input.body.trim(),
    closing: input.closing?.trim() || existing.closing,
    sender_name: input.sender_name?.trim() || existing.sender_name,
    sender_title: input.sender_title === undefined ? existing.sender_title : input.sender_title?.trim() || null,
    with_stamp: input.with_stamp === undefined ? existing.with_stamp : input.with_stamp ? 1 : 0,
  };
  getDb()
    .prepare(
      "UPDATE letters SET type=@type, recipient_name=@recipient_name, recipient_title=@recipient_title, recipient_company=@recipient_company, recipient_address=@recipient_address, subject=@subject, salutation=@salutation, body=@body, closing=@closing, sender_name=@sender_name, sender_title=@sender_title, with_stamp=@with_stamp WHERE id=@id"
    )
    .run(letter);
  return letter;
}

export function getLetterById(id: string): DbLetter | undefined {
  return getDb().prepare("SELECT * FROM letters WHERE id = ?").get(id) as DbLetter | undefined;
}

export function listLetters(): DbLetter[] {
  return getDb().prepare("SELECT * FROM letters ORDER BY created_at DESC").all() as DbLetter[];
}

export function listLettersFor(userId: string): DbLetter[] {
  return getDb()
    .prepare("SELECT * FROM letters WHERE created_by_id = ? ORDER BY created_at DESC")
    .all(userId) as DbLetter[];
}

export function deleteLetter(id: string) {
  getDb().prepare("DELETE FROM letters WHERE id = ?").run(id);
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

// ---- Marketing: banners & campaigns ----

export type MarketingBanner = {
  id: number;
  title: string;
  subtitle: string;
  kicker: string;
  cta: string;
  cta_href: string;
  cta2: string;
  image: string;
  card_kicker: string;
  card_title: string;
  card_subtitle: string;
  stat1_label: string;
  stat1_value: string;
  stat2_label: string;
  stat2_value: string;
  sort: number;
  active: number;
  created_at: string;
  updated_at: string;
};

export type MarketingCampaign = {
  id: number;
  name: string;
  slug: string;
  description: string;
  discount_label: string;
  image: string | null;
  cta_href: string;
  start_date: string | null;
  end_date: string | null;
  active: number;
  created_at: string;
  updated_at: string;
};

export function listBanners(): MarketingBanner[] {
  return getDb().prepare("SELECT * FROM marketing_banners ORDER BY sort ASC, id ASC").all() as MarketingBanner[];
}

export function getBannerById(id: number): MarketingBanner | undefined {
  return getDb().prepare("SELECT * FROM marketing_banners WHERE id = ?").get(id) as MarketingBanner | undefined;
}

export function upsertBanner(
  input: Omit<MarketingBanner, "id" | "created_at" | "updated_at"> & { id?: number }
): MarketingBanner {
  const now = new Date().toISOString();
  const row = {
    ...input,
    active: input.active ? 1 : 0,
    updated_at: now,
  };
  if (input.id) {
    getDb()
      .prepare(
        "UPDATE marketing_banners SET title = @title, subtitle = @subtitle, kicker = @kicker, cta = @cta, cta_href = @cta_href, cta2 = @cta2, image = @image, card_kicker = @card_kicker, card_title = @card_title, card_subtitle = @card_subtitle, stat1_label = @stat1_label, stat1_value = @stat1_value, stat2_label = @stat2_label, stat2_value = @stat2_value, sort = @sort, active = @active, updated_at = @updated_at WHERE id = @id"
      )
      .run({ ...row, id: input.id });
    return getBannerById(input.id)!;
  }
  const id = getDb()
    .prepare(
      "INSERT INTO marketing_banners (title, subtitle, kicker, cta, cta_href, cta2, image, card_kicker, card_title, card_subtitle, stat1_label, stat1_value, stat2_label, stat2_value, sort, active, created_at, updated_at) VALUES (@title, @subtitle, @kicker, @cta, @cta_href, @cta2, @image, @card_kicker, @card_title, @card_subtitle, @stat1_label, @stat1_value, @stat2_label, @stat2_value, @sort, @active, @created_at, @updated_at)"
    )
    .run({ ...row, created_at: now }).lastInsertRowid as number;
  return getBannerById(id)!;
}

export function deleteBanner(id: number) {
  getDb().prepare("DELETE FROM marketing_banners WHERE id = ?").run(id);
}

export function getActiveBanners(): MarketingBanner[] {
  return getDb()
    .prepare("SELECT * FROM marketing_banners WHERE active = 1 ORDER BY sort ASC, id ASC")
    .all() as MarketingBanner[];
}

export function listCampaigns(): MarketingCampaign[] {
  return getDb()
    .prepare("SELECT * FROM marketing_campaigns ORDER BY COALESCE(end_date, '9999-12-31') DESC, id DESC")
    .all() as MarketingCampaign[];
}

export function getCampaignBySlug(slug: string): MarketingCampaign | undefined {
  return getDb().prepare("SELECT * FROM marketing_campaigns WHERE slug = ?").get(slug) as MarketingCampaign | undefined;
}

export function upsertCampaign(
  input: Omit<MarketingCampaign, "id" | "created_at" | "updated_at"> & { id?: number }
): MarketingCampaign {
  const now = new Date().toISOString();
  const row = {
    ...input,
    active: input.active ? 1 : 0,
    updated_at: now,
  };
  if (input.id) {
    getDb()
      .prepare(
        "UPDATE marketing_campaigns SET name = @name, slug = @slug, description = @description, discount_label = @discount_label, image = @image, cta_href = @cta_href, start_date = @start_date, end_date = @end_date, active = @active, updated_at = @updated_at WHERE id = @id"
      )
      .run({ ...row, id: input.id });
    return getCampaignBySlug(input.slug)!;
  }
  getDb()
    .prepare(
      "INSERT INTO marketing_campaigns (name, slug, description, discount_label, image, cta_href, start_date, end_date, active, created_at, updated_at) VALUES (@name, @slug, @description, @discount_label, @image, @cta_href, @start_date, @end_date, @active, @created_at, @updated_at)"
    )
    .run({ ...row, created_at: now });
  return getCampaignBySlug(input.slug)!;
}

export function deleteCampaign(id: number) {
  getDb().prepare("DELETE FROM marketing_campaigns WHERE id = ?").run(id);
}

export function getActiveCampaigns(): MarketingCampaign[] {
  const today = new Date().toISOString().slice(0, 10);
  return getDb()
    .prepare(
      "SELECT * FROM marketing_campaigns WHERE active = 1 AND (start_date IS NULL OR start_date <= ?) AND (end_date IS NULL OR end_date >= ?) ORDER BY COALESCE(end_date, '9999-12-31') ASC, id ASC"
    )
    .all(today, today) as MarketingCampaign[];
}

// ---- Addresses ----

export function listAddressesForUser(userId: string): DbAddress[] {
  return getDb()
    .prepare("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC")
    .all(userId) as DbAddress[];
}

export function createAddress(input: {
  user_id: string;
  label: string;
  name: string;
  phone: string;
  address_line: string;
  city: string;
  county: string;
}): DbAddress {
  const existing = listAddressesForUser(input.user_id);
  const address: DbAddress = {
    id: randomUUID(),
    user_id: input.user_id,
    label: input.label || "Home",
    name: input.name,
    phone: input.phone,
    address_line: input.address_line,
    city: input.city,
    county: input.county,
    is_default: existing.length === 0 ? 1 : 0,
    created_at: new Date().toISOString(),
  };
  getDb()
    .prepare(
      "INSERT INTO addresses (id, user_id, label, name, phone, address_line, city, county, is_default, created_at) VALUES (@id, @user_id, @label, @name, @phone, @address_line, @city, @county, @is_default, @created_at)"
    )
    .run(address);
  return address;
}

export function getAddress(id: string): DbAddress | undefined {
  return getDb().prepare("SELECT * FROM addresses WHERE id = ?").get(id) as DbAddress | undefined;
}

export function deleteAddress(id: string) {
  const addr = getAddress(id);
  getDb().prepare("DELETE FROM addresses WHERE id = ?").run(id);
  if (addr?.is_default === 1) {
    const next = getDb()
      .prepare("SELECT * FROM addresses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1")
      .get(addr.user_id) as DbAddress | undefined;
    if (next) setDefaultAddress(next.id);
  }
}

export function setDefaultAddress(id: string) {
  const addr = getAddress(id);
  if (!addr) return;
  const db = getDb();
  db.prepare("UPDATE addresses SET is_default = 0 WHERE user_id = ?").run(addr.user_id);
  db.prepare("UPDATE addresses SET is_default = 1 WHERE id = ?").run(id);
}

// ---- Support tickets ----

export function listTicketsForUser(userId: string): DbTicket[] {
  return getDb()
    .prepare("SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as DbTicket[];
}

export function listAllTickets(): DbTicket[] {
  return getDb()
    .prepare(
      "SELECT t.*, u.name AS user_name, u.email AS user_email FROM support_tickets t LEFT JOIN users u ON u.id = t.user_id ORDER BY (t.status = 'Closed') ASC, t.updated_at DESC"
    )
    .all() as (DbTicket & { user_name: string | null; user_email: string | null })[];
}

export function getTicket(id: string): DbTicket | undefined {
  return getDb().prepare("SELECT * FROM support_tickets WHERE id = ?").get(id) as DbTicket | undefined;
}

export function createTicket(input: { user_id: string; subject: string; message: string }): DbTicket {
  const now = new Date().toISOString();
  const ticket: DbTicket = {
    id: `TKT-${Math.floor(10000 + Math.random() * 89999)}`,
    user_id: input.user_id,
    subject: input.subject,
    message: input.message,
    status: "Open",
    created_at: now,
    updated_at: now,
  };
  getDb()
    .prepare(
      "INSERT INTO support_tickets (id, user_id, subject, message, status, created_at, updated_at) VALUES (@id, @user_id, @subject, @message, @status, @created_at, @updated_at)"
    )
    .run(ticket);
  return ticket;
}

export function listTicketReplies(ticketId: string): DbTicketReply[] {
  return getDb()
    .prepare("SELECT * FROM ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC")
    .all(ticketId) as DbTicketReply[];
}

export function addTicketReply(input: {
  ticket_id: string;
  user_id?: string | null;
  staff_name?: string | null;
  message: string;
}): DbTicketReply {
  const reply: DbTicketReply = {
    id: randomUUID(),
    ticket_id: input.ticket_id,
    user_id: input.user_id ?? null,
    staff_name: input.staff_name ?? null,
    message: input.message,
    created_at: new Date().toISOString(),
  };
  const now = new Date().toISOString();
  getDb()
    .prepare(
      "INSERT INTO ticket_replies (id, ticket_id, user_id, staff_name, message, created_at) VALUES (@id, @ticket_id, @user_id, @staff_name, @message, @created_at)"
    )
    .run(reply);
  getDb()
    .prepare("UPDATE support_tickets SET updated_at = ?, status = 'Open' WHERE id = ?")
    .run(now, input.ticket_id);
  return reply;
}

export function setTicketStatus(id: string, status: string) {
  getDb()
    .prepare("UPDATE support_tickets SET status = ?, updated_at = ? WHERE id = ?")
    .run(status, new Date().toISOString(), id);
}

// ---- Returns ----

export function listReturnsForUser(userId: string): DbReturn[] {
  return getDb()
    .prepare("SELECT * FROM returns WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as DbReturn[];
}

export function listAllReturns(): DbReturn[] {
  return getDb().prepare("SELECT * FROM returns ORDER BY created_at DESC").all() as DbReturn[];
}

export function createReturn(input: {
  user_id: string;
  order_id: string;
  product_name: string;
  qty: number;
  reason: string;
}): DbReturn {
  const now = new Date().toISOString();
  const ret: DbReturn = {
    id: `RET-${Math.floor(10000 + Math.random() * 89999)}`,
    user_id: input.user_id,
    order_id: input.order_id,
    product_name: input.product_name,
    qty: input.qty,
    reason: input.reason,
    status: "Requested",
    created_at: now,
    updated_at: now,
  };
  getDb()
    .prepare(
      "INSERT INTO returns (id, user_id, order_id, product_name, qty, reason, status, created_at, updated_at) VALUES (@id, @user_id, @order_id, @product_name, @qty, @reason, @status, @created_at, @updated_at)"
    )
    .run(ret);
  return ret;
}

export function setReturnStatus(id: string, status: string) {
  getDb()
    .prepare("UPDATE returns SET status = ?, updated_at = ? WHERE id = ?")
    .run(status, new Date().toISOString(), id);
}

// ---- Notifications ----

export function createNotification(input: {
  user_id: string;
  type?: string;
  title: string;
  message?: string;
  link?: string | null;
}): DbNotification {
  const notification: DbNotification = {
    id: randomUUID(),
    user_id: input.user_id,
    type: input.type ?? "general",
    title: input.title,
    message: input.message ?? "",
    link: input.link ?? null,
    read: 0,
    created_at: new Date().toISOString(),
  };
  getDb()
    .prepare(
      "INSERT INTO notifications (id, user_id, type, title, message, link, read, created_at) VALUES (@id, @user_id, @type, @title, @message, @link, @read, @created_at)"
    )
    .run(notification);
  return notification;
}

export function listNotificationsForUser(userId: string): DbNotification[] {
  return getDb()
    .prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50")
    .all(userId) as DbNotification[];
}

export function countUnreadNotifications(userId: string): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read = 0")
    .get(userId) as { n: number };
  return row.n;
}

export function markNotificationRead(id: string) {
  getDb().prepare("UPDATE notifications SET read = 1 WHERE id = ?").run(id);
}

export function markAllNotificationsRead(userId: string) {
  getDb().prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(userId);
}
