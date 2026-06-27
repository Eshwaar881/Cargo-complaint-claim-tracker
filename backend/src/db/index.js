import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'cargo.db');

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// ---- thin helpers (node:sqlite is low-level; wrap it like a mini ORM) ----

export function run(sql, params = {}) {
  const stmt = db.prepare(sql);
  return stmt.run(params);
}

export function get(sql, params = {}) {
  const stmt = db.prepare(sql);
  return stmt.get(params);
}

export function all(sql, params = {}) {
  const stmt = db.prepare(sql);
  return stmt.all(params);
}

export default db;
