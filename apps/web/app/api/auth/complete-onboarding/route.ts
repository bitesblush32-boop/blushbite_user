import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

const schema = z.object({
  vibes:          z.array(z.string()).max(10),
  gender:         z.string().optional(),
  desiredGenders: z.array(z.string()).optional(),
  role:           z.enum(['dream', 'dreamer']),
})

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 },
    )
  }

  const { vibes, gender, desiredGenders, role } = result.data

  await db.update(users)
    .set({
      vibes:              JSON.stringify(vibes),
      gender:             gender ?? null,
      desired_genders:    desiredGenders ? JSON.stringify(desiredGenders) : null,
      platform_role:      role,
      onboarding_complete: true,
    })
    .where(eq(users.id, session.user.id))

  // Set cookie so middleware knows onboarding is done without waiting for JWT refresh
  // (JWT onboarding_complete stays false until the user re-authenticates in Phase 2)
  // Store the user's ID so middleware can match it against the current session.
  // If the DB is wiped and a new account is created, the new user ID won't match
  // this cookie — onboarding triggers again for the new account.
  const response = NextResponse.json({ success: true, platform_role: role })
  response.cookies.set('bb_onboarded', session.user.id, {
    path:     '/',
    sameSite: 'lax',
    httpOnly: true,
    maxAge:   60 * 60 * 24 * 365, // 1 year
  })
  return response
}
