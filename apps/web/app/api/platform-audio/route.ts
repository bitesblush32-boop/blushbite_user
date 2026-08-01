export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { audioRecordings, users, companions } from '@/db/schema'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { z } from 'zod'

const AUDIO_GRADIENTS = [
  'linear-gradient(135deg,#16101e,#2a1040)',
  'linear-gradient(135deg,#101622,#201030)',
  'linear-gradient(135deg,#0e1820,#1a1230)',
]

function gradientFromId(id: string): string {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AUDIO_GRADIENTS[hash % AUDIO_GRADIENTS.length]
}

function fmtDuration(sec: number | null): string {
  if (!sec || sec <= 0) return ''
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m === 0) return `${s}s`
  return s === 0 ? `${m} min` : `${m}:${String(s).padStart(2, '0')}`
}

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(12),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const parsed = querySchema.safeParse({ limit: searchParams.get('limit') ?? undefined })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query params' }, { status: 400 })
    }
    const { limit } = parsed.data

    const rows = await db
      .select({
        id: audioRecordings.id,
        title: audioRecordings.title,
        description: audioRecordings.description,
        url: audioRecordings.url,
        duration_seconds: audioRecordings.duration_seconds,
        is_original_voice: audioRecordings.is_original_voice,
        is_anonymous: audioRecordings.is_anonymous,
        author_type: audioRecordings.author_type,
        user_alias: users.alias,
        companion_name: companions.name,
      })
      .from(audioRecordings)
      .leftJoin(users, eq(users.id, audioRecordings.author_user_id))
      .leftJoin(companions, eq(companions.id, audioRecordings.author_companion_id))
      .where(
        and(
          eq(audioRecordings.moderation_status, 'approved'),
          isNull(audioRecordings.deleted_at)
        )
      )
      .orderBy(desc(audioRecordings.created_at))
      .limit(limit)

    const items = rows.map((r) => {
      // Derive voice label
      let voice = 'Voice'
      if (!r.is_anonymous) {
        if (r.author_type === 'companion' && r.companion_name) {
          voice = r.companion_name
        } else if (r.author_type === 'user' && r.user_alias) {
          voice = `@${r.user_alias}`
        }
      } else {
        voice = r.is_original_voice ? 'Original Voice' : 'Anonymous'
      }

      // Derive vibe from description
      const vibe = r.description
        ? r.description.slice(0, 40).trim() + (r.description.length > 40 ? '…' : '')
        : 'Intimate'

      return {
        id: r.id,
        title: r.title ?? 'Untitled',
        voice,
        duration: fmtDuration(r.duration_seconds),
        vibe,
        tags: [] as string[],
        gradient: gradientFromId(r.id),
        url: r.url,
      }
    })

    return NextResponse.json({ items })
  } catch (err) {
    console.error('[GET /api/platform-audio]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
