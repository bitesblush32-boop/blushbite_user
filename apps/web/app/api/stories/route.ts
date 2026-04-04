import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/db'
import { stories } from '@/db/schema'

// ─── Validation ───────────────────────────────────────────────────────────────

const postSchema = z.object({
  pages:         z.array(z.string().min(1)).min(1).max(8),
  pageImageUrls: z.array(z.string()).max(8).optional().default([]),
  title:         z.string().max(120).optional().default(''),
  categories:    z.array(z.string()).min(1).max(20),
  isAnonymous:   z.boolean().optional().default(false),
})

// ─── POST /api/stories ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    let raw: unknown
    try {
      raw = await req.json()
    } catch {
      return NextResponse.json({ error: 'Something slipped — try sending again.' }, { status: 400 })
    }

    console.log('[stories] raw body:', JSON.stringify(raw, null, 2))

    const result = postSchema.safeParse(raw)
    if (!result.success) {
      console.log('[stories] validation errors:', JSON.stringify(result.error.flatten(), null, 2))
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { pages, pageImageUrls, title, categories } = result.data

    const bodyToStore = JSON.stringify({
      raw:        pages.join('\n\n---\n\n'),
      pages:      pageImageUrls,
      categories,
    })

    const excerpt = pages[0].slice(0, 280).trim()

    const [story] = await db
      .insert(stories)
      .values({
        author_type:         'user',
        author_user_id:      userId,
        author_companion_id: null,
        category_id:         null,
        title:               title || '',
        body:                bodyToStore,
        excerpt,
        is_anonymous:        false,
        is_published:        true,
        moderation_status:   'approved',
        moderated_at:        new Date(),
        published_at:        new Date(),
      })
      .returning({ id: stories.id })

    if (!story) {
      return NextResponse.json({ error: 'Failed to save your confession.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, storyId: story.id })
  } catch (err) {
    console.error('[POST /api/stories]', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Something went wrong — ${msg}` }, { status: 500 })
  }
}
