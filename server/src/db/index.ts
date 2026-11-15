import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "fs";
import path from "path";
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

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    nis TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    class_name TEXT NOT NULL DEFAULT '-',
    class_pesantren TEXT,
    halqah TEXT,
    tingkatan INTEGER,
    jalur TEXT DEFAULT 'Reguler',
    gender TEXT NOT NULL DEFAULT 'L',
    status TEXT NOT NULL DEFAULT 'AKTIF',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tahfidz_evaluations (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    session TEXT NOT NULL,
    student_id TEXT NOT NULL REFERENCES students(id),
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
    student_id TEXT NOT NULL REFERENCES students(id),
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

  CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    email_verified INTEGER NOT NULL DEFAULT 0,
    image TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    user_id TEXT NOT NULL REFERENCES user(id)
  );

  CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES user(id),
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at INTEGER,
    refresh_token_expires_at INTEGER,
    scope TEXT,
    password TEXT,
    issuer TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

const studentCols = sqlite.prepare("PRAGMA table_info(students)").all() as Array<{ name: string }>;
const studentColNames = new Set(studentCols.map((c) => c.name));
const studentMigrations: Array<[string, string]> = [
  ["class_pesantren", "ALTER TABLE students ADD COLUMN class_pesantren TEXT"],
  ["halqah", "ALTER TABLE students ADD COLUMN halqah TEXT"],
  ["tingkatan", "ALTER TABLE students ADD COLUMN tingkatan INTEGER"],
  ["jalur", "ALTER TABLE students ADD COLUMN jalur TEXT DEFAULT 'Reguler'"],
];
for (const [col, alterSql] of studentMigrations) {
  if (!studentColNames.has(col)) {
    sqlite.exec(alterSql);
  }
}

// Safely bridge legacy standalone Tahfidz tables (master_santri / data_santri / data_tasmi)
// into unified schema tables (students / tahfidz_evaluations / tahfidz_tasmi) if present.
try {
  const existingTables = (
    sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>
  ).map((t) => t.name);

  // Case 1: Active DB itself has legacy tables (e.g. data/bqa.db)
  if (existingTables.includes("master_santri")) {
    const studentCount = (sqlite.prepare("SELECT count(*) as c FROM students").get() as any)?.c ?? 0;
    const masterCount = (sqlite.prepare("SELECT count(*) as c FROM master_santri").get() as any)?.c ?? 0;
    if (studentCount === 0 && masterCount > 0) {
      sqlite.exec(`
        INSERT OR IGNORE INTO students (id, nis, name, class_name, class_pesantren, halqah, tingkatan, jalur, gender, status, created_at)
        SELECT CAST(id AS TEXT), nis, nama, coalesce(halqah, '-'), halqah, halqah, coalesce(tingkatan, 1), coalesce(jalur, 'Reguler'),
               case when jenis_kelamin in ('Perempuan', 'P') then 'P' else 'L' end,
               case when status_aktif = 1 or status_aktif = 'AKTIF' then 'AKTIF' else 'NONAKTIF' end,
               strftime('%s', 'now')
        FROM master_santri;
      `);
    }
  }

  if (existingTables.includes("data_santri")) {
    const evalCount = (sqlite.prepare("SELECT count(*) as c FROM tahfidz_evaluations").get() as any)?.c ?? 0;
    const dataSantriCount = (sqlite.prepare("SELECT count(*) as c FROM data_santri").get() as any)?.c ?? 0;
    if (evalCount === 0 && dataSantriCount > 0) {
      sqlite.exec(`
        INSERT OR IGNORE INTO tahfidz_evaluations (id, date, session, student_id, status, notes, teacher_name, juz_completed, created_at)
        SELECT CAST(id AS TEXT), tanggal, sesi, CAST(santri_id AS TEXT), status_capaian, penyebab, coalesce(created_by, 'Ustadz'), coalesce(juz_completed, 0), strftime('%s', 'now')
        FROM data_santri;
      `);
    }
  }

  if (existingTables.includes("data_tasmi")) {
    const tasmiCount = (sqlite.prepare("SELECT count(*) as c FROM tahfidz_tasmi").get() as any)?.c ?? 0;
    const dataTasmiCount = (sqlite.prepare("SELECT count(*) as c FROM data_tasmi").get() as any)?.c ?? 0;
    if (tasmiCount === 0 && dataTasmiCount > 0) {
      sqlite.exec(`
        INSERT OR IGNORE INTO tahfidz_tasmi (id, date, student_id, type, score, predicate, passed, examiner_name, created_at)
        SELECT CAST(id AS TEXT), tanggal, CAST(santri_id AS TEXT), jenis_tasmi, nilai, predikat, case when status_kelulusan in (1, 'Lulus') then 1 else 0 end, penguji, strftime('%s', 'now')
        FROM data_tasmi;
      `);
    }
  }

  // Case 2: Active DB is unified HRIS-BQA, but standalone data/bqa.db exists with evaluation history
  const candidateBqaPaths = [
    path.resolve(process.cwd(), "data/bqa.db"),
    path.resolve(__dirname, "../../data/bqa.db"),
    path.resolve(__dirname, "../data/bqa.db"),
  ];
  const bqaDbPath = candidateBqaPaths.find((p) => fs.existsSync(p));

  if (bqaDbPath && !existingTables.includes("data_santri")) {
    try {
      const bqaDb = new Database(bqaDbPath, { readonly: true });
      const bqaTables = (bqaDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[]).map(
        (t) => t.name
      );

      if (bqaTables.includes("data_santri")) {
        const legacyEvaluasi = bqaDb.prepare("SELECT * FROM data_santri").all() as any[];
        const checkEvalStmt = sqlite.prepare(
          "SELECT id FROM tahfidz_evaluations WHERE student_id = ? AND date = ? AND session = ?"
        );
        const insertEvalStmt = sqlite.prepare(
          "INSERT OR IGNORE INTO tahfidz_evaluations (id, date, session, student_id, status, notes, teacher_name, juz_completed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        const findStudentStmt = sqlite.prepare("SELECT id FROM students WHERE name = ? OR nis = ?");

        for (const row of legacyEvaluasi) {
          const student = findStudentStmt.get(row.nama_santri, String(row.santri_id)) as any;
          if (!student) continue;

          const exists = checkEvalStmt.get(student.id, row.tanggal, row.sesi);
          if (!exists) {
            const evalId = `BQA-EVAL-${row.id}`;
            const createdAtSec =
              Math.floor(new Date(row.created_at || row.tanggal).getTime() / 1000) ||
              Math.floor(Date.now() / 1000);
            insertEvalStmt.run(
              evalId,
              row.tanggal,
              row.sesi,
              student.id,
              row.status_capaian,
              row.penyebab || row.catatan || "",
              row.created_by || "Ustadz",
              row.juz_completed || 0,
              createdAtSec
            );
          }
        }
      }
      bqaDb.close();
    } catch (bqaBridgeErr) {
      console.warn("bqa.db legacy bridge warning:", bqaBridgeErr);
    }
  }
} catch (syncErr) {
  console.warn("Legacy table bridge warning:", syncErr);
}

export const db = drizzle(sqlite, { schema });
export { schema };
