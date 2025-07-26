
// Environment variable validation utility
export function validateEnvironment() {
  const required = ['DATABASE_URL'];
  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(env => console.error(`   - ${env}`));
    console.error('\n📝 To fix this:');
    console.error('1. Check your .env file exists');
    console.error('2. Ensure DATABASE_URL is set in format:');
    console.error('   postgresql://postgres:password@host:6543/postgres');
    console.error('3. For Replit: Use Secrets tab to set DATABASE_URL');
    console.error('4. For Render: Set DATABASE_URL in environment variables');
    return false;
  }
  
  // Validate DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL!;
  if (!dbUrl.includes('postgresql://')) {
    console.error('❌ DATABASE_URL must start with postgresql://');
    return false;
  }
  
  if (dbUrl.includes('.supabase.com') && !dbUrl.includes(':6543')) {
    console.warn('⚠️ Supabase URL should use port 6543 for IPv4 compatibility');
  }
  
  console.log('✅ Environment variables validated');
  return true;
}

export function logConnectionDetails() {
  const dbUrl = process.env.DATABASE_URL!;
  const url = new URL(dbUrl);
  
  console.log('📊 Database connection details:');
  console.log(`   Host: ${url.hostname}`);
  console.log(`   Port: ${url.port || '5432'}`);
  console.log(`   Database: ${url.pathname.slice(1)}`);
  console.log(`   SSL Mode: ${url.searchParams.get('sslmode') || 'default'}`);
}
