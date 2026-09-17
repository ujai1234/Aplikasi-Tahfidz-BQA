import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Environment variable ${name} wajib diisi (lihat .env.example)`);
  }
  return value;
}

const dbPath = required("DB_PATH", "./data/bqa.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const env = {
  PORT: Number(process.env.PORT ?? 4000),
  JWT_SECRET: required("JWT_SECRET", "dev-secret-bqa-ganti-di-produksi"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "5m",
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "https://tahfidz.baitulquranalikhwan.cloud,http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:5173,http://localhost:5174,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:5173",
  DB_PATH: dbPath,
};

