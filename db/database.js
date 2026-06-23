// ─── db/database.js ───────────────────────────────────────────────────────────
// SQLite database setup using better-sqlite3 (synchronous, zero-config)

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH  = path.join(DATA_DIR, 'droplink.db');

// Ensure /data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Performance + safety
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys  = ON');

// ─── Schema ───────────────────────────────────────────────────────────────────
db.exec(`
  -- Registered users (created on first Discord login)
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,       -- Discord user ID
    username      TEXT NOT NULL,
    discriminator TEXT NOT NULL DEFAULT '0',
    avatar        TEXT,                   -- avatar hash (nullable = default avatar)
    global_name   TEXT,                   -- Discord display name (new username system)
    email         TEXT,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  -- DNS records owned by users (mirrors data in Cloudflare)
  CREATE TABLE IF NOT EXISTS records (
    id            INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id       TEXT     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cf_record_id  TEXT     NOT NULL UNIQUE,  -- Cloudflare DNS record ID
    zone_id       TEXT     NOT NULL,          -- Cloudflare Zone ID
    zone_name     TEXT     NOT NULL,          -- e.g. droplink.gg
    record_name   TEXT     NOT NULL,          -- full FQDN, e.g. panel.user.droplink.gg
    record_type   TEXT     NOT NULL,          -- A | AAAA | CNAME | MX | TXT | SRV
    content       TEXT     NOT NULL,          -- IP or hostname
    proxied       INTEGER  NOT NULL DEFAULT 0, -- 1 = proxied through CF, 0 = DNS only
    ttl           INTEGER  NOT NULL DEFAULT 1, -- 1 = Auto
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_records_user    ON records(user_id);
  CREATE INDEX IF NOT EXISTS idx_records_zone    ON records(zone_id);
  CREATE INDEX IF NOT EXISTS idx_records_cf_id   ON records(cf_record_id);
`);

module.exports = db;
