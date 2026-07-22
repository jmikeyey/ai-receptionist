import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return drizzle(postgres(url, { prepare: false }), { schema });
}

let cached: ReturnType<typeof createDb> | undefined;

/** Lazily-initialized Drizzle client. Throws if DATABASE_URL is missing. */
export function db() {
  return (cached ??= createDb());
}

export { schema };
