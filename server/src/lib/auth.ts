import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export type JwtUser = {
  id: number;
  username: string;
  nama: string;
  role: "Admin" | "Ustadz" | "Ustadzah" | "Kepsek";
  halqah: string | null;
  iat?: number;
  exp?: number;
};

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signToken(user: Omit<JwtUser, "iat" | "exp">): string {
  return jwt.sign(user, process.env.JWT_SECRET || "default_secret", { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtUser | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "default_secret") as JwtUser;
  } catch (err) {
    return null;
  }
}

const productionUrl = "https://tahfidz.baitulquranalikhwan.cloud"; // Assuming production URL

function sanitizeUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const markdownMatch = raw.match(/\[.*?\]\((https?:\/\/[^\)]+)\)/);
  if (markdownMatch) return markdownMatch[1].trim();
  return raw.replace(/^\[|\]$/g, '').trim();
}

const baseUrl = sanitizeUrl(process.env.BETTER_AUTH_URL)
  || sanitizeUrl(process.env.APP_URL)
  || "http://localhost:4000";

export const auth = betterAuth({
    baseURL: baseUrl,
    database: drizzleAdapter(db, {
        provider: "sqlite",
        schema: {
            ...schema
        }
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }
    },
    trustedOrigins: [
        "http://localhost:3000",
        "http://localhost:3001",
        sanitizeUrl(process.env.APP_URL) || productionUrl,
        productionUrl,
    ].filter((v, i, arr): v is string => typeof v === 'string' && v.length > 0 && arr.indexOf(v) === i)
});
