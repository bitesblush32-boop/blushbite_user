import { NextRequest, NextResponse } from 'next/server'

/**
 * Minimal middleware — only protects /admin/* routes with a session cookie.
 * Public routes (dreamer feed, companion profiles, etc.) are fully open.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin') && pathname !== '/admin-login') {
    const session = req.cookies.get('admin_session')?.value
    const secret  = process.env.ADMIN_SESSION_SECRET

    if (!secret || !session || session !== secret) {
      const loginUrl = new URL('/admin-login', req.url)
      if (pathname !== '/admin') {
        loginUrl.searchParams.set('from', pathname)
      }
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin(.*)'],
}
