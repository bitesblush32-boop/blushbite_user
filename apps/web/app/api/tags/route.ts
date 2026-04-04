import { NextResponse } from 'next/server'
import { db } from '@/db'
import { moodTags, orientationTags, fantasyCategories, storyCategories } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'

export const revalidate = 3600

export async function GET() {
  try {
    const [moods, orientations, fantasyCats, storyCats] = await Promise.all([
      db
        .select({ id: moodTags.id, name: moodTags.name, slug: moodTags.slug, emoji: moodTags.emoji })
        .from(moodTags)
        .where(eq(moodTags.is_active, true)),

      db
        .select({ id: orientationTags.id, name: orientationTags.name, slug: orientationTags.slug })
        .from(orientationTags)
        .where(eq(orientationTags.is_active, true)),

      db
        .select({ id: fantasyCategories.id, name: fantasyCategories.name, slug: fantasyCategories.slug, description: fantasyCategories.description })
        .from(fantasyCategories)
        .where(eq(fantasyCategories.is_active, true))
        .orderBy(asc(fantasyCategories.sort_order)),

      db
        .select({ id: storyCategories.id, name: storyCategories.name, slug: storyCategories.slug, description: storyCategories.description })
        .from(storyCategories)
        .where(eq(storyCategories.is_active, true))
        .orderBy(asc(storyCategories.sort_order)),
    ])

    return NextResponse.json(
      { moodTags: moods, orientationTags: orientations, fantasyCategories: fantasyCats, storyCategories: storyCats },
      { headers: { 'Cache-Control': 'public, max-age=3600' } }
    )
  } catch (err) {
    console.error('[GET /api/tags]', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 })
  }
}
