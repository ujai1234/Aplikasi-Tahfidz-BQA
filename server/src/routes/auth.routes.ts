import { Router } from "express";
import { eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { users } from "../db/schema";
import { signToken, verifyPassword } from "../lib/auth";
import { writeAudit } from "../lib/audit";
import { HttpError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";
import { rateLimit } from "../middleware/rate-limit";
import { validateBody } from "../middleware/validate";
import { wibParts } from "../lib/wib";

export const authRouter = Router();

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username/email wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export function publicUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    nama: user.nama,
    role: user.role,
    halqah: user.halqah,
    email: user.email,
    lembaga: user.lembaga,
    status: user.status,
  };
}

authRouter.post(
  "/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Terlalu banyak percobaan login — coba lagi dalam 15 menit",
  }),
  validateBody(loginSchema),
  (req, res) => {
    const { usernameOrEmail, password } = req.body as z.infer<typeof loginSchema>;

    const user = db
      .select()
      .from(users)
      .where(
        or(eq(users.username, usernameOrEmail), eq(users.email, usernameOrEmail))
      )
      .get();

    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new HttpError(401, "Username/email atau password salah");
    }
    if (user.status !== "Aktif") {
      throw new HttpError(403, "Akun dinonaktifkan — hubungi Admin");
    }

    const token = signToken({
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      halqah: user.halqah,
    });

    writeAudit({ id: user.id, username: user.username }, "login", "Login berhasil");

    res.json({ token, user: publicUser(user) });
  }
);

authRouter.get("/me", requireAuth, (req, res) => {
  const user = db
    .select()
    .from(users)
    .where(eq(users.id, req.user!.id))
    .get();

  if (!user) {
    throw new HttpError(404, "User tidak ditemukan");
  }
  res.json({
    user: publicUser(user),
    serverTime: wibParts().timestamp,
  });
});
