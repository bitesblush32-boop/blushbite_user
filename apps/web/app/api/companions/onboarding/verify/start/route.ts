import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { companions, companionVerifications } from '@/db/schema'
import { eq } from 'drizzle-orm'

// ─── POST /api/companions/onboarding/verify/start ─────────────────────────────

export async function POST(_req: NextRequest) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Look up companion by email (same pattern as identity route)
  const companion = await db.query.companions.findFirst({
    where: eq(companions.email, session.user.email),
  })

  if (!companion) {
    return NextResponse.json({ error: 'This path is for companions only.' }, { status: 403 })
  }

  const DIDIT_API_KEY     = process.env.DIDIT_API_KEY
  const DIDIT_WORKFLOW_ID = process.env.DIDIT_WORKFLOW_ID

  if (!DIDIT_API_KEY || !DIDIT_WORKFLOW_ID) {
    return NextResponse.json(
      { error: 'Verification service is not yet configured. Try again soon.' },
      { status: 503 },
    )
  }

  // ─── Call Didit API to create session ─────────────────────────────────────
  let diditRes: Response
  try {
    diditRes = await fetch('https://verification.didit.me/v3/session/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key':    DIDIT_API_KEY,
      },
      body: JSON.stringify({
        workflow_id: DIDIT_WORKFLOW_ID,
        vendor_data: companion.id,
        // Use AUTH_URL (NextAuth v5) or NEXTAUTH_URL as the public base URL.
        // Never derive from _req.url — behind Railway's proxy that gives
        // http://localhost:8080, not the real public domain.
        callback: (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '')
          + '/companion/onboarding/verify',
      }),
    })
  } catch {
    return NextResponse.json(
      { error: 'Could not reach the verification service. Check your connection and try again.' },
      { status: 502 },
    )
  }

  if (!diditRes.ok) {
    const errText = await diditRes.text().catch(() => '')
    console.error('[Didit] create session failed:', diditRes.status, errText)
    return NextResponse.json(
      { error: 'The verification service returned an unexpected error. Try again in a moment.' },
      { status: 502 },
    )
  }

  const diditData                            = await diditRes.json()
  const session_id: string | undefined       = diditData?.session_id
  const session_token: string | undefined    = diditData?.session_token
  const verification_url: string | undefined = diditData?.url ?? diditData?.verification_url

  if (!session_id || !verification_url) {
    console.error('[Didit] missing session_id or url in response:', JSON.stringify(diditData))
    return NextResponse.json(
      { error: 'Verification service returned an unexpected response.' },
      { status: 502 },
    )
  }

  const now = new Date()

  // ─── Upsert companion_verifications ───────────────────────────────────────
  await db
    .insert(companionVerifications)
    .values({
      companion_id:          companion.id,
      provider:              'didit',
      provider_reference_id: session_id,
      provider_status:       'created',
      updated_at:            now,
    })
    .onConflictDoUpdate({
      target: [companionVerifications.companion_id],
      set: {
        provider:              'didit',
        provider_reference_id: session_id,
        provider_status:       'created',
        updated_at:            now,
      },
    })

  return NextResponse.json({
    session_id,
    session_token,
    verification_url,
  })
}
