import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { db } from '@/db'
import {
  companions,
  companionVerifications,
  companionOnboardingProgress,
  diditExtractedData,
} from '@/db/schema'
import { eq } from 'drizzle-orm'

// ─── POST /api/webhooks/didit ──────────────────────────────────────────────────
// Public endpoint — no auth. Signature is verified via HMAC-SHA256.

export async function POST(req: NextRequest) {
  // Read raw body BEFORE any other parsing — needed for signature verification
  const rawBody = await req.text()

  const DIDIT_WEBHOOK_SECRET = process.env.DIDIT_WEBHOOK_SECRET
  if (!DIDIT_WEBHOOK_SECRET) {
    console.error('[Didit webhook] DIDIT_WEBHOOK_SECRET not configured')
    // Return 200 so Didit doesn't keep retrying — but do nothing
    return new NextResponse('OK', { status: 200 })
  }

  // ─── Replay attack protection ─────────────────────────────────────────────
  const timestamp = req.headers.get('x-timestamp')
  if (timestamp) {
    const ts = parseInt(timestamp, 10)
    const nowSecs = Math.floor(Date.now() / 1000)
    if (isNaN(ts) || Math.abs(nowSecs - ts) > 300) {
      return new NextResponse('Request expired', { status: 401 })
    }
  }

  // ─── Verify signature ─────────────────────────────────────────────────────
  // Didit signs the raw request body with HMAC-SHA256, sending the hex digest
  // in x-signature-v2. We must hash the raw bytes — no JSON processing.
  const receivedSig = req.headers.get('x-signature-v2') ?? ''

  if (!receivedSig) {
    return new NextResponse('Invalid signature', { status: 401 })
  }

  const expectedSig = createHmac('sha256', DIDIT_WEBHOOK_SECRET).update(rawBody).digest('hex')

  let sigValid: boolean
  try {
    sigValid = timingSafeEqual(Buffer.from(expectedSig), Buffer.from(receivedSig))
  } catch {
    sigValid = false
  }

  if (!sigValid) {
    return new NextResponse('Invalid signature', { status: 401 })
  }

  // ─── Parse payload ────────────────────────────────────────────────────────
  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return new NextResponse('Bad request', { status: 400 })
  }

  const payload = parsed as Record<string, any>

  const webhook_type: string = payload?.webhook_type ?? ''
  const session_id: string = payload?.session_id ?? ''
  const status: string = payload?.status ?? ''

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
          provider_status: 'approved',
          verified_at: now,
          provider_response: payload,
          updated_at: now,
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
          stage: 3,
          status: 'completed',
          completed_at: now,
        })
        .onConflictDoUpdate({
          target: [companionOnboardingProgress.companion_id, companionOnboardingProgress.stage],
          set: { status: 'completed', completed_at: now },
        })

      // Store Didit extracted ID data for admin cross-verification
      const idData = (payload?.decision as any)?.id_verification
      const livenessData = (payload?.decision as any)?.liveness
      const faceMatchData = (payload?.decision as any)?.face_match

      await db
        .insert(diditExtractedData)
        .values({
          companion_id: verification.companion_id,
          session_id: session_id,
          extracted_first_name: idData?.first_name ?? null,
          extracted_last_name: idData?.last_name ?? null,
          extracted_dob: idData?.date_of_birth ?? null,
          document_type: idData?.document_type ?? null,
          document_number: idData?.document_number ?? null,
          issuing_state: idData?.issuing_state ?? null,
          liveness_score: livenessData?.score?.toString() ?? null,
          face_match_score: faceMatchData?.score?.toString() ?? null,
          overall_status: payload?.status ?? null,
          raw_payload: payload,
        })
        .onConflictDoUpdate({
          target: diditExtractedData.session_id,
          set: { overall_status: payload?.status, raw_payload: payload },
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
          provider_status: 'declined',
          provider_response: payload,
          updated_at: now,
        })
        .where(eq(companionVerifications.provider_reference_id, session_id))

      await db
        .insert(companionOnboardingProgress)
        .values({
          companion_id: verification.companion_id,
          stage: 3,
          status: 'rejected',
          completed_at: now,
        })
        .onConflictDoUpdate({
          target: [companionOnboardingProgress.companion_id, companionOnboardingProgress.stage],
          set: { status: 'rejected', completed_at: now },
        })
    }
  }

  // ─── In Review → requires_action, no stage change ─────────────────────────
  else if (status === 'In Review') {
    await db
      .update(companionVerifications)
      .set({
        provider_status: 'requires_action',
        provider_response: payload,
        updated_at: now,
      })
      .where(eq(companionVerifications.provider_reference_id, session_id))
    // No stage advancement — companion stays at stage 3 and must retry
  }

  // Always return 200 — Didit retries on non-2xx responses
  return new NextResponse('OK', { status: 200 })
}
