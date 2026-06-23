import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

type AdminGuardOk  = { ok: true;  userId: string }
type AdminGuardErr = { ok: false; response: NextResponse }

/**
 * Fast admin auth check using JWT decode — no DB round-trip.
 * Reads the session cookie and decodes the JWT locally (~1ms vs ~500ms for auth()).
 *
 * Usage:
 *   const guard = await requireAdmin(req)
 *   if (!guard.ok) return guard.response
 *   const { userId } = guard
 */
export async function requireAdmin(req: NextRequest): Promise<AdminGuardOk | AdminGuardErr> {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
  })
  if (!token || (token as any).platform_role !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }
  return { ok: true, userId: token.id as string }
}
