import { PrismaClient } from "@prisma/client";
import { getPrismaDatabaseUrl } from "./db-url";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: getPrismaDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Reuse client across warm serverless invocations (Netlify)
globalForPrisma.prisma = prisma;

export async function pingDatabase() {
  await prisma.$queryRaw`SELECT 1`;
}
