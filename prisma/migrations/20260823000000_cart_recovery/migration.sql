-- Abandoned-cart recovery: one row per email, overwritten as the cart changes,
-- deleted when an order is placed with that email.
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  items TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  reminded_at TEXT
);

-- Back-in-stock notification requests (one per product+email).
CREATE TABLE IF NOT EXISTS restock_notifications (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  email TEXT NOT NULL,
  notified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  UNIQUE (product_id, email)
);
