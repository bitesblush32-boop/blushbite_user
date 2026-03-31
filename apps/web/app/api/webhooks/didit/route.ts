import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { db } from '@/db'
import { companions, companionVerifications, companionOnboardingProgress } from '@/db/schema'
import { eq } from 'drizzle-orm'

// ─── POST /api/webhooks/didit ──────────────────────────────────────────────────
// Public endpoint — no auth. Signature is verified via HMAC-SHA256.

// ─── Signature helpers ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shortenFloats(data: any): any {
  if (Array.isArray(data)) return data.map(shortenFloats)
  if (data !== null && typeof data === 'object')
    return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, shortenFloats(v)]))
  if (typeof data === 'number' && !Number.isInteger(data) && data % 1 === 0)
    return Math.trunc(data)
  return data
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sortKeys(data: any): any {
  if (Array.isArray(data)) return data.map(sortKeys)
  if (data !== null && typeof data === 'object')
    return Object.fromEntries(
      Object.entries(data)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortKeys(v)]),
    )
  return data
}

export async function POST(req: NextRequest) {
  // Read raw body BEFORE any other parsing — needed for signature verification
  const rawBody = await req.text()

  const DIDIT_WEBHOOK_SECRET = process.env.DIDIT_WEBHOOK_SECRET
  if (!DIDIT_WEBHOOK_SECRET) {
    console.error('[Didit webhook] DIDIT_WEBHOOK_SECRET not configured')
    // Return 200 so Didit doesn't keep retrying — but do nothing
    return new NextResponse('OK', { status: 200 })
  }

  // ─── Verify signature ─────────────────────────────────────────────────────
  const receivedSig = req.headers.get('x-signature-v2') ?? ''

  if (!receivedSig) {
    return new NextResponse('Invalid signature', { status: 401 })
  }

  // Parse body → shortenFloats → sortKeys → JSON.stringify (unicode preserved)
  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return new NextResponse('Bad request', { status: 400 })
  }

  const processedBody = JSON.stringify(sortKeys(shortenFloats(parsed)))

  const expectedSig = createHmac('sha256', DIDIT_WEBHOOK_SECRET)
    .update(processedBody)
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

  // ─── Parse payload ────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = parsed as Record<string, any>

  const webhook_type: string = payload?.webhook_type ?? ''
  const session_id: string   = payload?.session_id   ?? ''
  const status: string       = payload?.status        ?? ''

  // Only act on status.updated events
  if (webhook_type !== 'status.updated') {
    return new NextResponse('OK', { status: 200 })
  }

  if (!session_id) {
    // Unknown shape — acknowledge and ignore
    return new NextResponse('OK', { status: 200 })
  }

  const now = new Date()

  // ─── Approved → verify, advance to stage 4 ────────────────────────────────
  if (status === 'Approved') {
    const verification = await db.query.companionVerifications.findFirst({
      where: eq(companionVerifications.provider_reference_id, session_id),
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
        .where(eq(companionVerifications.provider_reference_id, session_id))

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

  // ─── Declined / Abandoned → mark declined, record rejection ───────────────
  else if (status === 'Declined' || status === 'Abandoned') {
    const verification = await db.query.companionVerifications.findFirst({
      where: eq(companionVerifications.provider_reference_id, session_id),
    })

    if (verification) {
      await db
        .update(companionVerifications)
        .set({
          provider_status:   'declined',
          provider_response: payload,
          updated_at:        now,
        })
        .where(eq(companionVerifications.provider_reference_id, session_id))

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

  // ─── In Review → requires_action, no stage change ─────────────────────────
  else if (status === 'In Review') {
    await db
      .update(companionVerifications)
      .set({
        provider_status:   'requires_action',
        provider_response: payload,
        updated_at:        now,
      })
      .where(eq(companionVerifications.provider_reference_id, session_id))
    // No stage advancement — companion stays at stage 3 and must retry
  }

  // Always return 200 — Didit retries on non-2xx responses
  return new NextResponse('OK', { status: 200 })
}
