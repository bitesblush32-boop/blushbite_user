import { NextRequest, NextResponse } from 'next/server'

const VALID_COMMUNITIES = ['female', 'male', 'shemale']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Admin auth — protect /admin/* with session cookie
  if (pathname.startsWith('/admin') && pathname !== '/admin-login') {
    const session = req.cookies.get('admin_session')?.value
    const secret = process.env.ADMIN_SESSION_SECRET

    if (!secret || !session || session !== secret) {
      const loginUrl = new URL('/admin-login', req.url)
      if (pathname !== '/admin') {
        loginUrl.searchParams.set('from', pathname)
      }
      return NextResponse.redirect(loginUrl)
    }
  }

  // /home is gone — 301 redirect to root so bookmarks/bots don't 404.
  if (pathname === '/home') {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url, { status: 301 })
  }

  // Community routing — mirrors blushbite.live device binding logic.
  // When a dreamer has a bb_community cookie, send them directly to their
  // community home (/female, /male, /shemale) instead of the generic root.
  if (pathname === '/') {
    const community = req.cookies.get('bb_community')?.value
    if (community && VALID_COMMUNITIES.includes(community)) {
      const url = req.nextUrl.clone()
      url.pathname = `/${community}`
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/home', '/admin(.*)'],
}
