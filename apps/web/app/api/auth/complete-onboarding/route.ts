import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { db } from '@/db'
import { users, userProfiles, companions } from '@/db/schema'
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

  // Upsert user_profiles — vibes/gender/desired_genders live here in new schema
  await db.insert(userProfiles)
    .values({
      user_id:         session.user.id,
      vibes:           vibes,
      gender:          gender          ?? null,
      desired_genders: desiredGenders  ?? null,
    })
    .onConflictDoUpdate({
      target: userProfiles.user_id,
      set: {
        vibes:           vibes,
        gender:          gender         ?? null,
        desired_genders: desiredGenders ?? null,
        updated_at:      new Date(),
      },
    })

  // Mark onboarding complete on users table
  await db.update(users)
    .set({ onboarding_complete: true })
    .where(eq(users.id, session.user.id))

  // If selecting companion role, seed a companions row so companion-verify can find them
  if (role === 'dream' && session.user.email) {
    await db.insert(companions)
      .values({ email: session.user.email })
      .onConflictDoNothing()
  }

  // platform_role drives routing only — not stored (dreamers = users, companions = companions)
  const response = NextResponse.json({ success: true, platform_role: role })
  response.cookies.set('bb_onboarded', session.user.id, {
    path:     '/',
    sameSite: 'lax',
    httpOnly: true,
    maxAge:   60 * 60 * 24 * 365,
  })
  return response
}
