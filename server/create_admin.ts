import { db } from "./src/db";
import { users } from "./src/db/schema";
import { hashPassword } from "./src/lib/auth";

const pass = hashPassword("123456");
const now = Date.now().toString();

db.insert(users).values({
  username: "admin@tahfidz.com",
  passwordHash: pass,
  nama: "Administrator Tahfidz",
  role: "Admin",
  email: "admin@tahfidz.com",
  lembaga: "Baitul Qur'an Al Ikhwan",
  status: "Aktif",
  createdAt: now,
  updatedAt: now,
}).run();

console.log("Admin user created: admin@tahfidz.com / 123456");
