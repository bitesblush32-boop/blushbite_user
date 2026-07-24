import { NextRequest, NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/otpStore'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { buildSessionCookie } from '@/lib/dreamerSession'

export async function POST(req: NextRequest) {
  let email: string, otp: string
  try {
    const body = await req.json()
    email = (body.email ?? '').toLowerCase().trim()
    otp = String(body.otp ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (!email || !otp) {
    return NextResponse.json({ error: 'Email and code are required.' }, { status: 400 })
  }

  const result = verifyOtp(email, otp)
  if (!result.ok) {
    return NextResponse.json({ verified: false, error: result.error }, { status: 400 })
  }

  // Check if user exists
  const [existing] = await db
    .select({ id: users.id, email: users.email, alias: users.alias })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existing) {
    // Returning user — set session immediately
    const cookie = await buildSessionCookie({
      sub: existing.id,
      email: existing.email,
      alias: existing.alias ?? null,
    })
    return NextResponse.json(
      { verified: true, isNew: false, alias: existing.alias ?? null },
      { headers: { 'Set-Cookie': cookie } }
    )
  }

  // New user — create the record, then ask frontend for username + phone
  const [created] = await db
    .insert(users)
    .values({
      email,
      email_verified: new Date(),
      onboarding_complete: false,
    })
    .returning({ id: users.id, email: users.email, alias: users.alias })

  const cookie = await buildSessionCookie({
    sub: created.id,
    email: created.email,
    alias: null,
  })

  return NextResponse.json(
    { verified: true, isNew: true, alias: null },
    { headers: { 'Set-Cookie': cookie } }
  )
}
