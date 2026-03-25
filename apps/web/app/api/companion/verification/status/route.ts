import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { companions, companionVerifications } from '@/db/schema'
import { eq } from 'drizzle-orm'

// ─── GET /api/companion/verification/status ───────────────────────────────────

export async function GET(_req: NextRequest) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const companion = await db.query.companions.findFirst({
    where: eq(companions.email, session.user.email),
  })

  if (!companion) {
    return NextResponse.json({ error: 'This path is for companions only.' }, { status: 403 })
  }

  const verification = await db.query.companionVerifications.findFirst({
    where: eq(companionVerifications.companion_id, companion.id),
  })

  if (!verification) {
    return NextResponse.json({ status: 'idle', verifiedAt: null, providerStatus: null })
  }

  const ps = verification.provider_status

  // Map provider_status → UI state
  let uiStatus: 'idle' | 'pending' | 'approved' | 'declined'
  if (!ps) {
    uiStatus = 'idle'
  } else if (ps === 'created' || ps === 'pending') {
    uiStatus = 'pending'
  } else if (ps === 'approved' || ps === 'completed') {
    uiStatus = 'approved'
  } else if (ps === 'failed' || ps === 'declined') {
    uiStatus = 'declined'
  } else {
    uiStatus = 'pending'
  }

  return NextResponse.json({
    status:         uiStatus,
    verifiedAt:     verification.verified_at?.toISOString() ?? null,
    providerStatus: ps,
  })
}
