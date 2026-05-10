import { Database } from "bun:sqlite";
import { SCHEMA } from "./schema.js";

const DB_PATH = process.env.DB_PATH ?? "./data/library.db";

export const db = new Database(DB_PATH, { create: true });
db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA foreign_keys = ON");
db.run(SCHEMA);
