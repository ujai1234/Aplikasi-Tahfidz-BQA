import { Router } from "express";
import { eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { users } from "../db/schema";
import { signToken, verifyPassword, auth } from "../lib/auth";
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

/**
 * POST /api/auth/google-token
 * Called by frontend after Google OAuth callback.
 * Reads the better-auth session cookie, finds the matching Tahfidz user by email,
 * and returns a standard JWT token so the rest of the app works identically to manual login.
 */
authRouter.post("/google-token", async (req, res) => {
  try {
    const session = await auth.api.getSession({ headers: new Headers(req.headers as any) });
    if (!session?.user?.email) {
      res.status(401).json({ error: "Sesi Google tidak ditemukan. Silakan login ulang." });
      return;
    }

    const email = session.user.email;
    const tUser = db.select().from(users).where(eq(users.email, email)).get();
    if (!tUser) {
      res.status(403).json({
        error: `Email ${email} belum terdaftar di sistem Tahfidz BQA. Hubungi Admin untuk didaftarkan.`,
      });
      return;
    }
    if (tUser.status !== "Aktif") {
      res.status(403).json({ error: "Akun dinonaktifkan — hubungi Admin" });
      return;
    }

    const token = signToken({
      id: tUser.id,
      username: tUser.username,
      nama: tUser.nama,
      role: tUser.role,
      halqah: tUser.halqah,
    });

    writeAudit({ id: tUser.id, username: tUser.username }, "login", "Login via Google berhasil");

    res.json({ token, user: publicUser(tUser) });
  } catch (err) {
    console.error("[google-token]", err);
    res.status(500).json({ error: "Gagal memverifikasi sesi Google" });
  }
});

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

authRouter.post("/refresh", requireAuth, (req, res) => {
  const user = db
    .select()
    .from(users)
    .where(eq(users.id, req.user!.id))
    .get();

  if (!user || user.status !== "Aktif") {
    throw new HttpError(401, "Sesi tidak valid atau akun dinonaktifkan");
  }

  const token = signToken({
    id: user.id,
    username: user.username,
    nama: user.nama,
    role: user.role,
    halqah: user.halqah,
  });

  res.json({ token, user: publicUser(user) });
});
