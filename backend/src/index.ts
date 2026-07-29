import { app } from './app';
import { env } from './config/env';
import prisma from './config/db';

async function main() {
  // Verify DB connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 CodeVed API running on http://localhost:${env.PORT}`);
    console.log(`📡 Environment: ${env.NODE_ENV}`);
    console.log(`🔒 CORS origins: ${env.FRONTEND_ORIGIN}, ${env.ADMIN_ORIGIN}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('✅ Database disconnected. Goodbye.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
