import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please provide your Supabase database URL.",
  );
}

// Parse the DATABASE_URL to get connection components
const databaseUrl = process.env.DATABASE_URL;
let connectionConfig;

if (databaseUrl) {
  // Use connection string with SSL override
  connectionConfig = {
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
      sslmode: 'require'
    }
  };
} else {
  throw new Error("DATABASE_URL is required");
}

export const pool = new Pool(connectionConfig);
export const db = drizzle({ client: pool, schema });
