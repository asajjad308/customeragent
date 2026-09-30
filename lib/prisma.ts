import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';

// Turso (hosted SQLite) in production; a local SQLite file such as file:./prisma/dev.db in development.
export function createPrismaClient() {
  const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error('TURSO_DATABASE_URL (or DATABASE_URL for a local SQLite file) is not set');
  if (url.startsWith('postgres')) throw new Error('DATABASE_URL is a Postgres URL; set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN');

  const adapter = new PrismaLibSql({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
