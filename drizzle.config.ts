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

// Configure SSL based on environment
let sslConfig;
let finalUrl = databaseUrl;

if (isRender) {
  // Render production - require SSL with certificate override
  sslConfig = {
    rejectUnauthorized: false,
    require: true
  };
  if (!finalUrl.includes('sslmode=')) {
    finalUrl += finalUrl.includes('?') ? '&sslmode=require' : '?sslmode=require';
  }
} else if (isReplit) {
  // Replit development - disable SSL
  sslConfig = false;
  finalUrl = finalUrl.replace(/[?&]sslmode=require/, '').replace(/sslmode=require[?&]?/, '');
  finalUrl += finalUrl.includes('?') ? '&sslmode=disable' : '?sslmode=disable';
} else {
  // Default - try SSL
  sslConfig = {
    rejectUnauthorized: false
  };
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: (process.env.RENDER === 'true' || (process.env.NODE_ENV === 'production' && !process.env.REPLIT_DEV_DOMAIN))
      ? process.env.DATABASE_URL 
      : process.env.DATABASE_URL?.replace('sslmode=require', 'sslmode=disable'),
    ssl: (process.env.RENDER === 'true' || (process.env.NODE_ENV === 'production' && !process.env.REPLIT_DEV_DOMAIN)) 
      ? { rejectUnauthorized: false } : false
  },
});