import { PrismaClient } from '@/app/generated/prisma'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createClient() {
  return new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  })
}

export function getPrisma(): PrismaClient {
  if (process.env.NODE_ENV === 'production') return createClient()
  if (!globalForPrisma.prisma) globalForPrisma.prisma = createClient()
  return globalForPrisma.prisma
}
