import type { NextFunction, Request, Response } from "express";
import { verifyToken, type JwtUser } from "../lib/auth";
import { auth } from "../lib/auth"; // Better Auth instance
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    const payload = verifyToken(header.slice(7));
    if (!payload) {
      res.status(401).json({ error: "Token tidak valid atau kedaluwarsa" });
      return;
    }
    req.user = payload;
    next();
    return;
  }
  
  // Try Better Auth
  try {
    const session = await auth.api.getSession({ headers: new Headers(req.headers as any) });
    if (!session || !session.user) {
       res.status(401).json({ error: "Sesi tidak valid — silakan login via Google" });
       return;
    }
    
    // Fallback: Check email in Tahfidz users table
    const tUser = db.select().from(users).where(eq(users.email, session.user.email)).get();
    if (!tUser) {
       res.status(403).json({ error: "Email Google belum terdaftar di sistem Tahfidz. Hubungi Admin." });
       return;
    }
    
    req.user = {
      id: tUser.id,
      username: tUser.username,
      nama: tUser.nama,
      role: tUser.role as any,
      halqah: tUser.halqah
    };
    next();
  } catch (err) {
    res.status(401).json({ error: "Gagal memverifikasi sesi" });
  }
}

export function requireRoles(...roles: Array<string>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Belum terautentikasi" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: `Akses ditolak — khusus ${roles.join("/")}` });
      return;
    }
    next();
  };
}

export const requireAdmin = [
  requireAuth,
  requireRoles("Admin"),
];

export function requireWrite(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role === "Kepsek") {
    res
      .status(403)
      .json({ error: "Kepala Pesantren hanya dapat melihat data (view-only)" });
    return;
  }
  next();
}

export function scopeHalqah(user: JwtUser): string | null {
  return user.role === "Ustadz" || user.role === "Ustadzah" ? user.halqah : null;
}
