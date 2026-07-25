import net from 'net'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// TODO: replace with connection pooler (PgBouncer / Neon serverless) in production
const client = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 10,      // recycle idle connections after 10s — well before Railway's ~60s TCP kill
  connect_timeout: 10,   // Railway remote DB needs more headroom than 3s
  max_lifetime: 180,     // force-recycle connections every 3 min regardless of activity

  // Custom socket factory: adds a 25-second idle timeout on each TCP socket.
  // Railway's proxy silently drops connections (no TCP RST), so Node.js would
  // otherwise hang for ~67s waiting for the OS-level TCP timeout.
  // 25 seconds is safe: no legitimate DB query in this app should take longer.
  // postgres.js v3 supports `socket` at runtime but its typedefs omit it
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // @ts-expect-error
  socket(opt: any) {
    // postgres.js v3 passes host/port as arrays; net.createConnection needs scalars
    const host = Array.isArray(opt.host) ? opt.host[0] : (opt.hostname ?? opt.host)
    const port = Array.isArray(opt.port) ? opt.port[0] : opt.port
    const s = net.createConnection(
      opt.path ? { path: opt.path } : { host, port }
    )
    s.setTimeout(25_000, () => {
      s.destroy(Object.assign(new Error('SOCKET_IDLE_TIMEOUT'), { code: 'SOCKET_IDLE_TIMEOUT' }))
    })
    return s
  },
})

// postgres.js fires ECONNRESET / CONNECT_TIMEOUT / SOCKET_IDLE_TIMEOUT on pool
// connections that Railway's TCP proxy kills. These have no request-level promise
// waiting for them so Node.js promotes them to unhandledRejection.
// Route-level try/catch already handles the same errors on in-flight queries.
process.on('unhandledRejection', (reason) => {
  if (
    reason instanceof Error &&
    /ECONNRESET|CONNECT_TIMEOUT|CONNECTION_CLOSED|CONNECTION_DESTROYED|SOCKET_IDLE_TIMEOUT/.test(
      reason.message
    )
  ) {
    return // expected from Railway proxy — safe to swallow
  }
  throw reason // surface everything else as a genuine crash
})

export const db = drizzle(client, { schema })
