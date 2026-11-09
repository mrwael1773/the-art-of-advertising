PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  username TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_key TEXT NOT NULL,
  progress_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, lesson_key)
);
CREATE INDEX IF NOT EXISTS idx_progress_user_updated ON progress(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS rate_limits (
  key_hash TEXT PRIMARY KEY NOT NULL,
  window_started INTEGER NOT NULL,
  attempts INTEGER NOT NULL
);
