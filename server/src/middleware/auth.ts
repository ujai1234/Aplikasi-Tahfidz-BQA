import type { NextFunction, Request, Response } from "express";
import { verifyToken, type JwtUser } from "../lib/auth";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token tidak ditemukan — silakan login" });
    return;
  }
  const payload = verifyToken(header.slice(7));
  if (!payload) {
    res.status(401).json({ error: "Token tidak valid atau kedaluwarsa" });
    return;
  }
  req.user = payload;
  next();
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
