import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

let prisma: PrismaClient

function createPrismaClient() {
  // Load environment variables
  const DATABASE_URL = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL
  const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN

  console.log('Prisma client environment check:', {
    DATABASE_URL: DATABASE_URL ? 'Present' : 'Missing',
    TURSO_AUTH_TOKEN: TURSO_AUTH_TOKEN ? 'Present' : 'Missing',
    NODE_ENV: process.env.NODE_ENV
  })

  if (!DATABASE_URL || !TURSO_AUTH_TOKEN) {
    throw new Error(`Missing required environment variables: 
      DATABASE_URL: ${DATABASE_URL ? 'Present' : 'Missing'}
      TURSO_AUTH_TOKEN: ${TURSO_AUTH_TOKEN ? 'Present' : 'Missing'}`)
  }

  const libsql = createClient({
    url: DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN,
  })

  const adapter = new PrismaLibSQL(libsql)
  
  return new PrismaClient({ 
    adapter
  })
}

// Global singleton pattern for Next.js
if (process.env.NODE_ENV === 'production') {
  prisma = createPrismaClient()
} else {
  if (!(global as any).prisma) {
    (global as any).prisma = createPrismaClient()
  }
  prisma = (global as any).prisma
}

export default prisma