import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { z } from 'zod'
import { db } from '@/db'
import { companions, companionOnboardingProgress } from '@/db/schema'
import { eq } from 'drizzle-orm'

// ─── Validation ──────────────────────────────────────────────────────────────

function isAtLeast18(dob: string): boolean {
  const date = new Date(dob)
  if (isNaN(date.getTime())) return false
  const today = new Date()
  const age18 = new Date(date.getFullYear() + 18, date.getMonth(), date.getDate())
  return today >= age18
}

const schema = z.object({
  fullName:    z.string().min(2, 'We need your legal name to proceed.').max(100, 'That name is a little long.').trim(),
  dateOfBirth: z.string()
    .refine(v => !isNaN(new Date(v).getTime()), 'Enter a valid date.')
    .refine(isAtLeast18, 'You must be 18 or older to continue.'),
  country:     z.string().min(1, 'Please select your country of residence.'),
})

// ─── POST /api/companion/profile/basic ───────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Look up companion by email
  const companion = await db.query.companions.findFirst({
    where: eq(companions.email, session.user.email),
  })

  if (!companion) {
    return NextResponse.json(
      { error: 'This path is for companions only.' },
      { status: 403 },
    )
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'Something slipped — try sending again.' }, { status: 400 })
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    const firstError = result.error.errors[0]?.message ?? 'Something went wrong. Try again in a moment.'
    return NextResponse.json({ error: firstError }, { status: 400 })
  }

  const { fullName, dateOfBirth, country } = result.data
  const now = new Date()

  await db.update(companions)
    .set({
      full_name:       fullName,
      date_of_birth:   dateOfBirth,
      country,
      companion_stage: 3,
      updated_at:      now,
    })
    .where(eq(companions.id, companion.id))

  await db.insert(companionOnboardingProgress)
    .values({
      companion_id: companion.id,
      stage:        2,
      status:       'completed',
      completed_at: now,
    })
    .onConflictDoUpdate({
      target: [companionOnboardingProgress.companion_id, companionOnboardingProgress.stage],
      set: { status: 'completed', completed_at: now },
    })

  return NextResponse.json({ success: true })
}
