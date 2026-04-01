import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { z } from 'zod'
import { auth } from '@/auth'
import { r2, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2'
import crypto from 'crypto'

// ─── Validation schema ────────────────────────────────────────────────────────

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'audio/mpeg']
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

const presignedUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.enum(ALLOWED_TYPES as [string, ...string[]]),
  fileSize: z.number().min(1).max(MAX_FILE_SIZE),
  contentFor: z.enum(['companion_photo', 'companion_video', 'story_audio']).optional(),
})

type PresignedUrlRequest = z.infer<typeof presignedUrlSchema>

// ─── POST /api/upload/presigned-url ────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ─── Parse + validate request ───────────────────────────────────────────
  let body: PresignedUrlRequest
  try {
    const json = await req.json()
    body = presignedUrlSchema.parse(json)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: err.errors },
        { status: 400 },
      )
    }
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  // ─── Generate unique S3 key ─────────────────────────────────────────────
  const fileExt = body.fileName.split('.').pop() || 'bin'
  const uniqueName = `${crypto.randomUUID()}.${fileExt}`
  
  const contentType = body.contentFor || 'companion_photo'
  const s3Key = `${contentType}/${session.user.id}/${uniqueName}`

  // ─── Generate presigned PUT URL ──────────────────────────────────────────
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: s3Key,
    ContentType: body.contentType,
    // Metadata for organization
    Metadata: {
      'user-id': session.user.id,
      'uploaded-at': new Date().toISOString(),
      'original-name': Buffer.from(body.fileName).toString('base64'),
    },
  })

  try {
    const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 15 * 60 }) // 15 min expiry

    return NextResponse.json({
      presignedUrl,
      s3Key,
      cdnUrl: `${R2_PUBLIC_URL}/${s3Key}`,
      expiresIn: 900, // seconds
    })
  } catch (err) {
    console.error('[R2] presigned URL generation failed:', err)
    return NextResponse.json(
      { error: 'Could not generate upload URL. Try again.' },
      { status: 500 },
    )
  }
}
