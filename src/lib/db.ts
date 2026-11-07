import { PrismaClient } from '@prisma/client'
import { join } from 'node:path'

function databaseUrl() {
  if (!process.env.DATABASE_URL) return undefined
  const url = new URL(process.env.DATABASE_URL)
  if (url.hostname.endsWith('.pooler.supabase.com')) {
    url.searchParams.set('sslmode', 'require')
    url.searchParams.set('sslaccept', 'strict')
    url.searchParams.set('sslcert', join(process.cwd(), 'certs/supabase-root-2021.crt'))
  }
  return url.toString()
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [],
    datasourceUrl: databaseUrl(),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db