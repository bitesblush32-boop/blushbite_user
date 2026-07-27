export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { companionVideos, companionProfiles, companions } from '@/db/schema'
import { eq, and, isNull, desc, lt, or, sql } from 'drizzle-orm'
import { z } from 'zod'

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(10),
  cursor: z.string().optional(),
})

interface Cursor {
  created_at: string
  id: string
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const parsed = querySchema.safeParse({
      limit: searchParams.get('limit') ?? undefined,
      cursor: searchParams.get('cursor') ?? undefined,
    })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query params' }, { status: 400 })
    }

    const { limit } = parsed.data
    let cursor: Cursor | null = null
    if (parsed.data.cursor) {
      try {
        cursor = JSON.parse(parsed.data.cursor) as Cursor
      } catch {
        /* ignore malformed cursor */
      }
    }

    const baseWhere = and(
      eq(companionVideos.is_approved, true),
      isNull(companionVideos.deleted_at),
      eq(companionProfiles.is_visible_to_users, true)
    )

    const cursorWhere = cursor
      ? or(
          lt(companionVideos.created_at, new Date(cursor.created_at)),
          and(
            sql`${companionVideos.created_at} = ${cursor.created_at}::timestamptz`,
            sql`${companionVideos.id}::text < ${cursor.id}`
          )
        )
      : undefined

    const whereClause = cursorWhere ? and(baseWhere, cursorWhere) : baseWhere

    const rows = await db
      .select({
        id: companionVideos.id,
        url: companionVideos.url,
        thumbnail_url: companionVideos.thumbnail_url,
        duration_seconds: companionVideos.duration_seconds,
        created_at: companionVideos.created_at,
        profile_id: companionProfiles.id,
        companion_name: companions.name,
        city: companionProfiles.city,
        companion_photo: sql<string | null>`(
          SELECT url FROM companion_photos
          WHERE companion_profile_id = ${companionProfiles.id}
            AND is_primary = true
            AND deleted_at IS NULL
            AND is_approved = true
          LIMIT 1
        )`,
      })
      .from(companionVideos)
      .innerJoin(companionProfiles, eq(companionProfiles.id, companionVideos.companion_profile_id))
      .innerJoin(companions, eq(companions.id, companionProfiles.companion_id))
      .where(whereClause)
      .orderBy(desc(companionVideos.created_at), desc(companionVideos.id))
      .limit(limit + 1)

    const hasMore = rows.length > limit
    const items = rows.slice(0, limit)
    const last = items[items.length - 1]
    const nextCursor: Cursor | null =
      hasMore && last ? { created_at: last.created_at?.toISOString() ?? '', id: last.id } : null

    return NextResponse.json({
      items: items.map((r) => ({
        id: r.id,
        url: r.url,
        thumbnailUrl: r.thumbnail_url,
        durationSeconds: r.duration_seconds,
        profileId: r.profile_id,
        companionName: r.companion_name,
        city: r.city,
        companionPhoto: r.companion_photo,
      })),
      nextCursor,
    })
  } catch (err) {
    console.error('[GET /api/platform-videos]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
