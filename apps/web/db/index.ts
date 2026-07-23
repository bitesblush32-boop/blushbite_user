import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// TODO: replace with connection pooler (PgBouncer / Neon serverless) in production
const client = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,      // drop idle connections before Railway kills them at ~60s
  connect_timeout: 10,   // Railway remote DB needs more headroom than 3s
  max_lifetime: 300,     // recycle connections every 5 min to avoid Railway proxy killing stale sockets
})

export const db = drizzle(client, { schema })
