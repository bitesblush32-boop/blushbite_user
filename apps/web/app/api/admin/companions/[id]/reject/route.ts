import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import { companionOnboardingProgress } from '@/db/schema'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const { reason } = await req.json()
  const now = new Date()

  await db.insert(companionOnboardingProgress).values({
    companion_id: params.id,
    stage:        7,
    status:       'rejected',
    completed_at: now,
    notes:        reason ?? null,
  }).onConflictDoUpdate({
    target: [companionOnboardingProgress.companion_id, companionOnboardingProgress.stage],
    set:    { status: 'rejected', completed_at: now, notes: reason ?? null },
  })

  // TODO Phase 2: Send rejection email with reason via Resend

  return NextResponse.json({ success: true })
}
