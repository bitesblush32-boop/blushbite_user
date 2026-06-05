import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

const { auth } = NextAuth(authConfig)

// Routes that never require auth or onboarding
const PUBLIC_ROUTES = [
  '/auth/signin',
  '/auth/error',
  '/privacy',
  '/terms',
  '/admin-generate',
  '/admin',
  '/sitemap.xml',
  '/robots.txt',
]
const AUTH_API_PREFIX  = '/api/auth'
const ADMIN_API_PREFIX = '/api/admin'
const HEALTH_PATH      = '/api/health'
const WEBHOOK_PREFIX   = '/api/webhooks'

export default auth((req) => {
  const { nextUrl } = req
  const path        = nextUrl.pathname

  // Always allow NextAuth API routes, admin API routes, and health check
  if (path.startsWith(AUTH_API_PREFIX)) return
  if (path.startsWith(ADMIN_API_PREFIX)) return
  if (path === HEALTH_PATH) return
  if (path.startsWith(WEBHOOK_PREFIX)) return

  // Allow public pages (redirect logged-in users away from sign-in and landing)
  const isPublic = path === '/' || PUBLIC_ROUTES.some(r => path.startsWith(r))
  if (isPublic) {
    if (req.auth && (path === '/' || path.startsWith('/auth/signin'))) {
      return Response.redirect(new URL('/home', nextUrl))
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
  const user       = req.auth.user as any
  const cookieDone = req.cookies.get('bb_onboarded')?.value === user?.id
  const onboarded  = user?.onboarding_complete || cookieDone

  if (!onboarded && path !== '/auth/onboarding' && !path.startsWith('/api/')) {
    return Response.redirect(new URL('/auth/onboarding', nextUrl))
  }

  // Gate: Admin users → /admin only
  const token = req.auth?.user as any
  if (token?.platform_role === 'admin') {
    if (!path.startsWith('/admin') && !path.startsWith('/api/admin') && !path.startsWith('/api/auth')) {
      return Response.redirect(new URL('/admin', nextUrl))
    }
    return
  }

  // Gate 4 — Companion routing (platform_role === 'companion' or 'dream')
  if (token?.platform_role === 'companion' || token?.platform_role === 'dream') {
    const legalSigned = (token.companion_legal_signed as boolean) ?? false

    // Always pass API routes through
    if (path.startsWith('/api/') || path.startsWith('/auth/')) return

    // Companion-specific bare routes (no nav chrome)
    const bareRoutes = ['/companion/legal', '/companion/onboarding/legal']
    const isBare = bareRoutes.some(r => path.startsWith(r))

    // If legal not signed → force to /companion/legal
    if (!legalSigned && !isBare) {
      return Response.redirect(new URL('/companion/legal', nextUrl))
    }

    // Redirect /profile → /companion/profile so companions never see the dreamer profile page
    if (path === '/profile') {
      return Response.redirect(new URL('/companion/profile', nextUrl))
    }

    // Legal signed → companions access ALL routes freely
    return
  }

  // All gates passed — allow through
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)'],
}
