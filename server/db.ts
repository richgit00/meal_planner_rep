
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please provide your Supabase database URL.",
  );
}

// Parse and validate the DATABASE_URL
let databaseUrl = process.env.DATABASE_URL;

// Ensure we're using IPv4-compatible port 6543 for Supabase
if (databaseUrl.includes('.supabase.com:5432')) {
  databaseUrl = databaseUrl.replace(':5432', ':6543');
  console.log("✅ Updated DATABASE_URL to use IPv4-compatible port 6543");
}

if (!databaseUrl.includes(':6543/') && databaseUrl.includes('.supabase.com')) {
  console.warn("⚠️ DATABASE_URL should use port 6543 for Supabase IPv4 compatibility with Render");
}

// Environment detection for SSL configuration
const isRender = process.env.RENDER || process.env.NODE_ENV === 'production';
const isReplit = process.env.REPLIT_DEV_DOMAIN || process.env.REPL_ID;

// Configure SSL based on environment
let sslConfig;
let finalConnectionString = databaseUrl;

if (isRender) {
  // Render production environment - use SSL with certificate override
  sslConfig = {
    rejectUnauthorized: false,
    require: true
  };
  // Ensure SSL is required in connection string for Render
  if (!finalConnectionString.includes('sslmode=')) {
    finalConnectionString += finalConnectionString.includes('?') ? '&sslmode=require' : '?sslmode=require';
  }
  console.log("🚀 Using Render production SSL configuration");
} else if (isReplit) {
  // Replit development environment - disable SSL to avoid certificate issues
  sslConfig = false;
  finalConnectionString = finalConnectionString.replace(/[?&]sslmode=require/, '').replace(/sslmode=require[?&]?/, '');
  finalConnectionString += finalConnectionString.includes('?') ? '&sslmode=disable' : '?sslmode=disable';
  console.log("🔧 Using Replit development configuration (SSL disabled)");
} else {
  // Default/other environments - try SSL with fallback
  sslConfig = {
    rejectUnauthorized: false
  };
  console.log("⚙️ Using default SSL configuration");
}

const connectionConfig = {
  connectionString: finalConnectionString,
  ssl: sslConfig,
  // Connection pool settings optimized for both Render and Replit
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  max: isRender ? 20 : 10, // More connections for production
  min: 2,
  // Additional settings for stability
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
};

console.log(`📡 Connecting to database on port ${finalConnectionString.includes(':6543') ? '6543 (IPv4)' : '5432 (IPv6)'}`);

export const pool = new Pool(connectionConfig);
export const db = drizzle({ client: pool, schema });

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Database pool connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Database pool error:', err.message);
});
