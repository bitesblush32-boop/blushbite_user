export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { companionPhotos, companionVideos, companionProfiles, companions } from '@/db/schema'
import { eq, and, isNull, desc, lt, or, sql, count } from 'drizzle-orm'
import { z } from 'zod'

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(12),
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

    const isFirstPage = cursor === null

    // ── Cursor condition (shared shape for both tables) ────────────────────────
    const makeCursorWhere = (createdAtCol: typeof companionVideos.created_at | typeof companionPhotos.created_at, idCol: typeof companionVideos.id | typeof companionPhotos.id) =>
      cursor
        ? or(
            lt(createdAtCol, new Date(cursor.created_at)),
            and(
              sql`${createdAtCol} = ${cursor.created_at}::timestamptz`,
              sql`${idCol}::text < ${cursor.id}`
            )
          )
        : undefined

    // ── Video query ────────────────────────────────────────────────────────────
    const videoBase = and(
      eq(companionVideos.is_approved, true),
      isNull(companionVideos.deleted_at),
      eq(companionProfiles.is_visible_to_users, true)
    )

    const videoRows = await db
      .select({
        id: companionVideos.id,
        url: companionVideos.url,
        thumbnailUrl: companionVideos.thumbnail_url,
        durationSeconds: companionVideos.duration_seconds,
        created_at: companionVideos.created_at,
        profileId: companionProfiles.id,
        companionName: companions.name,
        city: companionProfiles.city,
      })
      .from(companionVideos)
      .innerJoin(companionProfiles, eq(companionProfiles.id, companionVideos.companion_profile_id))
      .innerJoin(companions, eq(companions.id, companionProfiles.companion_id))
      .where(
        cursor
          ? and(videoBase, makeCursorWhere(companionVideos.created_at, companionVideos.id))
          : videoBase
      )
      .orderBy(desc(companionVideos.created_at), desc(companionVideos.id))
      .limit(limit)

    // ── Photo query (non-primary only) ─────────────────────────────────────────
    const photoBase = and(
      eq(companionPhotos.is_primary, false),
      eq(companionPhotos.is_approved, true),
      isNull(companionPhotos.deleted_at),
      eq(companionProfiles.is_visible_to_users, true)
    )

    const photoRows = await db
      .select({
        id: companionPhotos.id,
        url: companionPhotos.url,
        thumbnailUrl: sql<string | null>`NULL::text`,
        durationSeconds: sql<number | null>`NULL::integer`,
        created_at: companionPhotos.created_at,
        profileId: companionProfiles.id,
        companionName: companions.name,
        city: companionProfiles.city,
      })
      .from(companionPhotos)
      .innerJoin(companionProfiles, eq(companionProfiles.id, companionPhotos.companion_profile_id))
      .innerJoin(companions, eq(companions.id, companionProfiles.companion_id))
      .where(
        cursor
          ? and(photoBase, makeCursorWhere(companionPhotos.created_at, companionPhotos.id))
          : photoBase
      )
      .orderBy(desc(companionPhotos.created_at), desc(companionPhotos.id))
      .limit(limit)

    // ── Counts (first page only) ───────────────────────────────────────────────
    let videoCount = 0
    let photoCount = 0

    if (isFirstPage) {
      const [vCount, pCount] = await Promise.all([
        db
          .select({ count: count() })
          .from(companionVideos)
          .innerJoin(companionProfiles, eq(companionProfiles.id, companionVideos.companion_profile_id))
          .where(
            and(
              eq(companionVideos.is_approved, true),
              isNull(companionVideos.deleted_at),
              eq(companionProfiles.is_visible_to_users, true)
            )
          ),
        db
          .select({ count: count() })
          .from(companionPhotos)
          .innerJoin(companionProfiles, eq(companionProfiles.id, companionPhotos.companion_profile_id))
          .where(
            and(
              eq(companionPhotos.is_primary, false),
              eq(companionPhotos.is_approved, true),
              isNull(companionPhotos.deleted_at),
              eq(companionProfiles.is_visible_to_users, true)
            )
          ),
      ])
      videoCount = Number(vCount[0]?.count ?? 0)
      photoCount = Number(pCount[0]?.count ?? 0)
    }

    // ── Merge & sort by recency ────────────────────────────────────────────────
    const merged = [
      ...videoRows.map((r) => ({ ...r, mediaType: 'video' as const })),
      ...photoRows.map((r) => ({ ...r, mediaType: 'photo' as const })),
    ].sort((a, b) => {
      const diff =
        new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      if (diff !== 0) return diff
      return a.id > b.id ? -1 : 1
    })

    const hasMore = merged.length > limit
    const items = merged.slice(0, limit)
    const last = items[items.length - 1]
    const nextCursor: Cursor | null =
      hasMore && last
        ? { created_at: last.created_at?.toISOString() ?? '', id: last.id }
        : null

    return NextResponse.json({
      items: items.map((r) => ({
        id: r.id,
        mediaType: r.mediaType,
        url: r.url,
        thumbnailUrl: r.thumbnailUrl ?? null,
        durationSeconds: r.durationSeconds ?? null,
        profileId: r.profileId,
        companionName: r.companionName,
        city: r.city,
      })),
      nextCursor,
      ...(isFirstPage ? { videoCount, photoCount } : {}),
    })
  } catch (err) {
    console.error('[GET /api/platform-media]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
