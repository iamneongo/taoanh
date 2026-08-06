import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Fall back to a well-formed dummy URL when DATABASE_URL is absent (e.g. during
// the Docker build). No query runs at build time, so the dummy never connects;
// at runtime DATABASE_URL is always set.
const sql = neon(process.env.DATABASE_URL || "postgresql://user:pass@localhost/db");
export const db = drizzle(sql, { schema });

export * from "./schema";
