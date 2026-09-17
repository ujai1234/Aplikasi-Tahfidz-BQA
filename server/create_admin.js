const Database = require("better-sqlite3");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const db = new Database("../../HRIS-BQA/sqlite.db");
const pass = bcrypt.hashSync("123456", 10);
const now = Date.now().toString();

db.prepare(`
  INSERT INTO users (username, password_hash, nama, role, email, lembaga, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  "admin@tahfidz.com",
  pass,
  "Administrator Tahfidz",
  "Admin",
  "admin@tahfidz.com",
  "Baitul Qur'an Al Ikhwan",
  "Aktif",
  now,
  now
);

console.log("Admin user created: admin@tahfidz.com / 123456");
