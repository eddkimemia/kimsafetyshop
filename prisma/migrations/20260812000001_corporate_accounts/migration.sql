-- Corporate account manager: configured accounts created from approved
-- applications or directly by the superadmin.
CREATE TABLE IF NOT EXISTS corporate_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  application_id TEXT,
  company TEXT NOT NULL,
  kra_pin TEXT,
  industry TEXT,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  discount_rate INTEGER NOT NULL DEFAULT 0,
  credit_terms TEXT NOT NULL DEFAULT '30 days',
  account_manager TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
