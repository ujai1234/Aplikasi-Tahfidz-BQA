import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { env } from "../env";

export const sqlite = new Database(env.DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("cache_size = -64000"); // 64MB cache
sqlite.pragma("synchronous = NORMAL");
sqlite.pragma("temp_store = MEMORY");

// Ensure Tahfidz tables exist on startup to prevent 500 Internal Server Error
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nama TEXT NOT NULL,
    role TEXT NOT NULL,
    halqah TEXT,
    email TEXT UNIQUE,
    lembaga TEXT,
    status TEXT NOT NULL DEFAULT 'Aktif',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tahfidz_evaluations (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    session TEXT NOT NULL,
    student_id TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    teacher_name TEXT NOT NULL,
    juz_completed INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS absensi_ustadz (
    id TEXT PRIMARY KEY,
    tanggal TEXT NOT NULL,
    jam TEXT NOT NULL,
    username TEXT NOT NULL,
    nama TEXT NOT NULL,
    sesi TEXT NOT NULL,
    halqah TEXT,
    status TEXT NOT NULL,
    jarak_meter INTEGER,
    lokasi_validasi INTEGER NOT NULL DEFAULT 0,
    keterangan TEXT,
    is_admin_override INTEGER NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tahfidz_tasmi (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    student_id TEXT NOT NULL,
    type TEXT NOT NULL,
    score INTEGER NOT NULL,
    predicate TEXT NOT NULL,
    passed INTEGER NOT NULL,
    examiner_name TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tahfidz_audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT,
    created_at TEXT NOT NULL
  );
`);

export const db = drizzle(sqlite, { schema });
export { schema };
