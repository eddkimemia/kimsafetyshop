-- Newsletter subscribers: collected from the home + blog forms.
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  source TEXT DEFAULT 'home',
  status TEXT NOT NULL DEFAULT 'subscribed',
  unsubscribe_token TEXT,
  unsubscribed_at TEXT,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers (LOWER(email));
