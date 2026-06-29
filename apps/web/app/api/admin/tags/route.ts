import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import {
  fantasyCategories,
  fantasyTags,
  vibeTags,
  moodTags,
  orientationTags,
  storyCategories,
  companionFantasyTags,
  companionVibeTags,
  storyFantasyTags,
  storyMoodTags,
  storyOrientationTags,
  stories,
} from '@/db/schema'
import { eq, sql, asc, isNull } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const [fantCats, fantTagRows, vibeTagRows, moodTagRows, orientTagRows, storyCatRows] =
    await Promise.all([
      db
        .select({
          id: fantasyCategories.id,
          name: fantasyCategories.name,
          slug: fantasyCategories.slug,
          description: fantasyCategories.description,
          sort_order: fantasyCategories.sort_order,
          is_active: fantasyCategories.is_active,
          tag_count: sql<number>`(SELECT COUNT(*)::int FROM fantasy_tags WHERE category_id = ${fantasyCategories.id})`,
        })
        .from(fantasyCategories)
        .orderBy(asc(fantasyCategories.sort_order)),

      db
        .select({
          id: fantasyTags.id,
          category_id: fantasyTags.category_id,
          category_name: fantasyCategories.name,
          name: fantasyTags.name,
          slug: fantasyTags.slug,
          description: fantasyTags.description,
          is_active: fantasyTags.is_active,
          usage_count: sql<number>`(
        SELECT COUNT(*)::int FROM companion_fantasy_tags WHERE fantasy_tag_id = ${fantasyTags.id}
      ) + (
        SELECT COUNT(*)::int FROM story_fantasy_tags WHERE fantasy_tag_id = ${fantasyTags.id}
      )`,
        })
        .from(fantasyTags)
        .leftJoin(fantasyCategories, eq(fantasyCategories.id, fantasyTags.category_id))
        .orderBy(asc(fantasyTags.id)),

      db
        .select({
          id: vibeTags.id,
          name: vibeTags.name,
          slug: vibeTags.slug,
          emoji: vibeTags.emoji,
          is_active: vibeTags.is_active,
          usage_count: sql<number>`(SELECT COUNT(*)::int FROM companion_vibe_tags WHERE vibe_tag_id = ${vibeTags.id})`,
        })
        .from(vibeTags)
        .orderBy(asc(vibeTags.id)),

      db
        .select({
          id: moodTags.id,
          name: moodTags.name,
          slug: moodTags.slug,
          emoji: moodTags.emoji,
          is_active: moodTags.is_active,
          usage_count: sql<number>`(SELECT COUNT(*)::int FROM story_mood_tags WHERE mood_tag_id = ${moodTags.id})`,
        })
        .from(moodTags)
        .orderBy(asc(moodTags.id)),

      db
        .select({
          id: orientationTags.id,
          name: orientationTags.name,
          slug: orientationTags.slug,
          is_active: orientationTags.is_active,
          usage_count: sql<number>`(SELECT COUNT(*)::int FROM story_orientation_tags WHERE orientation_tag_id = ${orientationTags.id})`,
        })
        .from(orientationTags)
        .orderBy(asc(orientationTags.id)),

      db
        .select({
          id: storyCategories.id,
          name: storyCategories.name,
          slug: storyCategories.slug,
          description: storyCategories.description,
          sort_order: storyCategories.sort_order,
          is_active: storyCategories.is_active,
          story_count: sql<number>`(SELECT COUNT(*)::int FROM stories WHERE category_id = ${storyCategories.id} AND deleted_at IS NULL)`,
        })
        .from(storyCategories)
        .orderBy(asc(storyCategories.sort_order)),
    ])

  return NextResponse.json({
    data: {
      fantasy_categories: fantCats,
      fantasy_tags: fantTagRows,
      vibe_tags: vibeTagRows,
      mood_tags: moodTagRows,
      orientation_tags: orientTagRows,
      story_categories: storyCatRows,
    },
  })
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const body = await req.json()
  const { table, name, slug, emoji, category_id, description, sort_order } = body

  if (!table || !name?.trim()) {
    return NextResponse.json({ error: 'table and name required' }, { status: 400 })
  }

  const finalSlug = slug?.trim() || toSlug(name.trim())

  let id: number | undefined

  if (table === 'fantasy_category') {
    const [r] = await db
      .insert(fantasyCategories)
      .values({
        name: name.trim(),
        slug: finalSlug,
        description: description ?? null,
        sort_order: sort_order ?? 0,
      })
      .returning({ id: fantasyCategories.id })
    id = r.id
  } else if (table === 'fantasy_tag') {
    if (!category_id)
      return NextResponse.json({ error: 'category_id required for fantasy_tag' }, { status: 400 })
    const [r] = await db
      .insert(fantasyTags)
      .values({
        name: name.trim(),
        slug: finalSlug,
        category_id,
        description: description ?? null,
      })
      .returning({ id: fantasyTags.id })
    id = r.id
  } else if (table === 'vibe_tag') {
    const [r] = await db
      .insert(vibeTags)
      .values({
        name: name.trim(),
        slug: finalSlug,
        emoji: emoji ?? null,
      })
      .returning({ id: vibeTags.id })
    id = r.id
  } else if (table === 'mood_tag') {
    const [r] = await db
      .insert(moodTags)
      .values({
        name: name.trim(),
        slug: finalSlug,
        emoji: emoji ?? null,
      })
      .returning({ id: moodTags.id })
    id = r.id
  } else if (table === 'orientation_tag') {
    const [r] = await db
      .insert(orientationTags)
      .values({
        name: name.trim(),
        slug: finalSlug,
      })
      .returning({ id: orientationTags.id })
    id = r.id
  } else if (table === 'story_category') {
    const [r] = await db
      .insert(storyCategories)
      .values({
        name: name.trim(),
        slug: finalSlug,
        description: description ?? null,
        sort_order: sort_order ?? 0,
      })
      .returning({ id: storyCategories.id })
    id = r.id
  } else {
    return NextResponse.json({ error: 'Unknown table' }, { status: 400 })
  }

  return NextResponse.json({ success: true, id })
}
