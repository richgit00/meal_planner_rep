import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please provide your Supabase database URL.",
  );
}

// Parse and validate the DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

// Ensure the connection string includes port 6543 and proper SSL
let finalConnectionString = databaseUrl;
if (!finalConnectionString.includes(':6543/')) {
  console.warn("⚠️ DATABASE_URL should use port 6543 for Supabase IPv4 compatibility");
}

// Environment-aware SSL configuration
// Disable SSL for development (Replit), enable for production (Render)
const isProduction = process.env.NODE_ENV === 'production';
const connectionConfig = {
  connectionString: isProduction 
    ? finalConnectionString 
    : finalConnectionString.replace('sslmode=require', 'sslmode=disable'),
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  // Additional connection settings for stability
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10
};

export const pool = new Pool(connectionConfig);
export const db = drizzle({ client: pool, schema });
