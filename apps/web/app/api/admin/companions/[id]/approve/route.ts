import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { companionProfiles, companionOnboardingProgress } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  const user = session?.user as any
  if (!session || user?.platform_role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = params
  const now = new Date()

  // 1. Set is_live + verified
  await db.update(companionProfiles)
    .set({ is_live: true, approved_at: now, is_verified: true, verified_at: now })
    .where(eq(companionProfiles.companion_id, id))

  // 2. Upsert onboarding stage 7 = completed
  await db.insert(companionOnboardingProgress).values({
    companion_id: id,
    stage:        7,
    status:       'completed',
    completed_at: now,
    notes:        null,
  }).onConflictDoUpdate({
    target: [companionOnboardingProgress.companion_id, companionOnboardingProgress.stage],
    set:    { status: 'completed', completed_at: now, notes: null },
  })

  // TODO Phase 2: Send approval email via Resend

  return NextResponse.json({ success: true })
}
