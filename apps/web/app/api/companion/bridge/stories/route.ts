import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import {
  companions, companionProfiles, companionStoryBridges,
  stories, storyCategories, storyMoodTags, moodTags,
} from '@/db/schema'
import { eq, and, isNull, notInArray, sql } from 'drizzle-orm'

// ── GET /api/companion/bridge/stories ─────────────────────────────────────────
// Returns published stories the companion has NOT yet linked to.

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search   = searchParams.get('search')?.trim() ?? ''
  const category = searchParams.get('category')?.trim() ?? ''
  const page     = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10))

  // Resolve companion + profile
  const companionRow = await db
    .select({ id: companions.id })
    .from(companions)
    .where(eq(companions.email, session.user.email))
    .limit(1)

  if (!companionRow.length) return NextResponse.json({ error: 'Not a companion' }, { status: 403 })

  const profileRow = await db
    .select({ id: companionProfiles.id })
    .from(companionProfiles)
    .where(eq(companionProfiles.companion_id, companionRow[0].id))
    .limit(1)

  // Find already-linked story IDs
  const linkedIds = profileRow.length
    ? (await db
        .select({ story_id: companionStoryBridges.story_id })
        .from(companionStoryBridges)
        .where(eq(companionStoryBridges.companion_profile_id, profileRow[0].id)))
        .map(r => r.story_id)
    : []

  // Build WHERE conditions
  const conditions = [
    eq(stories.is_published, true),
    eq(stories.moderation_status, 'approved'),
    isNull(stories.deleted_at),
  ]

  if (linkedIds.length) {
    conditions.push(notInArray(stories.id, linkedIds))
  }

  if (search) {
    conditions.push(
      sql`(${stories.title} ILIKE ${'%' + search + '%'} OR ${stories.excerpt} ILIKE ${'%' + search + '%'})`,
    )
  }

  if (category) {
    conditions.push(
      sql`${stories.category_id} IN (
        SELECT id FROM story_categories WHERE name ILIKE ${'%' + category + '%'}
      )`,
    )
  }

  const rows = await db
    .select({
      id:            stories.id,
      title:         stories.title,
      excerpt:       stories.excerpt,
      author_type:   stories.author_type,
      like_count:    stories.like_count,
      view_count:    stories.view_count,
      category_name: storyCategories.name,
      created_at:    stories.created_at,
    })
    .from(stories)
    .leftJoin(storyCategories, eq(storyCategories.id, stories.category_id))
    .where(and(...conditions))
    .orderBy(sql`${stories.created_at} DESC`)
    .limit(20)
    .offset(page * 20)

  // Attach mood tags for each story
  const storyIds = rows.map(r => r.id)
  const moodRows = storyIds.length
    ? await db
        .select({
          story_id:  storyMoodTags.story_id,
          mood_name: moodTags.name,
        })
        .from(storyMoodTags)
        .innerJoin(moodTags, eq(moodTags.id, storyMoodTags.mood_tag_id))
        .where(sql`${storyMoodTags.story_id} = ANY(ARRAY[${sql.join(storyIds.map(id => sql`${id}::uuid`), sql`, `)}])`)
    : []

  const moodMap: Record<string, string[]> = {}
  for (const m of moodRows) {
    if (!moodMap[m.story_id]) moodMap[m.story_id] = []
    moodMap[m.story_id].push(m.mood_name)
  }

  const data = rows.map(r => ({
    ...r,
    mood_tags:    moodMap[r.id] ?? [],
    already_linked: false,
  }))

  return NextResponse.json({ data })
}
