import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

type AdminGuardOk = { ok: true; userId: string }
type AdminGuardErr = { ok: false; response: NextResponse }

/**
 * Cookie-based admin auth check — no NextAuth / JWT required.
 * Reads the `admin_session` cookie and validates it against ADMIN_SESSION_SECRET.
 *
 * Usage:
 *   const guard = await requireAdmin(req)
 *   if (!guard.ok) return guard.response
 */
export async function requireAdmin(req: NextRequest): Promise<AdminGuardOk | AdminGuardErr> {
  const session = req.cookies.get('admin_session')?.value
  const secret = process.env.ADMIN_SESSION_SECRET

  if (!secret || !session || session !== secret) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }
  return { ok: true, userId: 'admin' }
}
