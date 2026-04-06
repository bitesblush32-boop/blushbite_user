import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { companions, stories, storyCategories } from '@/db/schema'
import { eq, ilike } from 'drizzle-orm'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companion = await db.query.companions.findFirst({
    where: eq(companions.email, session.user.email),
  })
  if (!companion) return NextResponse.json({ error: 'Not a companion' }, { status: 403 })

  const body = await req.json()
  const { type, title, storyBody, excerpt, categories } = body

  if (!storyBody?.trim()) return NextResponse.json({ error: 'Body is required' }, { status: 400 })

  // Resolve category_id — try to match first passed category, fall back to first active category
  let categoryId: number | null = null
  if (categories?.length > 0) {
    const cat = await db.query.storyCategories.findFirst({
      where: ilike(storyCategories.name, `%${categories[0]}%`),
    })
    categoryId = cat?.id ?? null
  }
  if (categoryId === null) {
    const first = await db.query.storyCategories.findFirst()
    categoryId = first?.id ?? null
  }

  const isConfession = type === 'confession'

  const [inserted] = await db.insert(stories).values({
    author_type:         'companion',
    author_companion_id: companion.id,
    author_user_id:      null,
    category_id:         categoryId,
    title:               title?.trim() || (isConfession ? 'Untitled confession' : 'Untitled story'),
    body:                storyBody.trim(),
    excerpt:             excerpt?.trim() || null,
    is_anonymous:        isConfession,
    is_published:        true,
    is_featured:         false,
    moderation_status:   'approved',
    published_at:        new Date(),
  }).returning({ id: stories.id })

  return NextResponse.json({ id: inserted.id })
}
