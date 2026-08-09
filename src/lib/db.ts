import { Pool } from "pg";
import { randomUUID, scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults";

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
  created_by_id: string | null;
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
  created_by_id: string | null;
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

let pool: Pool | null = null;

export function getDb(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL environment variable is required");
    const host = new URL(url).hostname;
    const ssl = /sslmode=require|sslmode=verify-full/.test(url) || !["localhost", "127.0.0.1", "::1"].includes(host);
    pool = new Pool({
      connectionString: url,
      ssl: ssl ? { rejectUnauthorized: false } : false,
      max: 2,
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 15000,
    });
    pool.on("error", (err: Error) => console.error("[kimsafety] pg pool error", err));
  }
  return pool;
}

function toPgParams(sql: string, params: unknown[] | Record<string, unknown>): { text: string; values: unknown[] } {
  const values: unknown[] = [];
  let i = 0;
  const text = sql.replace(/(@[a-zA-Z_][a-zA-Z0-9_]*)|(\?)/g, (tok: string, name?: string) => {
    i += 1;
    if (name) values.push((params as Record<string, unknown>)[name.slice(1)]);
    else values.push((params as unknown[])[i - 1]);
    return `$${i}`;
  });
  return { text, values };
}

function normalizeParams(params: unknown[]): unknown[] | Record<string, unknown> {
  if (params.length === 1 && typeof params[0] === "object" && params[0] !== null && !Array.isArray(params[0])) {
    return params[0] as Record<string, unknown>;
  }
  return params;
}

export async function q1<T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T | undefined> {
  const { text, values } = toPgParams(sql, normalizeParams(params));
  const res = await getDb().query(text, values);
  return res.rows[0] as T | undefined;
}

export async function qr<T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T[]> {
  const { text, values } = toPgParams(sql, normalizeParams(params));
  const res = await getDb().query(text, values);
  return res.rows as T[];
}

export async function qe(sql: string, ...params: unknown[]): Promise<Promise<number>> {
  const { text, values } = toPgParams(sql, normalizeParams(params));
  const res = await getDb().query(text, values);
  return res.rowCount ?? 0;
}

// The application schema is managed by Prisma migrations (prisma/migrations),
// applied at deploy time via `prisma migrate deploy` — not at runtime.

