import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const databasePath = path.resolve(process.env.DATABASE_PATH || path.join(dir, '..', 'lavina.db'));
mkdirSync(path.dirname(databasePath), { recursive: true });
export const db = new Database(databasePath);
db.pragma('journal_mode = WAL');
db.exec(readFileSync(path.join(dir, 'schema.sql'), 'utf8'));

const ensureColumn = (table, column, definition) => {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some(item => item.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
};

ensureColumn('reviews', 'is_approved', 'INTEGER NOT NULL DEFAULT 1');
ensureColumn('stores', 'images', `TEXT NOT NULL DEFAULT '[]'`);
ensureColumn('stores', 'location_url', 'TEXT');
ensureColumn('stores', 'opening_hours', `TEXT NOT NULL DEFAULT '{}'`);
