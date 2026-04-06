import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { companions, companionLegalDocs, companionOnboardingProgress } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
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

  // Resolve client IP
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : null

  const now = new Date()
  const DOC_TYPES = ['tos', 'model_release', 'form_2257'] as const

  // Insert / upsert all 3 legal doc rows
  for (const docType of DOC_TYPES) {
    await db.insert(companionLegalDocs).values({
      companion_id:     companion.id,
      document_type:    docType,
      signed_at:        now,
      ip_address:       ip,
      document_version: '1.0',
    }).onConflictDoUpdate({
      target: [companionLegalDocs.companion_id, companionLegalDocs.document_type],
      set: {
        signed_at:        now,
        ip_address:       ip,
        document_version: '1.0',
      },
    })
  }

  // Advance companion stage
  await db.update(companions)
    .set({ companion_stage: 3, updated_at: now })
    .where(eq(companions.id, companion.id))

  // Record progress
  await db.insert(companionOnboardingProgress).values({
    companion_id: companion.id,
    stage:        3,
    status:       'completed',
    completed_at: now,
  }).onConflictDoUpdate({
    target: [companionOnboardingProgress.companion_id, companionOnboardingProgress.stage],
    set:    { status: 'completed', completed_at: now },
  })

  return NextResponse.json({ success: true })
}
