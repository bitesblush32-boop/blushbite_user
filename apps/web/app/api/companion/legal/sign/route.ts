import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { companions, companionLegalDocs } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const companion = await db.query.companions.findFirst({
    where: eq(companions.email, session.user.email),
  })

  if (!companion) {
    return NextResponse.json({ error: 'Companion record not found' }, { status: 404 })
  }

  const now = new Date()
  const ip  = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? null

  const docTypes = ['tos', 'model_release', 'form_2257'] as const

  for (const document_type of docTypes) {
    await db
      .insert(companionLegalDocs)
      .values({
        companion_id:     companion.id,
        document_type,
        signed_at:        now,
        ip_address:       ip,
        document_version: '1.0',
      })
      .onConflictDoUpdate({
        target: [companionLegalDocs.companion_id, companionLegalDocs.document_type],
        set: { signed_at: now, ip_address: ip },
      })
  }

  return NextResponse.json({ success: true })
}
