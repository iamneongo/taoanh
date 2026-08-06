import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// node-postgres works with a standard Postgres (co-located Dokploy DB → low
// latency) as well as Neon's pooler. Falls back to a dummy URL during the
// Docker build (no query runs then, so it never actually connects).
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://user:pass@localhost:5432/db",
});

export const db = drizzle(pool, { schema });

export * from "./schema";
