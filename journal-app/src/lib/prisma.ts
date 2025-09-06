import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

// Debug environment variables
console.log('Prisma setup - Environment variables:')
console.log('TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL)
console.log('TURSO_AUTH_TOKEN:', process.env.TURSO_AUTH_TOKEN ? 'Present' : 'Missing')

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

const adapter = new PrismaLibSQL(libsql)
const prisma = new PrismaClient({ 
  adapter,
  log: ['query', 'info', 'warn', 'error']
})

export default prisma