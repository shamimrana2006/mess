const { execSync } = require('child_process');

// Auto-detect Vercel Postgres environment variables
const dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

if (dbUrl) {
  process.env.DATABASE_URL = dbUrl;
  console.log('🔗 Database connection URL detected successfully!');
  try {
    console.log('📦 Syncing database schema with Prisma db push...');
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: dbUrl },
    });
    console.log('🌱 Seeding initial manager account and mess settings...');
    execSync('node prisma/seed.js', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: dbUrl },
    });
    console.log('✅ Database sync completed!');
  } catch (error) {
    console.warn('⚠️ Note: Database sync during build had a notice, continuing build...', error.message);
  }
} else {
  console.log('ℹ️ No DATABASE_URL detected during build, skipping db push.');
}
