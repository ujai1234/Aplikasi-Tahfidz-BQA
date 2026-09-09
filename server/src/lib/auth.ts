import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";

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
