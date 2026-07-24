export async function register() {
  // Skip in Edge runtime — only Node.js process has these pool-level events
  if (process.env.NEXT_RUNTIME === 'edge') return

  // postgres.js emits ECONNRESET / CONNECT_TIMEOUT when Railway's TCP proxy
  // silently kills idle pooled connections. These errors surface as
  // unhandledRejection because they originate from the pool keepalive, not
  // from an active request promise. Suppress them here; route-level try/catch
  // handles the errors that belong to in-flight queries.
  process.on('unhandledRejection', (reason) => {
    if (
      reason instanceof Error &&
      (reason.message.includes('ECONNRESET') ||
        reason.message.includes('CONNECT_TIMEOUT') ||
        reason.message.includes('CONNECTION_CLOSED') ||
        reason.message.includes('CONNECTION_DESTROYED'))
    ) {
      // Expected: Railway proxy killing idle pool connections — safe to ignore
      return
    }
    // Re-throw everything else so real bugs still surface
    throw reason
  })
}
