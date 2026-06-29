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

export const maxDuration = 300
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (!guard.ok) return guard.response

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const text = await file.text()
    const records = text
      .split('\n')
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l))

    // Dedup against existing titles
    const existing = await db.select({ title: stories.title }).from(stories)
    const existingTitles = new Set(existing.map((r) => r.title?.toLowerCase().trim()))
    const toInsert = records.filter((r) => !existingTitles.has(r.title?.toLowerCase().trim()))
    const skipped = records.length - toInsert.length

    const adminUserId = process.env.ADMIN_USER_ID ?? null

    const BATCH = 50
    let insertedCount = 0

    for (let i = 0; i < toInsert.length; i += BATCH) {
      const batch = toInsert.slice(i, i + BATCH)

      await db.transaction(async (tx) => {
        for (const record of batch) {
          const [row] = await tx
            .insert(stories)
            .values({
              author_type: adminUserId ? 'user' : 'admin',
              author_user_id: adminUserId ?? null,
              author_companion_id: null,
              category_id: record.primary_category_id ?? null,
              title: record.title,
              body: JSON.stringify({
                raw: record.body,
                pages: [],
                categories: record.story_category_ids?.map(String) ?? [],
              }),
              excerpt: record.excerpt ?? record.body?.slice(0, 280) ?? null,
              is_anonymous: true,
              is_published: true,
              is_featured: false,
              moderation_status: 'approved',
              moderated_at: new Date(),
              published_at: record.created_at ? new Date(record.created_at) : new Date(),
            })
            .returning({ id: stories.id })

          if (record.story_category_ids?.length > 0) {
            await tx
              .insert(storyStoryCategories)
              .values(
                record.story_category_ids.map((cid: number) => ({
                  story_id: row.id,
                  category_id: cid,
                }))
              )
              .onConflictDoNothing()
          }

          if (record.mood_tag_ids?.length > 0) {
            await tx
              .insert(storyMoodTags)
              .values(
                record.mood_tag_ids.map((tid: number) => ({ story_id: row.id, mood_tag_id: tid }))
              )
              .onConflictDoNothing()
          }

          if (record.orientation_tag_ids?.length > 0) {
            await tx
              .insert(storyOrientationTags)
              .values(
                record.orientation_tag_ids.map((tid: number) => ({
                  story_id: row.id,
                  orientation_tag_id: tid,
                }))
              )
              .onConflictDoNothing()
          }

          if (record.fantasy_tag_ids?.length > 0) {
            await tx
              .insert(storyFantasyTags)
              .values(
                record.fantasy_tag_ids.map((tid: number) => ({
                  story_id: row.id,
                  fantasy_tag_id: tid,
                }))
              )
              .onConflictDoNothing()
          }

          insertedCount++
        }
      })

      if ((i + BATCH) % 500 === 0 || i + BATCH >= toInsert.length) {
        console.error(
          `[${Math.min(i + BATCH, toInsert.length)}/${toInsert.length}] bulk import in progress...`
        )
      }
    }

    return NextResponse.json({ ok: true, inserted: insertedCount, skipped })
  } catch (err) {
    console.error('[POST /api/admin/stories/bulk]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
