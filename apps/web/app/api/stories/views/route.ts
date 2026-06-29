import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { stories } from '@/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'

const schema = z.object({
  views: z
    .array(
      z.object({
        storyId: z.string().uuid(),
        viewedAt: z.number(),
        duration: z.number(),
      })
    )
    .max(50),
})

export async function POST(req: NextRequest) {
  try {
    let raw: unknown
    try {
      raw = await req.json()
    } catch {
      return NextResponse.json({ ok: true })
    }

    const result = schema.safeParse(raw)
    if (!result.success) return NextResponse.json({ ok: true })

    await Promise.all(
      result.data.views.map((v) =>
        db
          .update(stories)
          .set({ view_count: sql`${stories.view_count} + 1` })
          .where(and(eq(stories.id, v.storyId), eq(stories.is_published, true)))
      )
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/stories/views]', err)
    return NextResponse.json({ ok: true }) // always 200
  }
}
