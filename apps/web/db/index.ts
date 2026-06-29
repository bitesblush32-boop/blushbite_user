import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// TODO: replace with connection pooler (PgBouncer / Neon serverless) in production
const client = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 3, // fail fast — 3s instead of 10s so JWT errors surface quickly
})

export const db = drizzle(client, { schema })
