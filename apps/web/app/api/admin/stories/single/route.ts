import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import {
  stories,
  storyStoryCategories,
  storyMoodTags,
  storyOrientationTags,
  storyFantasyTags,
} from '@/db/schema'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (!guard.ok) return guard.response

    const {
      title,
      body,
      excerpt,
      pageImageUrls,
      story_category_ids,
      mood_tag_ids,
      orientation_tag_ids,
      fantasy_tag_ids,
      primary_category_id,
      created_at,
    } = await req.json()

    const adminUserId = process.env.ADMIN_USER_ID ?? null

    const [row] = await db.insert(stories).values({
      author_type:         'user',
      author_user_id:      adminUserId,
      author_companion_id: null,
      category_id:         primary_category_id ?? null,
      title,
      body: JSON.stringify({
        raw:        body,
        pages:      pageImageUrls ?? [],
        categories: [],
      }),
      excerpt:           excerpt ?? (body as string)?.slice(0, 280) ?? null,
      is_anonymous:      true,
      is_published:      true,
      is_featured:       false,
      moderation_status: 'approved',
      moderated_at:      new Date(),
      published_at:      created_at ? new Date(created_at) : new Date(),
    }).returning({ id: stories.id })

    if ((story_category_ids as number[])?.length > 0) {
      await db.insert(storyStoryCategories).values(
        (story_category_ids as number[]).map(cid => ({ story_id: row.id, category_id: cid }))
      ).onConflictDoNothing()
    }

    if ((mood_tag_ids as number[])?.length > 0) {
      await db.insert(storyMoodTags).values(
        (mood_tag_ids as number[]).map(tid => ({ story_id: row.id, mood_tag_id: tid }))
      ).onConflictDoNothing()
    }

    if ((orientation_tag_ids as number[])?.length > 0) {
      await db.insert(storyOrientationTags).values(
        (orientation_tag_ids as number[]).map(tid => ({ story_id: row.id, orientation_tag_id: tid }))
      ).onConflictDoNothing()
    }

    if ((fantasy_tag_ids as number[])?.length > 0) {
      await db.insert(storyFantasyTags).values(
        (fantasy_tag_ids as number[]).map(tid => ({ story_id: row.id, fantasy_tag_id: tid }))
      ).onConflictDoNothing()
    }

    return NextResponse.json({ ok: true, storyId: row.id })
  } catch (err) {
    console.error('[POST /api/admin/stories/single]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
