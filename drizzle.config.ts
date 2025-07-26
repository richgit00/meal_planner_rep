import type { Config } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;

export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString!,
    ssl: connectionString?.includes('supabase.com') ? { rejectUnauthorized: false } : false
  },
} satisfies Config;