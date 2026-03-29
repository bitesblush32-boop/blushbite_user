import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

const { auth } = NextAuth(authConfig)

// Routes that never require auth or onboarding
const PUBLIC_ROUTES = [
  '/auth/signin',
  '/auth/error',
  '/auth/companion-verify',
]
const AUTH_API_PREFIX  = '/api/auth'
const HEALTH_PATH      = '/api/health'
const WEBHOOK_PREFIX   = '/api/webhooks'

export default auth((req) => {
  const { nextUrl } = req
  const path        = nextUrl.pathname

  // Always allow NextAuth API routes and health check
  if (path.startsWith(AUTH_API_PREFIX)) return
  if (path === HEALTH_PATH) return
  if (path.startsWith(WEBHOOK_PREFIX)) return

  // Allow public pages (redirect logged-in users away from sign-in)
  const isPublic = PUBLIC_ROUTES.some(r => path.startsWith(r))
  if (isPublic) {
    if (req.auth && path.startsWith('/auth/signin')) {
      return Response.redirect(new URL('/', nextUrl))
    }
    return
  }

  // Gate 1 — no session → sign in
  if (!req.auth) {
    const signInUrl = new URL('/auth/signin', nextUrl)
    signInUrl.searchParams.set('callbackUrl', path)
    return Response.redirect(signInUrl)
  }

  // Gate 2 — session but onboarding not complete → onboarding
  // Check JWT flag OR bb_onboarded cookie (set by complete-onboarding after DB write)
  const user       = req.auth.user as any
  // Cookie stores the user's ID — must match current session so a deleted+recreated
  // account (new ID) doesn't inherit the previous user's onboarded state.
  const cookieDone = req.cookies.get('bb_onboarded')?.value === user?.id
  const onboarded  = user?.onboarding_complete || cookieDone

  // Skip onboarding gate for API routes and the onboarding page itself
  if (!onboarded && path !== '/auth/onboarding' && !path.startsWith('/api/')) {
    return Response.redirect(new URL('/auth/onboarding', nextUrl))
  }

  // All gates passed — allow through
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)'],
}
