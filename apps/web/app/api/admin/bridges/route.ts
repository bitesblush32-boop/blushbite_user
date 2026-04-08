import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { companionStoryBridges, companionProfiles, companions, stories } from '@/db/schema'
import { eq, desc, isNull, and, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await auth()
  const user = session?.user as any
  if (!session || user?.platform_role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const filter = searchParams.get('filter') ?? 'all'
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit  = 20
  const offset = (page - 1) * limit

  const statusFilter = filter !== 'all'
    ? eq(companionStoryBridges.status, filter)
    : undefined

  const whereClause = statusFilter
    ? and(isNull((companionStoryBridges as any).deleted_at), statusFilter)
    : isNull((companionStoryBridges as any).deleted_at)

  const rows = await db
    .select({
      id:               companionStoryBridges.id,
      status:           companionStoryBridges.status,
      admin_note:       companionStoryBridges.admin_note,
      approved_at:      companionStoryBridges.approved_at,
      created_at:       companionStoryBridges.created_at,
      profile_id:       companionProfiles.id,
      companion_alias:  companions.alias,
      companion_name:   companions.name,
      story_id:         stories.id,
      story_title:      stories.title,
      story_excerpt:    stories.excerpt,
      story_author_type: stories.author_type,
    })
    .from(companionStoryBridges)
    .innerJoin(companionProfiles, eq(companionStoryBridges.companion_profile_id, companionProfiles.id))
    .innerJoin(companions, eq(companionProfiles.companion_id, companions.id))
    .innerJoin(stories, eq(companionStoryBridges.story_id, stories.id))
    .where(statusFilter ?? undefined)
    .orderBy(desc(companionStoryBridges.created_at))
    .limit(limit)
    .offset(offset)

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(companionStoryBridges)
    .where(statusFilter ?? undefined)

  return NextResponse.json({
    bridges: rows,
    total,
    page,
    pages: Math.ceil(total / limit),
  })
}