export async function seedUsers() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@kimsafety.co.ke";
  const adminPass = process.env.ADMIN_PASSWORD;
  const res = await getDb().query("SELECT role FROM users WHERE email = $1", [adminEmail]);
  const existing = res.rows[0] as { role: string } | undefined;
  if (existing) {
    if (existing.role !== "superadmin") {
      await getDb().query("UPDATE users SET role = 'superadmin' WHERE email = $1", [adminEmail]);
    }
    return;
  }
  if (!adminPass) {
    throw new Error("ADMIN_PASSWORD environment variable is required to seed the admin user");
  }
  await getDb().query(
    "INSERT INTO users (id, name, email, password_hash, role, company, phone, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    [randomUUID(), "KimSafety Admin", adminEmail, hashPassword(adminPass), "superadmin", "KimSafety Ltd", "+254 715135141", new Date().toISOString()]
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

export async function seedMarketing() {
  const d = getDb();
  const now = new Date().toISOString();
  const bannerCount = (await d.query("SELECT COUNT(*)::int AS c FROM marketing_banners")).rows[0] as { c: number };
  if (bannerCount.c === 0) {
    for (let i = 0; i < SEED_BANNERS.length; i++) {
      const b = SEED_BANNERS[i];
      await d.query(
        "INSERT INTO marketing_banners (title, subtitle, kicker, cta, cta_href, cta2, image, card_kicker, card_title, card_subtitle, sort, active, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,1,$12,$13)",
        [b.title, b.subtitle, b.kicker, b.cta, b.cta_href, b.cta2, b.image, b.card_kicker, b.card_title, b.card_subtitle, i, now, now]
      );
    }
    console.log("[kimsafety] Seeded marketing banners");
  }
  await d.query(
    "UPDATE marketing_banners SET card_kicker = 'KimSafety', card_title = 'Your Trusted Safety Partner', card_subtitle = 'Genuine & certified PPE, delivered nationwide within 24–72 hours.' WHERE card_title = ''"
  );
  const campaignCount = (await d.query("SELECT COUNT(*)::int AS c FROM marketing_campaigns")).rows[0] as { c: number };
  if (campaignCount.c === 0) {
    for (const c of SEED_CAMPAIGNS) {
      await d.query(
        "INSERT INTO marketing_campaigns (name, slug, description, discount_label, cta_href, start_date, end_date, active, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,1,$8,$9)",
        [c.name, c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), c.description, c.discount_label, c.cta_href, c.start_date, c.end_date, now, now]
      );
    }
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
  const campaigns = (await d.query("SELECT id, slug FROM marketing_campaigns WHERE image IS NULL")).rows as {
    id: number;
    slug: string;
  }[];
  for (const c of campaigns) {
    const match = CAMPAIGN_IMAGE_BY_KEYWORD.find(([kw]) => c.slug.includes(kw));
    const file = match?.[1] ?? FALLBACK_CAMPAIGN_IMAGE;
    await d.query("UPDATE marketing_campaigns SET image = $1, updated_at = $2 WHERE id = $3", [
      `/api/uploads/${encodeURIComponent(file)}`,
      now,
      c.id,
    ]);
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

export async function getUserByEmail(email: string): Promise<DbUser | undefined> {  return (await q1("SELECT * FROM users WHERE email = ?", email)) as DbUser | undefined;
}

export async function getUserById(id: string): Promise<DbUser | undefined> {  return (await q1("SELECT * FROM users WHERE id = ?", id)) as DbUser | undefined;
}

export async function createUser(input: { name: string; email: string; password: string; company?: string; phone?: string; role?: "user" | "admin"; verified?: number }): Promise<DbUser> {  const user: DbUser = {
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
  await qe("INSERT INTO users (id, name, email, password_hash, role, company, phone, verified, created_at) VALUES (@id, @name, @email, @password_hash, @role, @company, @phone, @verified, @created_at)", user);
  return user;
}

export async function listUsers(): Promise<DbUser[]> {  return (await qr("SELECT * FROM users ORDER BY created_at DESC")) as DbUser[];
}

export async function setUserRole(id: string, role: "user" | "admin") {
  await qe("UPDATE users SET role = ? WHERE id = ?", role, id);
}

export async function setUserVerified(id: string, verified: number) {
  await qe("UPDATE users SET verified = ? WHERE id = ?", verified, id);
}

// ---- Orders ----

export async function createOrder(input: { user_id?: string | null; name: string; email: string; phone: string; address: string; items: string; total: number; subtotal?: number; discount?: number; shipping?: number; payment: string; po_ref?: string; company?: string; po_file?: string }): Promise<DbOrder> {  const order: DbOrder = {
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
  await qe("INSERT INTO orders (id, user_id, name, email, phone, address, items, total, subtotal, discount, shipping, status, payment, paid, po_ref, company, po_file, created_at) VALUES (@id, @user_id, @name, @email, @phone, @address, @items, @total, @subtotal, @discount, @shipping, @status, @payment, @paid, @po_ref, @company, @po_file, @created_at)", order);
  return order;
}

export async function getOrderById(id: string): Promise<DbOrder | undefined> {  return (await q1("SELECT * FROM orders WHERE id = ?", id)) as DbOrder | undefined;
}

export async function setOrderPaid(id: string, paid: number) {
  await qe("UPDATE orders SET paid = ? WHERE id = ?", paid, id);
}

export async function listOrders(): Promise<DbOrder[]> {  return (await qr("SELECT * FROM orders ORDER BY created_at DESC")) as DbOrder[];
}

export async function ordersForUser(userId: string): Promise<DbOrder[]> {  return (await qr("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", userId)) as DbOrder[];
}

export async function setOrderStatus(id: string, status: string) {
  await qe("UPDATE orders SET status = ? WHERE id = ?", status, id);
}

// ---- Quotes ----

export async function createQuote(input: {
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
  created_by_id?: string | null;
}): Promise<DbQuote> {  const quote: DbQuote = {
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
    created_by_id: input.created_by_id ?? null,
    created_at: new Date().toISOString(),
  };
  await qe("INSERT INTO quotes (id, user_id, name, company, items, total, status, attachment, email, phone, notes, valid_until, created_by_id, created_at) VALUES (@id, @user_id, @name, @company, @items, @total, @status, @attachment, @email, @phone, @notes, @valid_until, @created_by_id, @created_at)", quote);
  return quote;
}

export async function deleteQuote(id: string) {
  await qe("DELETE FROM quotes WHERE id = ?", id);
}

export async function getQuoteById(id: string): Promise<DbQuote | undefined> {  return (await q1("SELECT * FROM quotes WHERE id = ?", id)) as DbQuote | undefined;
}

export async function listQuotes(): Promise<DbQuote[]> {  return (await qr("SELECT * FROM quotes ORDER BY created_at DESC")) as DbQuote[];
}

export async function quotesForUser(userId: string): Promise<DbQuote[]> {  return (await qr("SELECT * FROM quotes WHERE user_id = ? ORDER BY created_at DESC", userId)) as DbQuote[];
}

export async function setQuoteStatus(id: string, status: string) {
  await qe("UPDATE quotes SET status = ? WHERE id = ?", status, id);
}

// ---- Site settings ----

export async function getSetting(key: string): Promise<string> {  const row = (await q1("SELECT value FROM settings WHERE key = ?", key)) as { value: string } | undefined;
  return row?.value ?? DEFAULT_SETTINGS[key] ?? "";
}

export async function getAllSettings(): Promise<Record<string, string>> {  const rows = (await qr("SELECT key, value FROM settings")) as { key: string; value: string }[];
  const out: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export async function setSetting(key: string, value: string) {
  const now = new Date().toISOString();
  await qe("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at", key, value, now);
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

export async function createLetter(input: {
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
}): Promise<DbLetter> {  const letter: DbLetter = {
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
  await qe("INSERT INTO letters (id, type, recipient_name, recipient_title, recipient_company, recipient_address, subject, salutation, body, closing, sender_name, sender_title, with_stamp, created_by, created_by_id, created_at) VALUES (@id, @type, @recipient_name, @recipient_title, @recipient_company, @recipient_address, @subject, @salutation, @body, @closing, @sender_name, @sender_title, @with_stamp, @created_by, @created_by_id, @created_at)", letter);
  return letter;
}

export async function updateLetter(
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
): Promise<DbLetter> {  const existing = await getLetterById(id);
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
  await qe("UPDATE letters SET type=@type, recipient_name=@recipient_name, recipient_title=@recipient_title, recipient_company=@recipient_company, recipient_address=@recipient_address, subject=@subject, salutation=@salutation, body=@body, closing=@closing, sender_name=@sender_name, sender_title=@sender_title, with_stamp=@with_stamp WHERE id=@id", letter);
  return letter;
}

export async function getLetterById(id: string): Promise<DbLetter | undefined> {  return (await q1("SELECT * FROM letters WHERE id = ?", id)) as DbLetter | undefined;
}

export async function listLetters(): Promise<DbLetter[]> {  return (await qr("SELECT * FROM letters ORDER BY created_at DESC")) as DbLetter[];
}

export async function listLettersFor(userId: string): Promise<DbLetter[]> {  return (await qr("SELECT * FROM letters WHERE created_by_id = ? ORDER BY created_at DESC", userId)) as DbLetter[];
}

export async function deleteLetter(id: string) {
  await qe("DELETE FROM letters WHERE id = ?", id);
}

// ---- Corporate account applications ----

export async function createCorporateApplication(input: {
  company: string;
  kra_pin: string;
  industry: string;
  contact_name: string;
  phone: string;
  email: string;
  notes?: string | null;
  documents?: string[];
}): Promise<DbCorporateApplication> {  const app: DbCorporateApplication = {
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
  await qe("INSERT INTO corporate_applications (id, company, kra_pin, industry, contact_name, phone, email, notes, documents, status, created_at) VALUES (@id, @company, @kra_pin, @industry, @contact_name, @phone, @email, @notes, @documents, @status, @created_at)", app);
  return app;
}

export async function listCorporateApplications(): Promise<DbCorporateApplication[]> {  return (await qr("SELECT * FROM corporate_applications ORDER BY created_at DESC")) as DbCorporateApplication[];
}

export async function setCorporateApplicationStatus(id: string, status: string) {
  await qe("UPDATE corporate_applications SET status = ? WHERE id = ?", status, id);
}

// ---- Purchase orders ----

export async function createPurchaseOrder(input: {
  company: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  po_file: string;
}): Promise<DbPurchaseOrder> {  const po: DbPurchaseOrder = {
    id: `PO-${Math.floor(1000 + Math.random() * 9000)}`,
    company: input.company,
    contact_name: input.contact_name ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    po_file: input.po_file,
    status: "Pending",
    created_at: new Date().toISOString(),
  };
  await qe("INSERT INTO purchase_orders (id, company, contact_name, phone, email, po_file, status, created_at) VALUES (@id, @company, @contact_name, @phone, @email, @po_file, @status, @created_at)", po);
  return po;
}

export async function listPurchaseOrders(): Promise<DbPurchaseOrder[]> {  return (await qr("SELECT * FROM purchase_orders ORDER BY created_at DESC")) as DbPurchaseOrder[];
}

export async function setPurchaseOrderStatus(id: string, status: string) {
  await qe("UPDATE purchase_orders SET status = ? WHERE id = ?", status, id);
}

// ---- Supplier purchase orders (KimSafety buys stock from suppliers) ----

export async function createSupplierOrder(input: {
  supplier: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  items: SupplierOrderItem[];
  shipping?: number;
  expected_date?: string | null;
  notes?: string | null;
  created_by_id?: string | null;
}): Promise<DbSupplierOrder> {  const subtotal = Math.round(
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
    created_by_id: input.created_by_id ?? null,
    created_at: new Date().toISOString(),
  };
  await qe("INSERT INTO supplier_orders (id, supplier, contact_name, phone, email, items, subtotal, shipping, total, expected_date, notes, status, created_by_id, created_at) VALUES (@id, @supplier, @contact_name, @phone, @email, @items, @subtotal, @shipping, @total, @expected_date, @notes, @status, @created_by_id, @created_at)", po);
  return po;
}

export async function listSupplierOrders(): Promise<DbSupplierOrder[]> {  return (await qr("SELECT * FROM supplier_orders ORDER BY created_at DESC")) as DbSupplierOrder[];
}

export async function getSupplierOrder(id: string): Promise<DbSupplierOrder | undefined> {  return (await q1("SELECT * FROM supplier_orders WHERE id = ?", id)) as DbSupplierOrder | undefined;
}

export async function deleteSupplierOrder(id: string) {
  await qe("DELETE FROM supplier_orders WHERE id = ?", id);
}

export async function setSupplierOrderStatus(id: string, status: string) {
  await qe("UPDATE supplier_orders SET status = ? WHERE id = ?", status, id);
}

// ---- Admin-managed products & guides (JSON overrides) ----

export async function listAdminProducts(): Promise<{ sku: string; data: unknown; updated_at: string }[]> {  return (await qr("SELECT * FROM admin_products ORDER BY updated_at DESC")) as { sku: string; data: unknown; updated_at: string }[];
}

export async function getAdminProduct(sku: string) {
  const row = (await q1("SELECT data FROM admin_products WHERE sku = ?", sku)) as { data: string } | undefined;
  return row ? JSON.parse(row.data) : undefined;
}

export async function upsertAdminProduct(sku: string, data: unknown) {
  await qe("INSERT INTO admin_products (sku, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(sku) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at", sku, JSON.stringify(data), new Date().toISOString());
}

export async function deleteAdminProduct(sku: string) {
  await qe("DELETE FROM admin_products WHERE sku = ?", sku);
}

export async function listAdminGuides(): Promise<{ slug: string; data: unknown; updated_at: string }[]> {  return (await qr("SELECT * FROM admin_guides ORDER BY updated_at DESC")) as { slug: string; data: unknown; updated_at: string }[];
}

export async function getAdminGuide(slug: string) {
  const row = (await q1("SELECT data FROM admin_guides WHERE slug = ?", slug)) as { data: string } | undefined;
  return row ? JSON.parse(row.data) : undefined;
}

export async function upsertAdminGuide(slug: string, data: unknown) {
  await qe("INSERT INTO admin_guides (slug, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(slug) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at", slug, JSON.stringify(data), new Date().toISOString());
}

export async function deleteAdminGuide(slug: string) {
  await qe("DELETE FROM admin_guides WHERE slug = ?", slug);
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

export async function listPosts(includeUnpublished = false): Promise<DbPost[]> {  const sql = includeUnpublished
    ? "SELECT * FROM posts ORDER BY created_at DESC"
    : "SELECT * FROM posts WHERE published = 1 ORDER BY created_at DESC";
  return (await qr(sql)) as DbPost[];
}

export async function getPostBySlug(slug: string, includeUnpublished = false): Promise<DbPost | undefined> {  const sql = includeUnpublished
    ? "SELECT * FROM posts WHERE slug = ?"
    : "SELECT * FROM posts WHERE slug = ? AND published = 1";
  return (await q1(sql, slug)) as DbPost | undefined;
}

export async function createPost(input: PostInput): Promise<DbPost> {  const post: DbPost = {
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
  await qe("INSERT INTO posts (id, slug, title, category, excerpt, content, cover, author, read_time, published, created_at, updated_at) VALUES (@id, @slug, @title, @category, @excerpt, @content, @cover, @author, @read_time, @published, @created_at, @updated_at)", post);
  return post;
}

export async function updatePost(slug: string, input: PostInput): Promise<DbPost | undefined> {  const existing = await getPostBySlug(slug, true);
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
  await qe("UPDATE posts SET slug = @slug, title = @title, category = @category, excerpt = @excerpt, content = @content, cover = @cover, author = @author, read_time = @read_time, published = @published, updated_at = @updated_at WHERE id = @id", updated);
  return updated;
}

export async function deletePost(slug: string) {
  await qe("DELETE FROM posts WHERE slug = ?", slug);
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

export async function listBanners(): Promise<MarketingBanner[]> {  return (await qr("SELECT * FROM marketing_banners ORDER BY sort ASC, id ASC")) as MarketingBanner[];
}

export async function getBannerById(id: number): Promise<MarketingBanner | undefined> {  return (await q1("SELECT * FROM marketing_banners WHERE id = ?", id)) as MarketingBanner | undefined;
}

export async function upsertBanner(
  input: Omit<MarketingBanner, "id" | "created_at" | "updated_at"> & { id?: number }
): Promise<MarketingBanner> {  const now = new Date().toISOString();
  const row = {
    ...input,
    active: input.active ? 1 : 0,
    updated_at: now,
  };
  if (input.id) {
    await qe("UPDATE marketing_banners SET title = @title, subtitle = @subtitle, kicker = @kicker, cta = @cta, cta_href = @cta_href, cta2 = @cta2, image = @image, card_kicker = @card_kicker, card_title = @card_title, card_subtitle = @card_subtitle, stat1_label = @stat1_label, stat1_value = @stat1_value, stat2_label = @stat2_label, stat2_value = @stat2_value, sort = @sort, active = @active, updated_at = @updated_at WHERE id = @id", { ...row, id: input.id });
    return (await getBannerById(input.id))!;
  }
  const inserted = await q1<{ id: number }>("INSERT INTO marketing_banners (title, subtitle, kicker, cta, cta_href, cta2, image, card_kicker, card_title, card_subtitle, stat1_label, stat1_value, stat2_label, stat2_value, sort, active, created_at, updated_at) VALUES (@title, @subtitle, @kicker, @cta, @cta_href, @cta2, @image, @card_kicker, @card_title, @card_subtitle, @stat1_label, @stat1_value, @stat2_label, @stat2_value, @sort, @active, @created_at, @updated_at) RETURNING id", { ...row, created_at: now });
  return (await getBannerById(inserted!.id))!;
}

export async function deleteBanner(id: number) {
  await qe("DELETE FROM marketing_banners WHERE id = ?", id);
}

export async function getActiveBanners(): Promise<MarketingBanner[]> {  return (await qr("SELECT * FROM marketing_banners WHERE active = 1 ORDER BY sort ASC, id ASC")) as MarketingBanner[];
}

export async function listCampaigns(): Promise<MarketingCampaign[]> {  return (await qr("SELECT * FROM marketing_campaigns ORDER BY COALESCE(end_date, '9999-12-31') DESC, id DESC")) as MarketingCampaign[];
}

export async function getCampaignBySlug(slug: string): Promise<MarketingCampaign | undefined> {  return (await q1("SELECT * FROM marketing_campaigns WHERE slug = ?", slug)) as MarketingCampaign | undefined;
}

export async function upsertCampaign(
  input: Omit<MarketingCampaign, "id" | "created_at" | "updated_at"> & { id?: number }
): Promise<MarketingCampaign> {  const now = new Date().toISOString();
  const row = {
    ...input,
    active: input.active ? 1 : 0,
    updated_at: now,
  };
  if (input.id) {
    await qe("UPDATE marketing_campaigns SET name = @name, slug = @slug, description = @description, discount_label = @discount_label, image = @image, cta_href = @cta_href, start_date = @start_date, end_date = @end_date, active = @active, updated_at = @updated_at WHERE id = @id", { ...row, id: input.id });
    return (await getCampaignBySlug(input.slug))!;
  }
  await qe("INSERT INTO marketing_campaigns (name, slug, description, discount_label, image, cta_href, start_date, end_date, active, created_at, updated_at) VALUES (@name, @slug, @description, @discount_label, @image, @cta_href, @start_date, @end_date, @active, @created_at, @updated_at)", { ...row, created_at: now });
  return (await getCampaignBySlug(input.slug))!;
}

export async function deleteCampaign(id: number) {
  await qe("DELETE FROM marketing_campaigns WHERE id = ?", id);
}

export async function getActiveCampaigns(): Promise<MarketingCampaign[]> {  const today = new Date().toISOString().slice(0, 10);
  return (await qr("SELECT * FROM marketing_campaigns WHERE active = 1 AND (start_date IS NULL OR start_date <= ?) AND (end_date IS NULL OR end_date >= ?) ORDER BY COALESCE(end_date, '9999-12-31') ASC, id ASC", today, today)) as MarketingCampaign[];
}

// ---- Addresses ----

export async function listAddressesForUser(userId: string): Promise<DbAddress[]> {  return (await qr("SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC", userId)) as DbAddress[];
}

export async function createAddress(input: {
  user_id: string;
  label: string;
  name: string;
  phone: string;
  address_line: string;
  city: string;
  county: string;
}): Promise<DbAddress> {  const existing = await listAddressesForUser(input.user_id);
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
  await qe("INSERT INTO addresses (id, user_id, label, name, phone, address_line, city, county, is_default, created_at) VALUES (@id, @user_id, @label, @name, @phone, @address_line, @city, @county, @is_default, @created_at)", address);
  return address;
}

export async function getAddress(id: string): Promise<DbAddress | undefined> {  return (await q1("SELECT * FROM addresses WHERE id = ?", id)) as DbAddress | undefined;
}

export async function deleteAddress(id: string) {
  const addr = await getAddress(id);
  await qe("DELETE FROM addresses WHERE id = ?", id);
  if (addr?.is_default === 1) {
    const next = (await q1("SELECT * FROM addresses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1", addr.user_id)) as DbAddress | undefined;
    if (next) await setDefaultAddress(next.id);
  }
}

export async function setDefaultAddress(id: string) {
  const addr = await getAddress(id);
  if (!addr) return;
  await qe("UPDATE addresses SET is_default = 0 WHERE user_id = ?", addr.user_id);
  await qe("UPDATE addresses SET is_default = 1 WHERE id = ?", id);
}

// ---- Support tickets ----

export async function listTicketsForUser(userId: string): Promise<DbTicket[]> {  return (await qr("SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC", userId)) as DbTicket[];
}

export async function listAllTickets(): Promise<DbTicket[]> {  return (await qr("SELECT t.*, u.name AS user_name, u.email AS user_email FROM support_tickets t LEFT JOIN users u ON u.id = t.user_id ORDER BY (t.status = 'Closed') ASC, t.updated_at DESC")) as (DbTicket & { user_name: string | null; user_email: string | null })[];
}

export async function getTicket(id: string): Promise<DbTicket | undefined> {  return (await q1("SELECT * FROM support_tickets WHERE id = ?", id)) as DbTicket | undefined;
}

export async function createTicket(input: { user_id: string; subject: string; message: string }): Promise<DbTicket> {  const now = new Date().toISOString();
  const ticket: DbTicket = {
    id: `TKT-${Math.floor(10000 + Math.random() * 89999)}`,
    user_id: input.user_id,
    subject: input.subject,
    message: input.message,
    status: "Open",
    created_at: now,
    updated_at: now,
  };
  await qe("INSERT INTO support_tickets (id, user_id, subject, message, status, created_at, updated_at) VALUES (@id, @user_id, @subject, @message, @status, @created_at, @updated_at)", ticket);
  return ticket;
}

export async function listTicketReplies(ticketId: string): Promise<DbTicketReply[]> {  return (await qr("SELECT * FROM ticket_replies WHERE ticket_id = ? ORDER BY created_at ASC", ticketId)) as DbTicketReply[];
}

export async function addTicketReply(input: {
  ticket_id: string;
  user_id?: string | null;
  staff_name?: string | null;
  message: string;
}): Promise<DbTicketReply> {  const reply: DbTicketReply = {
    id: randomUUID(),
    ticket_id: input.ticket_id,
    user_id: input.user_id ?? null,
    staff_name: input.staff_name ?? null,
    message: input.message,
    created_at: new Date().toISOString(),
  };
  const now = new Date().toISOString();
  await qe("INSERT INTO ticket_replies (id, ticket_id, user_id, staff_name, message, created_at) VALUES (@id, @ticket_id, @user_id, @staff_name, @message, @created_at)", reply);
  await qe("UPDATE support_tickets SET updated_at = ?, status = 'Open' WHERE id = ?", now, input.ticket_id);
  return reply;
}

export async function setTicketStatus(id: string, status: string) {
  await qe("UPDATE support_tickets SET status = ?, updated_at = ? WHERE id = ?", status, new Date().toISOString(), id);
}

// ---- Returns ----

export async function listReturnsForUser(userId: string): Promise<DbReturn[]> {  return (await qr("SELECT * FROM returns WHERE user_id = ? ORDER BY created_at DESC", userId)) as DbReturn[];
}

export async function listAllReturns(): Promise<DbReturn[]> {  return (await qr("SELECT * FROM returns ORDER BY created_at DESC")) as DbReturn[];
}

export async function createReturn(input: {
  user_id: string;
  order_id: string;
  product_name: string;
  qty: number;
  reason: string;
}): Promise<DbReturn> {  const now = new Date().toISOString();
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
  await qe("INSERT INTO returns (id, user_id, order_id, product_name, qty, reason, status, created_at, updated_at) VALUES (@id, @user_id, @order_id, @product_name, @qty, @reason, @status, @created_at, @updated_at)", ret);
  return ret;
}

export async function setReturnStatus(id: string, status: string) {
  await qe("UPDATE returns SET status = ?, updated_at = ? WHERE id = ?", status, new Date().toISOString(), id);
}

// ---- Notifications ----

export async function createNotification(input: {
  user_id: string;
  type?: string;
  title: string;
  message?: string;
  link?: string | null;
}): Promise<DbNotification> {  const notification: DbNotification = {
    id: randomUUID(),
    user_id: input.user_id,
    type: input.type ?? "general",
    title: input.title,
    message: input.message ?? "",
    link: input.link ?? null,
    read: 0,
    created_at: new Date().toISOString(),
  };
  await qe("INSERT INTO notifications (id, user_id, type, title, message, link, read, created_at) VALUES (@id, @user_id, @type, @title, @message, @link, @read, @created_at)", notification);
  return notification;
}

export async function listNotificationsForUser(userId: string): Promise<DbNotification[]> {  return (await qr("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50", userId)) as DbNotification[];
}

export async function countUnreadNotifications(userId: string): Promise<number> {  const row = (await q1("SELECT COUNT(*)::int AS n FROM notifications WHERE user_id = ? AND read = 0", userId)) as { n: number };
  return row.n;
}

export async function markNotificationRead(id: string) {
  await qe("UPDATE notifications SET read = 1 WHERE id = ?", id);
}

export async function markAllNotificationsRead(userId: string) {
  await qe("UPDATE notifications SET read = 1 WHERE user_id = ?", userId);
}

// ---- Reviews ----

export type DbReview = {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  title: string;
  text: string;
  status: string;
  verified: number;
  helpful: number;
  created_at: string;
};

export async function listReviewsForProduct(productId: string): Promise<DbReview[]> {  return (await qr("SELECT * FROM reviews WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC", productId)) as DbReview[];
}

export async function listAllReviews(): Promise<DbReview[]> {  return (await qr("SELECT * FROM reviews ORDER BY (status = 'approved') DESC, created_at DESC")) as DbReview[];
}

export async function getReview(id: string): Promise<DbReview | undefined> {  return (await q1("SELECT * FROM reviews WHERE id = ?", id)) as DbReview | undefined;
}

export async function getReviewByUserAndProduct(userId: string, productId: string): Promise<DbReview | undefined> {  return (await q1("SELECT * FROM reviews WHERE user_id = ? AND product_id = ?", userId, productId)) as DbReview | undefined;
}

export async function hasPurchasedProduct(userId: string, productId: string): Promise<boolean> {
  const escaped = productId.replace(/[\\%_]/g, (m) => `\\${m}`);
  const row = (await q1("SELECT COUNT(*)::int AS n FROM orders WHERE user_id = ? AND items LIKE ?", userId, `%"productId":"${escaped}"%`)) as { n: number };
  return (row?.n ?? 0) > 0;
}

export async function createReview(input: {
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  title: string;
  text: string;
  status?: string;
  verified?: number;
}): Promise<DbReview> {  const review: DbReview = {
    id: randomUUID(),
    product_id: input.product_id,
    user_id: input.user_id,
    user_name: input.user_name,
    rating: input.rating,
    title: input.title,
    text: input.text,
    status: input.status ?? "pending",
    verified: input.verified ?? 1,
    helpful: 0,
    created_at: new Date().toISOString(),
  };
  await qe("INSERT INTO reviews (id, product_id, user_id, user_name, rating, title, text, status, verified, helpful, created_at) VALUES (@id, @product_id, @user_id, @user_name, @rating, @title, @text, @status, @verified, @helpful, @created_at)", review);
  return review;
}

export async function updateReview(id: string, patch: Partial<Pick<DbReview, "rating" | "title" | "text" | "status" | "verified" | "helpful">>) {  const sets = Object.entries(patch).map(([k]) => `${k} = @${k}`);
  if (sets.length === 0) return;
  await qe(`UPDATE reviews SET ${sets.join(", ")} WHERE id = @id`, { ...patch, id } as Record<string, unknown>);
}

export async function deleteReview(id: string) {
  await qe("DELETE FROM reviews WHERE id = ?", id);
}
