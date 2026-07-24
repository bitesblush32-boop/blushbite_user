export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // postgres.js emits ECONNRESET / CONNECT_TIMEOUT when Railway's TCP proxy
    // silently kills idle pooled connections. These errors have no route-level
    // catch handler because they originate from the pool keepalive, not a request.
    // Suppress them here so they don't crash the dev server or produce noise in prod.
    process.on('unhandledRejection', (reason) => {
      if (
        reason instanceof Error &&
        (reason.message.includes('ECONNRESET') ||
          reason.message.includes('CONNECT_TIMEOUT') ||
          reason.message.includes('CONNECTION_CLOSED') ||
          reason.message.includes('CONNECTION_DESTROYED'))
      ) {
        // Expected from Railway proxy killing idle pool connections — safe to ignore
        return
      }
      // Re-throw everything else so real bugs still surface
      throw reason
    })
  }
}
