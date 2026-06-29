import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import {
  stories,
  storyMoodTags,
  storyOrientationTags,
  storyFantasyTags,
  storyCategories,
  moodTags,
  orientationTags,
  fantasyTags,
} from '@/db/schema'

interface ImportItem {
  title?: string
  body?: string
  raw_text?: string
  categories?: string[]
  mood_tags?: string[]
  orientation_tags?: string[]
  fantasy_tags?: string[]
  source_url?: string
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const body = await req.json()
  const items: ImportItem[] = Array.isArray(body) ? body : []

  if (!items.length) return NextResponse.json({ error: 'Empty batch' }, { status: 400 })
  if (items.length > 200) return NextResponse.json({ error: 'Max 200 per batch' }, { status: 400 })

  // Fetch all lookup maps in parallel
  const [cats, moods, orientations, fantasy] = await Promise.all([
    db
      .select({ id: storyCategories.id, name: storyCategories.name, slug: storyCategories.slug })
      .from(storyCategories),
    db.select({ id: moodTags.id, name: moodTags.name }).from(moodTags),
    db.select({ id: orientationTags.id, name: orientationTags.name }).from(orientationTags),
    db.select({ id: fantasyTags.id, name: fantasyTags.name }).from(fantasyTags),
  ])

  const catBySlug = new Map(cats.map((c) => [c.slug.toLowerCase(), c.id]))
  const catByName = new Map(cats.map((c) => [c.name.toLowerCase(), c.id]))
  const moodByName = new Map(moods.map((m) => [m.name.toLowerCase(), m.id]))
  const orientByName = new Map(orientations.map((o) => [o.name.toLowerCase(), o.id]))
  const fantasyByName = new Map(fantasy.map((f) => [f.name.toLowerCase(), f.id]))

  let imported = 0
  let skipped = 0
  const now = new Date()

  for (const item of items) {
    const title = item.title?.trim()
    const bodyText = (item.body ?? item.raw_text ?? '').trim()
    if (!title || !bodyText) {
      skipped++
      continue
    }

    // Primary category: first matched from the categories array
    const catNames: string[] = item.categories ?? []
    let category_id: number | null = null
    for (const cn of catNames) {
      const found = catBySlug.get(cn.toLowerCase()) ?? catByName.get(cn.toLowerCase())
      if (found) {
        category_id = found
        break
      }
    }

    const moodIds = (item.mood_tags ?? [])
      .map((n) => moodByName.get(n.toLowerCase()))
      .filter((v): v is number => v != null)
    const orientIds = (item.orientation_tags ?? [])
      .map((n) => orientByName.get(n.toLowerCase()))
      .filter((v): v is number => v != null)
    const fantasyIds = (item.fantasy_tags ?? [])
      .map((n) => fantasyByName.get(n.toLowerCase()))
      .filter((v): v is number => v != null)

    const [inserted] = await db
      .insert(stories)
      .values({
        title,
        body: bodyText,
        excerpt: item.source_url ? `Source: ${item.source_url}` : null,
        category_id,
        author_type: 'admin',
        author_user_id: null,
        author_companion_id: null,
        is_anonymous: true,
        is_featured: false,
        moderation_status: 'approved',
        is_published: true,
        published_at: now,
        moderated_at: now,
      })
      .returning({ id: stories.id })

    const storyId = inserted.id

    await Promise.all([
      moodIds.length
        ? db
            .insert(storyMoodTags)
            .values(moodIds.map((tid) => ({ story_id: storyId, mood_tag_id: tid })))
        : Promise.resolve(),
      orientIds.length
        ? db
            .insert(storyOrientationTags)
            .values(orientIds.map((tid) => ({ story_id: storyId, orientation_tag_id: tid })))
        : Promise.resolve(),
      fantasyIds.length
        ? db
            .insert(storyFantasyTags)
            .values(fantasyIds.map((tid) => ({ story_id: storyId, fantasy_tag_id: tid })))
        : Promise.resolve(),
    ])

    imported++
  }

  return NextResponse.json({ success: true, imported, skipped })
}
