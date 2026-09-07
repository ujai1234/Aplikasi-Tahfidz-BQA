import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { env } from "../env";

export const sqlite = new Database(env.DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("cache_size = -64000"); // 64MB cache
sqlite.pragma("synchronous = NORMAL");
sqlite.pragma("temp_store = MEMORY");

export const db = drizzle(sqlite, { schema });
export { schema };
