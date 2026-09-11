import { PrismaClient } from '@prisma/client';

function getValidDatabaseUrl(): string | undefined {
  const env = process.env;
  const candidates = [
    env.DATABASE_URL,
    env.mess_PRISMA_DATABASE_URL,
    env.mess_POSTGRES_URL,
    env.POSTGRES_PRISMA_URL,
    env.POSTGRES_URL,
    env.POSTGRES_URL_NON_POOLING,
  ];

  for (const candidate of candidates) {
    if (
      typeof candidate === 'string' &&
      candidate.trim().length > 0 &&
      (candidate.trim().startsWith('postgresql://') || candidate.trim().startsWith('postgres://'))
    ) {
      return candidate.trim();
    }
  }
  return undefined;
}

const resolvedDbUrl = getValidDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: resolvedDbUrl
      ? {
          db: {
            url: resolvedDbUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;




