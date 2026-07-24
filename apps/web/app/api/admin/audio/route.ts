import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { db } from '@/db'
import { audioRecordings, users, companions } from '@/db/schema'
import { eq, and, isNull, desc, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if (!guard.ok) return guard.response

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'all'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 20
  const offset = (page - 1) * limit

  const conditions: any[] = [isNull(audioRecordings.deleted_at)]
  if (filter === 'pending' || filter === 'approved' || filter === 'rejected') {
    conditions.push(eq(audioRecordings.moderation_status, filter))
  }
  const where = and(...conditions)

  const [rows, countRows, pendingRows] = await Promise.all([
    db
      .select({
        id: audioRecordings.id,
        title: audioRecordings.title,
        description: audioRecordings.description,
        author_type: audioRecordings.author_type,
        is_original_voice: audioRecordings.is_original_voice,
        is_anonymous: audioRecordings.is_anonymous,
        moderation_status: audioRecordings.moderation_status,
        url: audioRecordings.url,
        duration_seconds: audioRecordings.duration_seconds,
        listen_count: audioRecordings.listen_count,
        like_count: audioRecordings.like_count,
        save_count: audioRecordings.save_count,
        created_at: audioRecordings.created_at,
        user_alias: users.alias,
        companion_name: companions.name,
      })
      .from(audioRecordings)
      .leftJoin(users, eq(users.id, audioRecordings.author_user_id))
      .leftJoin(companions, eq(companions.id, audioRecordings.author_companion_id))
      .where(where)
      .orderBy(desc(audioRecordings.created_at))
      .limit(limit)
      .offset(offset),

    db
      .select({ n: sql<number>`count(*)::int` })
      .from(audioRecordings)
      .where(where),

    db
      .select({ n: sql<number>`count(*)::int` })
      .from(audioRecordings)
      .where(
        and(isNull(audioRecordings.deleted_at), eq(audioRecordings.moderation_status, 'pending'))
      ),
  ])

  return NextResponse.json({
    data: rows,
    meta: {
      total: Number(countRows[0]?.n ?? 0),
      pending_count: Number(pendingRows[0]?.n ?? 0),
      page,
      limit,
    },
  })
}
