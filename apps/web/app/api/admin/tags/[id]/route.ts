import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import {
  fantasyCategories, fantasyTags, vibeTags, moodTags, orientationTags, storyCategories,
  companionFantasyTags, companionVibeTags, storyFantasyTags, storyMoodTags, storyOrientationTags,
  stories,
} from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

type TableKey =
  | 'fantasy_category'
  | 'fantasy_tag'
  | 'vibe_tag'
  | 'mood_tag'
  | 'orientation_tag'
  | 'story_category'

async function getUsageCount(table: TableKey, id: number): Promise<number> {
  switch (table) {
    case 'fantasy_category': {
      const [r] = await db
        .select({ c: sql<number>`COUNT(*)::int` })
        .from(fantasyTags)
        .where(eq(fantasyTags.category_id, id))
      return r.c
    }
    case 'fantasy_tag': {
      const [[a], [b]] = await Promise.all([
        db.select({ c: sql<number>`COUNT(*)::int` }).from(companionFantasyTags).where(eq(companionFantasyTags.fantasy_tag_id, id)),
        db.select({ c: sql<number>`COUNT(*)::int` }).from(storyFantasyTags).where(eq(storyFantasyTags.fantasy_tag_id, id)),
      ])
      return (a?.c ?? 0) + (b?.c ?? 0)
    }
    case 'vibe_tag': {
      const [r] = await db.select({ c: sql<number>`COUNT(*)::int` }).from(companionVibeTags).where(eq(companionVibeTags.vibe_tag_id, id))
      return r?.c ?? 0
    }
    case 'mood_tag': {
      const [r] = await db.select({ c: sql<number>`COUNT(*)::int` }).from(storyMoodTags).where(eq(storyMoodTags.mood_tag_id, id))
      return r?.c ?? 0
    }
    case 'orientation_tag': {
      const [r] = await db.select({ c: sql<number>`COUNT(*)::int` }).from(storyOrientationTags).where(eq(storyOrientationTags.orientation_tag_id, id))
      return r?.c ?? 0
    }
    case 'story_category': {
      const [r] = await db
        .select({ c: sql<number>`COUNT(*)::int` })
        .from(stories)
        .where(sql`category_id = ${id} AND deleted_at IS NULL`)
      return r?.c ?? 0
    }
    default:
      return 0
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  const user = session?.user as any
  if (!session || user?.platform_role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const id = parseInt(params.id, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body = await req.json()
  const { table, action, name, emoji, sort_order, description } = body as {
    table: TableKey
    action: 'toggle_active' | 'update'
    name?: string
    emoji?: string
    sort_order?: number
    description?: string
  }

  if (!table || !action) {
    return NextResponse.json({ error: 'table and action required' }, { status: 400 })
  }

  if (action === 'toggle_active') {
    switch (table) {
      case 'fantasy_category':
        await db.update(fantasyCategories)
          .set({ is_active: sql`NOT ${fantasyCategories.is_active}` })
          .where(eq(fantasyCategories.id, id))
        break
      case 'fantasy_tag':
        await db.update(fantasyTags)
          .set({ is_active: sql`NOT ${fantasyTags.is_active}` })
          .where(eq(fantasyTags.id, id))
        break
      case 'vibe_tag':
        await db.update(vibeTags)
          .set({ is_active: sql`NOT ${vibeTags.is_active}` })
          .where(eq(vibeTags.id, id))
        break
      case 'mood_tag':
        await db.update(moodTags)
          .set({ is_active: sql`NOT ${moodTags.is_active}` })
          .where(eq(moodTags.id, id))
        break
      case 'orientation_tag':
        await db.update(orientationTags)
          .set({ is_active: sql`NOT ${orientationTags.is_active}` })
          .where(eq(orientationTags.id, id))
        break
      case 'story_category':
        await db.update(storyCategories)
          .set({ is_active: sql`NOT ${storyCategories.is_active}` })
          .where(eq(storyCategories.id, id))
        break
      default:
        return NextResponse.json({ error: 'Unknown table' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  }

  if (action === 'update') {
    switch (table) {
      case 'fantasy_category': {
        const updates: Record<string, unknown> = {}
        if (name !== undefined)        updates.name        = name.trim()
        if (description !== undefined) updates.description = description
        if (sort_order !== undefined)  updates.sort_order  = sort_order
        await db.update(fantasyCategories).set(updates).where(eq(fantasyCategories.id, id))
        break
      }
      case 'fantasy_tag': {
        const updates: Record<string, unknown> = {}
        if (name !== undefined)        updates.name        = name.trim()
        if (description !== undefined) updates.description = description
        await db.update(fantasyTags).set(updates).where(eq(fantasyTags.id, id))
        break
      }
      case 'vibe_tag': {
        const updates: Record<string, unknown> = {}
        if (name !== undefined)  updates.name  = name.trim()
        if (emoji !== undefined) updates.emoji = emoji
        await db.update(vibeTags).set(updates).where(eq(vibeTags.id, id))
        break
      }
      case 'mood_tag': {
        const updates: Record<string, unknown> = {}
        if (name !== undefined)  updates.name  = name.trim()
        if (emoji !== undefined) updates.emoji = emoji
        await db.update(moodTags).set(updates).where(eq(moodTags.id, id))
        break
      }
      case 'orientation_tag': {
        const updates: Record<string, unknown> = {}
        if (name !== undefined) updates.name = name.trim()
        await db.update(orientationTags).set(updates).where(eq(orientationTags.id, id))
        break
      }
      case 'story_category': {
        const updates: Record<string, unknown> = {}
        if (name !== undefined)        updates.name        = name.trim()
        if (description !== undefined) updates.description = description
        if (sort_order !== undefined)  updates.sort_order  = sort_order
        await db.update(storyCategories).set(updates).where(eq(storyCategories.id, id))
        break
      }
      default:
        return NextResponse.json({ error: 'Unknown table' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  const user = session?.user as any
  if (!session || user?.platform_role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const id = parseInt(params.id, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const table = searchParams.get('table') as TableKey | null
  if (!table) return NextResponse.json({ error: 'table query param required' }, { status: 400 })

  const usageCount = await getUsageCount(table, id)
  if (usageCount > 0) {
    return NextResponse.json(
      { error: 'Tag is in use — deactivate instead of deleting.' },
      { status: 400 }
    )
  }

  switch (table) {
    case 'fantasy_category':
      await db.delete(fantasyCategories).where(eq(fantasyCategories.id, id))
      break
    case 'fantasy_tag':
      await db.delete(fantasyTags).where(eq(fantasyTags.id, id))
      break
    case 'vibe_tag':
      await db.delete(vibeTags).where(eq(vibeTags.id, id))
      break
    case 'mood_tag':
      await db.delete(moodTags).where(eq(moodTags.id, id))
      break
    case 'orientation_tag':
      await db.delete(orientationTags).where(eq(orientationTags.id, id))
      break
    case 'story_category':
      await db.delete(storyCategories).where(eq(storyCategories.id, id))
      break
    default:
      return NextResponse.json({ error: 'Unknown table' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
