import { PrismaClient } from '@/app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

export function getPrisma(): PrismaClient {
  if (process.env.NODE_ENV === 'production') return createClient()
  if (!globalForPrisma.prisma) globalForPrisma.prisma = createClient()
  return globalForPrisma.prisma
}
