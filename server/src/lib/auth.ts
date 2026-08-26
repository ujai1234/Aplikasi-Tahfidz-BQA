import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Role } from "../db/schema";
import { env } from "../env";

export interface JwtUser {
  id: number;
  username: string;
  nama: string;
  role: Role;
  halqah: string | null;
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function signToken(user: JwtUser): string {
  return jwt.sign(user, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtUser | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtUser;
  } catch {
    return null;
  }
}
