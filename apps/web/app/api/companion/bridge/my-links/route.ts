import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { companions, companionProfiles, companionStoryBridges, stories, storyCategories } from '@/db/schema'
import { eq } from 'drizzle-orm'

// ── GET /api/companion/bridge/my-links ────────────────────────────────────────

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  if (!profileRow.length) return NextResponse.json({ data: [] })

  const rows = await db
    .select({
      bridge_id:     companionStoryBridges.id,
      story_id:      companionStoryBridges.story_id,
      status:        companionStoryBridges.status,
      admin_note:    companionStoryBridges.admin_note,
      approved_at:   companionStoryBridges.approved_at,
      created_at:    companionStoryBridges.created_at,
      story_title:   stories.title,
      story_excerpt: stories.excerpt,
      category_name: storyCategories.name,
    })
    .from(companionStoryBridges)
    .innerJoin(stories, eq(stories.id, companionStoryBridges.story_id))
    .leftJoin(storyCategories, eq(storyCategories.id, stories.category_id))
    .where(eq(companionStoryBridges.companion_profile_id, profileRow[0].id))
    .orderBy(companionStoryBridges.created_at)

  return NextResponse.json({ data: rows })
}
