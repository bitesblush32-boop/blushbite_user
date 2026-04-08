import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { companions, companionProfiles, companionOnboardingProgress } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const companion = await db.query.companions.findFirst({
    where: eq(companions.email, session.user.email),
  })
  if (!companion) {
    return NextResponse.json({ error: 'Not a companion' }, { status: 403 })
  }

  const [profile, progress] = await Promise.all([
    db.query.companionProfiles.findFirst({
      where: eq(companionProfiles.companion_id, companion.id),
    }),
    db.query.companionOnboardingProgress.findFirst({
      where: and(
        eq(companionOnboardingProgress.companion_id, companion.id),
        eq(companionOnboardingProgress.stage, 3),
      ),
    }),
  ])

  return NextResponse.json({
    companion_stage: companion.companion_stage,
    is_live:         profile?.is_live ?? false,
    submitted_at:    progress?.completed_at?.toISOString() ?? null,
    email:           companion.email,
  })
}
