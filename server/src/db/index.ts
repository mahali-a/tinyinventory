import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { config } from "../config";
import { mkdirSync } from "fs";
import { dirname } from "path";

mkdirSync(dirname(config.DATABASE_URL), { recursive: true });

const sqlite = new Database(config.DATABASE_URL);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
