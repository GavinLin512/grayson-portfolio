CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_slug TEXT NOT NULL,
  github_id TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  ip_hash TEXT
);
CREATE INDEX IF NOT EXISTS idx_comments_slug_created
  ON comments(post_slug, created_at DESC);
