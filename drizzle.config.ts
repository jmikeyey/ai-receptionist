import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Standalone tooling (not Next) — load env explicitly. .env.local wins over .env.
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
