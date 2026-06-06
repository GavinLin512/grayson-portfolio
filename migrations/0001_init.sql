CREATE TABLE IF NOT EXISTS guestbook (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  github_id TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  ip_hash TEXT
);
CREATE INDEX IF NOT EXISTS idx_guestbook_created_at ON guestbook(created_at DESC);
