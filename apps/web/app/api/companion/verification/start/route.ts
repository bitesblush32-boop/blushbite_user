import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { companions, companionVerifications } from '@/db/schema'
import { eq } from 'drizzle-orm'

// ─── POST /api/companion/verification/start ───────────────────────────────────

export async function POST(_req: NextRequest) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Look up companion by email (same pattern as profile/basic route)
  const companion = await db.query.companions.findFirst({
    where: eq(companions.email, session.user.email),
  })

  if (!companion) {
    return NextResponse.json({ error: 'This path is for companions only.' }, { status: 403 })
  }

  const PERSONA_API_KEY     = process.env.PERSONA_API_KEY
  const PERSONA_TEMPLATE_ID = process.env.PERSONA_TEMPLATE_ID

  if (!PERSONA_API_KEY || !PERSONA_TEMPLATE_ID) {
    return NextResponse.json(
      { error: 'Verification service is not yet configured. Try again soon.' },
      { status: 503 },
    )
  }

  // ─── Call Persona API to create inquiry ───────────────────────────────────
  let personaRes: Response
  try {
    personaRes = await fetch('https://api.withpersona.com/api/v1/inquiries', {
      method: 'POST',
      headers: {
        'Authorization':  `Bearer ${PERSONA_API_KEY}`,
        'Persona-Version': '2023-01-05',
        'Content-Type':    'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            'inquiry-template-id': PERSONA_TEMPLATE_ID,
            'reference-id':        companion.id,
          },
        },
      }),
    })
  } catch {
    return NextResponse.json(
      { error: 'Could not reach the verification service. Check your connection and try again.' },
      { status: 502 },
    )
  }

  if (!personaRes.ok) {
    const errText = await personaRes.text().catch(() => '')
    console.error('[Persona] create inquiry failed:', personaRes.status, errText)
    return NextResponse.json(
      { error: 'The verification service returned an unexpected error. Try again in a moment.' },
      { status: 502 },
    )
  }

  const personaData = await personaRes.json()
  const inquiryId   = personaData?.data?.id as string | undefined
  const sessionToken: string | null =
    personaData?.data?.attributes?.['session-token'] ?? null

  if (!inquiryId) {
    console.error('[Persona] missing inquiry id in response:', JSON.stringify(personaData))
    return NextResponse.json(
      { error: 'Verification service returned an unexpected response.' },
      { status: 502 },
    )
  }

  const now = new Date()

  // ─── Upsert companion_verifications ───────────────────────────────────────
  // UNIQUE constraint is on companion_id — use ON CONFLICT DO UPDATE
  await db
    .insert(companionVerifications)
    .values({
      companion_id:          companion.id,
      provider:              'persona',
      provider_reference_id: inquiryId,
      provider_status:       'created',
      updated_at:            now,
    })
    .onConflictDoUpdate({
      target: [companionVerifications.companion_id],
      set: {
        provider:              'persona',
        provider_reference_id: inquiryId,
        provider_status:       'created',
        updated_at:            now,
      },
    })

  return NextResponse.json({ inquiryId, sessionToken })
}
