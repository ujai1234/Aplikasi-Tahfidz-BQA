import { createApp } from "./app";
import { env } from "./env";
import { db } from "./db";
import { users } from "./db/schema";

const app = createApp();

const totalUsers = db.select({ id: users.id }).from(users).all().length;

app.listen(env.PORT, () => {
  console.log("==============================================");
  console.log("  BQA Tahfidz API — Baitul Qur'an Al-Ikhwan");
  console.log(`  Server  : http://localhost:${env.PORT}/api`);
  console.log(`  Database: ${env.DB_PATH}`);
  console.log(
    totalUsers === 0
      ? "  ⚠  Database kosong — jalankan: npm run db:seed"
      : `  Users   : ${totalUsers} akun terdaftar`
  );
  console.log("==============================================");
});
