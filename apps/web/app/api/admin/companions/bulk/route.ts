import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import { sql } from 'drizzle-orm'

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const body = await req.json().catch(() => ({}))
  const { ids } = body as { ids?: string[] }

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids must be a non-empty array' }, { status: 400 })
  }
  if (ids.length > 100) {
    return NextResponse.json({ error: 'Cannot delete more than 100 at once' }, { status: 400 })
  }

  // Fetch profile IDs for all companions first
  const profileRows = await db.execute(sql`
    SELECT id FROM companion_profiles WHERE companion_id = ANY(${ids}::uuid[])
  `)
  const profileIds = (profileRows as any[]).map((r: any) => r.id)

  // Delete non-cascade tables in dependency order
  if (profileIds.length > 0) {
    await db.execute(sql`
      DELETE FROM booking_requests WHERE companion_profile_id = ANY(${profileIds}::uuid[])
    `)
    await db.execute(sql`
      DELETE FROM fantasy_tag_overlap_scores WHERE companion_profile_id = ANY(${profileIds}::uuid[])
    `)
  }

  await db.execute(sql`
    DELETE FROM notifications
    WHERE recipient_type = 'companion' AND recipient_id = ANY(${ids}::uuid[])
  `)
  await db.execute(sql`
    DELETE FROM companion_verifications WHERE companion_id = ANY(${ids}::uuid[])
  `)
  await db.execute(sql`
    DELETE FROM companion_legal_docs WHERE companion_id = ANY(${ids}::uuid[])
  `)
  await db.execute(sql`
    DELETE FROM companion_payment_setup WHERE companion_id = ANY(${ids}::uuid[])
  `)

  // Disassociate authored content (preserve the content, remove author link)
  await db.execute(sql`
    UPDATE stories
    SET author_companion_id = NULL, author_type = 'admin'
    WHERE author_companion_id = ANY(${ids}::uuid[])
  `)
  await db.execute(sql`
    UPDATE audio_recordings
    SET author_companion_id = NULL, companion_profile_id = NULL, author_type = 'user'
    WHERE author_companion_id = ANY(${ids}::uuid[])
  `)

  // Remove device fingerprint bindings
  await db.execute(sql`
    DELETE FROM device_community_bindings WHERE companion_id = ANY(${ids}::uuid[])
  `)

  // Delete companions — CASCADE removes profiles, photos, videos, tags, session_cards, etc.
  const result = await db.execute(sql`
    DELETE FROM companions WHERE id = ANY(${ids}::uuid[])
    RETURNING id
  `)

  return NextResponse.json({ ok: true, deleted: (result as any[]).length })
}
