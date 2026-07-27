// Called after OTP for new users — saves username + phone, marks onboarding complete
import { NextRequest, NextResponse } from 'next/server'
import { getSession, buildSessionCookie } from '@/lib/dreamerSession'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, ne, and } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let alias: string, phone: string | undefined
  try {
    const body = await req.json()
    alias = (body.alias ?? '').trim()
    phone = (body.phone ?? '').trim() || undefined
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (!alias || alias.length < 2 || alias.length > 50) {
    return NextResponse.json({ error: 'Username must be 2–50 characters.' }, { status: 400 })
  }

  // Strip @ prefix if provided
  const cleanAlias = alias.startsWith('@') ? alias.slice(1) : alias

  // Uniqueness check (exclude current user)
  const [taken] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.alias, cleanAlias), ne(users.id, session.sub)))
    .limit(1)

  if (taken) {
    return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 })
  }

  await db
    .update(users)
    .set({
      alias: cleanAlias,
      phone: phone ?? null,
      onboarding_complete: true,
      updated_at: new Date(),
    })
    .where(eq(users.id, session.sub))

  // Re-issue cookie with updated alias
  const cookie = await buildSessionCookie({
    sub: session.sub,
    email: session.email,
    alias: cleanAlias,
  })

  return NextResponse.json({ ok: true, alias: cleanAlias }, { headers: { 'Set-Cookie': cookie } })
}
