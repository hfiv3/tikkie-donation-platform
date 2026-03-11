import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// In Docker: /app/data/donatieactie.db (via volume)
// In dev: ./data/donatieactie.db (project root)
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "donatieactie.db");

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT DEFAULT 'Anoniem',
    amount INTEGER NOT NULL,
    message TEXT,
    tikkie_status TEXT DEFAULT 'pending',
    tikkie_id TEXT,
    tikkie_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    wants_invoice INTEGER DEFAULT 0,
    company_name TEXT,
    company_address TEXT,
    company_postcode TEXT,
    company_city TEXT,
    company_kvk TEXT,
    company_btw TEXT,
    company_email TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

export default db;
