import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { db } from '@/db'
import { companions, companionVerifications, companionOnboardingProgress } from '@/db/schema'
import { eq } from 'drizzle-orm'

// ─── POST /api/webhooks/persona ───────────────────────────────────────────────
// Public endpoint — no auth. Signature is verified via HMAC-SHA256.

export async function POST(req: NextRequest) {
  // Read raw body BEFORE any other parsing — needed for signature verification
  const rawBody = await req.text()

  const PERSONA_WEBHOOK_SECRET = process.env.PERSONA_WEBHOOK_SECRET
  if (!PERSONA_WEBHOOK_SECRET) {
    console.error('[Persona webhook] PERSONA_WEBHOOK_SECRET not configured')
    // Return 200 so Persona doesn't keep retrying — but do nothing
    return new NextResponse('OK', { status: 200 })
  }

  // ─── Verify signature ─────────────────────────────────────────────────────
  // Header format: t=<unix_timestamp>,v1=<hex_hmac>
  const sigHeader = req.headers.get('persona-signature') ?? ''
  const parts = Object.fromEntries(
    sigHeader.split(',').map(part => {
      const idx = part.indexOf('=')
      return [part.slice(0, idx), part.slice(idx + 1)]
    }),
  )
  const timestamp    = parts['t'] ?? ''
  const receivedSig  = parts['v1'] ?? ''

  if (!timestamp || !receivedSig) {
    return new NextResponse('Invalid signature', { status: 401 })
  }

  // Signed string: "<timestamp>.<rawBody>"
  const expectedSig = createHmac('sha256', PERSONA_WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  let sigValid: boolean
  try {
    sigValid = timingSafeEqual(
      Buffer.from(expectedSig),
      Buffer.from(receivedSig),
    )
  } catch {
    sigValid = false
  }

  if (!sigValid) {
    return new NextResponse('Invalid signature', { status: 401 })
  }

  // ─── Parse body ───────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payload: Record<string, any>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new NextResponse('Bad request', { status: 400 })
  }

  // Extract event name — Persona may nest it differently by API version
  const eventName: string =
    payload?.data?.type ??
    payload?.event?.name ??
    ''

  // Extract inquiry ID
  const inquiryId: string =
    payload?.data?.id ??
    payload?.data?.attributes?.['inquiry-id'] ??
    ''

  if (!inquiryId) {
    // Unknown event shape — acknowledge and ignore
    return new NextResponse('OK', { status: 200 })
  }

  const now = new Date()

  // ─── inquiry.completed / inquiry.approved → mark approved ─────────────────
  if (eventName === 'inquiry.completed' || eventName === 'inquiry.approved') {
    const verification = await db.query.companionVerifications.findFirst({
      where: eq(companionVerifications.provider_reference_id, inquiryId),
    })

    if (verification) {
      await db
        .update(companionVerifications)
        .set({
          provider_status:   'approved',
          verified_at:       now,
          provider_response: payload,
          updated_at:        now,
        })
        .where(eq(companionVerifications.provider_reference_id, inquiryId))

      // Advance companion to stage 4
      await db
        .update(companions)
        .set({ companion_stage: 4, updated_at: now })
        .where(eq(companions.id, verification.companion_id))

      // Record stage 3 as completed in progress table
      await db
        .insert(companionOnboardingProgress)
        .values({
          companion_id: verification.companion_id,
          stage:        3,
          status:       'completed',
          completed_at: now,
        })
        .onConflictDoUpdate({
          target: [
            companionOnboardingProgress.companion_id,
            companionOnboardingProgress.stage,
          ],
          set: { status: 'completed', completed_at: now },
        })
    }
  }

  // ─── inquiry.failed / inquiry.declined → mark declined ────────────────────
  else if (eventName === 'inquiry.failed' || eventName === 'inquiry.declined') {
    const verification = await db.query.companionVerifications.findFirst({
      where: eq(companionVerifications.provider_reference_id, inquiryId),
    })

    if (verification) {
      await db
        .update(companionVerifications)
        .set({
          provider_status:   'declined',
          provider_response: payload,
          updated_at:        now,
        })
        .where(eq(companionVerifications.provider_reference_id, inquiryId))

      await db
        .insert(companionOnboardingProgress)
        .values({
          companion_id: verification.companion_id,
          stage:        3,
          status:       'rejected',
          completed_at: now,
        })
        .onConflictDoUpdate({
          target: [
            companionOnboardingProgress.companion_id,
            companionOnboardingProgress.stage,
          ],
          set: { status: 'rejected', completed_at: now },
        })
    }
  }

  // Always return 200 — Persona retries on non-2xx responses
  return new NextResponse('OK', { status: 200 })
}
