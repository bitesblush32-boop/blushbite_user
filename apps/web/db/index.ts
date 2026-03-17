import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// TODO: replace with connection pooler (PgBouncer / Neon serverless) in production
const client = postgres(process.env.DATABASE_URL!, {
  max: 1, // serverless-safe: one connection per lambda cold start
})

export const db = drizzle(client, { schema })
