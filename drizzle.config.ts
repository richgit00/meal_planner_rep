import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set - ensure the database is provisioned");
}

// Get the database URL and ensure IPv4 compatibility
let databaseUrl = process.env.DATABASE_URL;

// Fix port for Supabase IPv4 compatibility
if (databaseUrl.includes('.supabase.com:5432')) {
  databaseUrl = databaseUrl.replace(':5432', ':6543');
}

// Environment detection
const isRender = process.env.RENDER || process.env.NODE_ENV === 'production';
const isReplit = process.env.REPLIT_DEV_DOMAIN || process.env.REPL_ID;

// Configure SSL based on environment - match db.ts approach
let sslConfig;

if (isReplit) {
  // Replit development - disable SSL completely
  sslConfig = false;
} else {
  // Production/Render - explicitly set rejectUnauthorized: false
  sslConfig = {
    rejectUnauthorized: false
  };
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
    ssl: sslConfig
  },
});