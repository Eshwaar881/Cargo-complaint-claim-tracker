import pg from 'pg';
import sqliteDb from './index.js';

const { Pool } = pg;

let pool = null;
let useFallback = false;

const dbUrl = process.env.DATABASE_URL;
const isPlaceholder = !dbUrl || dbUrl.includes('ep-xxxxxx');

if (!isPlaceholder) {
  try {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    });
  } catch (err) {
    console.warn("⚠️ Failed to create PG Pool. Falling back to local SQLite database.");
    useFallback = true;
  }
} else {
  console.warn("⚠️ DATABASE_URL is placeholder or missing. Falling back to local SQLite database.");
  useFallback = true;
}

export async function query(text, params = []) {
  if (useFallback) {
    // Map Postgres parameterized queries ($1, $2, etc) to SQLite syntax
    const sqlText = text
      .replace(/users/g, 'neon_users_fallback')
      .replace(/\$1/g, '?')
      .replace(/\$2/g, '?')
      .replace(/\$3/g, '?')
      .replace(/\$4/g, '?')
      .replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
      .replace(/TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP/g, 'TEXT DEFAULT CURRENT_TIMESTAMP')
      .replace(/RETURNING id, name, email, role, created_at/g, ''); 
    
    if (sqlText.trim().toUpperCase().startsWith('SELECT')) {
      const stmt = sqliteDb.prepare(sqlText);
      const rows = stmt.all(...params);
      return { rows };
    } else if (sqlText.trim().toUpperCase().startsWith('INSERT')) {
      const insertSql = sqlText.split('RETURNING')[0];
      const stmt = sqliteDb.prepare(insertSql);
      const info = stmt.run(...params);
      
      const selectStmt = sqliteDb.prepare('SELECT * FROM neon_users_fallback WHERE id = ?');
      const row = selectStmt.get(info.lastInsertRowid);
      return { rows: [row] };
    } else {
      sqliteDb.exec(sqlText);
      return { rows: [] };
    }
  }

  try {
    return await pool.query(text, params);
  } catch (err) {
    console.warn("⚠️ Neon Database query failed. Dynamically falling back to SQLite:", err.message);
    useFallback = true;
    return query(text, params);
  }
}

export async function initNeon() {
  if (useFallback) {
    try {
      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS neon_users_fallback (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("✅ Fallback Local SQLite: 'neon_users_fallback' table is ready.");
    } catch (err) {
      console.error("❌ Fallback Local SQLite: Failed to initialize table:", err);
    }
    return;
  }

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Neon Database: 'users' table initialized.");
  } catch (err) {
    console.warn("⚠️ Neon Database connection failed during init. Switch to local SQLite fallback.");
    useFallback = true;
    await initNeon();
  }
}

export default pool;
