import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please provide your Supabase database URL.",
  );
}

// Ensure SSL mode is included in connection string
const databaseUrl = process.env.DATABASE_URL;
const connectionString = databaseUrl?.includes('sslmode=') 
  ? databaseUrl 
  : `${databaseUrl}${databaseUrl?.includes('?') ? '&' : '?'}sslmode=require`;

export const pool = new Pool({ 
  connectionString,
  ssl: { 
    rejectUnauthorized: false 
  }
});
export const db = drizzle({ client: pool, schema });
