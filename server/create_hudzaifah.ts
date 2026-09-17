import { db } from "./src/db";
import { users } from "./src/db/schema";
import { hashPassword } from "./src/lib/auth";

const pass = hashPassword("123456");
const now = Date.now().toString();

db.insert(users).values({
  username: "zeikun98@gmail.com",
  passwordHash: pass,
  nama: "Ustadz Hudzaifah",
  role: "Admin",
  email: "zeikun98@gmail.com",
  lembaga: "Baitul Qur'an Al Ikhwan",
  status: "Aktif",
  createdAt: now,
  updatedAt: now,
}).run();

console.log("Admin user created: zeikun98@gmail.com / 123456");
