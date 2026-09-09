import { db } from "./src/db/index.js";
import { users } from "./src/db/schema.js";
import { hashPassword } from "./src/lib/auth.js";
import { eq } from "drizzle-orm";

async function seed() {
  const adminEmail = "ujai757@gmail.com";
  const timestamp = new Date().toISOString();

  // Check if user already exists
  const existing = db.select().from(users).where(
    (u) => u.username === "ujai757"
  ).get();

  if (existing) {
    console.log("Admin account ujai757 already exists. Updating email if needed...");
    db.update(users).set({ email: adminEmail }).where(eq(users.id, existing.id)).run();
    console.log("Updated.");
  } else {
    console.log("Creating new Admin account...");
    db.insert(users).values({
      username: "ujai757",
      passwordHash: hashPassword("PasswordKuat!2026"),
      nama: "Ustadz Hudzaifah",
      role: "Admin",
      email: adminEmail,
      createdAt: timestamp,
      updatedAt: timestamp,
    }).run();
    console.log("Admin created successfully.");
  }
}

seed();
