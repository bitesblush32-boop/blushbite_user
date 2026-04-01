import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2 } from '@/lib/r2'
import crypto from 'crypto'

// ─── PUT /api/upload/file ─────────────────────────────────────────────────────
// Backend relays upload to R2 (bypasses CORS issues)
// Browser → /api/upload/file (your backend) → R2 direct upload

export async function PUT(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contentType = req.headers.get('content-type') || 'application/octet-stream'
  const buffer = await req.arrayBuffer()

  if (buffer.byteLength > 100 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large' }, { status: 413 })
  }

  // ─── Generate S3 key ──────────────────────────────────────────────────────
  const fileExt = contentType.split('/')[1] || 'bin'
  const uuid = crypto.randomUUID()
  const s3Key = `companion_photo/${session.user.id}/${uuid}.${fileExt}`
  console.log("key",s3Key,fileExt);
  
  // ─── Upload to R2 ─────────────────────────────────────────────────────────
  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || 'blushbite-media',
        Key: s3Key,
        Body: Buffer.from(buffer),
        ContentType: contentType,
      }),
    )

    const cdnUrl = `${process.env.NEXT_PUBLIC_R2_CDN_URL}/${s3Key}`

    return NextResponse.json({
      cdnUrl,
      s3Key,
    })
  } catch (err) {
    console.error('[R2] upload failed:', err)
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Upload failed: ${errorMsg}` },
      { status: 500 },
    )
  }
}
