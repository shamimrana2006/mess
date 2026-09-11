import { PrismaClient } from '@prisma/client';

function getValidDatabaseUrl(): string | undefined {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_URL_NON_POOLING,
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
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

if (resolvedDbUrl) {
  process.env.DATABASE_URL = resolvedDbUrl;
} else if (process.env.DATABASE_URL !== undefined && process.env.DATABASE_URL.trim() === '') {
  delete process.env.DATABASE_URL;
}

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



