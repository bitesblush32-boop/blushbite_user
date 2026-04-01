import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

// ─── PUT /api/user/photos ─────────────────────────────────────────────────────
// Save photo URL + metadata to user profile

export async function PUT(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { cdnUrl, s3Key } = await req.json()

  if (!cdnUrl) {
    return NextResponse.json({ error: 'Missing cdnUrl' }, { status: 400 })
  }

  // ─── Update user's image field (primary photo) ────────────────────────────
  // For now, we store the CDN URL in the user.image field
  // TODO: Phase 2 — create user_photos table for multiple photos
  try {
    await db
      .update(users)
      .set({ image: cdnUrl, updated_at: new Date() })
      .where(eq(users.email, session.user.email))

    return NextResponse.json({
      data: {
        cdnUrl,
        s3Key,
        message: 'Photo saved successfully',
      },
    })
  } catch (err) {
    console.error('[API] save photo failed:', err)
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to save photo: ${errorMsg}` },
      { status: 500 },
    )
  }
}
