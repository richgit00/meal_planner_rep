
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { validateEnvironment, logConnectionDetails } from './env-check';

// Validate environment variables
if (!validateEnvironment()) {
  process.exit(1);
}

logConnectionDetails();

// Log environment for debugging
console.log("🔍 Environment check:");
console.log("- NODE_ENV:", process.env.NODE_ENV);
console.log("- RENDER:", process.env.RENDER ? "✅" : "❌");
console.log("- REPLIT_DEV_DOMAIN:", process.env.REPLIT_DEV_DOMAIN ? "✅" : "❌");
console.log("- DATABASE_URL:", process.env.DATABASE_URL ? "✅ Set" : "❌ Missing");

// Parse and validate the DATABASE_URL
let databaseUrl = process.env.DATABASE_URL;

// Ensure we're using IPv4-compatible port 6543 for Supabase on Render
if (databaseUrl.includes('.supabase.com')) {
  if (databaseUrl.includes(':5432')) {
    databaseUrl = databaseUrl.replace(':5432', ':6543');
    console.log("✅ Updated DATABASE_URL to use IPv4-compatible port 6543 for Render");
  } else if (!databaseUrl.includes(':6543')) {
    console.warn("⚠️ DATABASE_URL should use port 6543 for Supabase IPv4 compatibility with Render");
  }
}

// Environment detection for SSL configuration
const isReplit = process.env.REPLIT_DEV_DOMAIN || process.env.REPL_ID;

// Configure SSL based on environment - crucial for Render deployment
let sslConfig;

if (isReplit) {
  // Replit development environment - disable SSL completely
  sslConfig = false;
  console.log("🔧 Using Replit development configuration (SSL disabled)");
} else {
  // Production/Render environment - MUST explicitly set rejectUnauthorized: false
  sslConfig = {
    rejectUnauthorized: false  // This is crucial for Supabase self-signed certs
  };
  console.log("🚀 Using production SSL configuration (rejectUnauthorized: false)");
}

const connectionConfig = {
  connectionString: databaseUrl,
  ssl: sslConfig,
  // Connection pool settings optimized for both Render and Replit
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  max: isReplit ? 10 : 20, // More connections for production
  min: 2,
  // Additional settings for stability
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
};

console.log(`📡 Connecting to database on port ${databaseUrl.includes(':6543') ? '6543 (IPv4)' : '5432 (IPv6)'}`);

export const pool = new Pool(connectionConfig);
export const db = drizzle({ client: pool, schema });

// Test connection on startup with detailed error handling
pool.on('connect', () => {
  console.log('✅ Database pool connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Database pool error:', err.message);
  
  // Provide specific guidance for common SSL errors
  if (err.message.includes('SELF_SIGNED_CERT_IN_CHAIN')) {
    console.error('🔒 SSL Certificate Error: Supabase is using a self-signed certificate');
    console.error('💡 This should be handled by rejectUnauthorized: false in the SSL config');
  }
  
  if (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED')) {
    console.error('🌐 Connection Error: Check your DATABASE_URL and network connectivity');
  }
  
  if (err.message.includes('authentication failed')) {
    console.error('🔑 Authentication Error: Check your database password in DATABASE_URL');
  }
});

// Test initial connection
(async () => {
  try {
    const client = await pool.connect();
    console.log('🔌 Initial database connection test successful');
    client.release();
  } catch (error) {
    console.error('❌ Initial database connection failed:', error.message);
    
    // Enhanced error guidance
    if (error.message.includes('SELF_SIGNED_CERT_IN_CHAIN')) {
      console.error('🔧 To fix SSL issues, ensure your DATABASE_URL uses port 6543 and SSL is properly configured');
    }
  }
})();
