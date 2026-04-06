import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { companions, companionLegalDocs } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companion = await db.query.companions.findFirst({
    where: eq(companions.email, session.user.email),
  })
  if (!companion) return NextResponse.json({ error: 'Not a companion' }, { status: 403 })

  const legalDocs = await db.select({
    document_type: companionLegalDocs.document_type,
    signed_at:     companionLegalDocs.signed_at,
  })
    .from(companionLegalDocs)
    .where(eq(companionLegalDocs.companion_id, companion.id))

  return NextResponse.json({
    email:        companion.email,
    alias:        companion.alias ?? '',
    has_password: !!companion.hashed_password,
    legal_docs:   legalDocs.map(d => ({
      document_type: d.document_type,
      signed_at:     d.signed_at.toISOString(),
    })),
  })
}
