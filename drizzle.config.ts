import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set - ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.NODE_ENV === 'production' 
      ? process.env.DATABASE_URL 
      : process.env.DATABASE_URL?.replace('sslmode=require', 'sslmode=disable'),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  },
});
