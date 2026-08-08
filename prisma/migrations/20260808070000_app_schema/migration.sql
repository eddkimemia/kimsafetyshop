-- Application schema for the KimSafety storefront (previously auto-created at runtime
-- by initSchema() in src/lib/db.ts). Idempotent: safe to apply on an already-initialized database.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  company TEXT,
  phone TEXT,
  verified INTEGER NOT NULL DEFAULT 1,
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
  subtotal INTEGER NOT NULL DEFAULT 0,
  discount INTEGER NOT NULL DEFAULT 0,
  shipping INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Processing',
  payment TEXT NOT NULL DEFAULT 'mpesa',
  paid INTEGER NOT NULL DEFAULT 1,
  po_ref TEXT,
  company TEXT,
  po_file TEXT,
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
  attachment TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  valid_until TEXT,
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
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS marketing_banners (
  id SERIAL PRIMARY KEY,
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
  id SERIAL PRIMARY KEY,
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
  created_by_id TEXT,
  created_at TEXT NOT NULL
);
