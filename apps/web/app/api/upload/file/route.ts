import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { uploadBuffer } from '@/lib/cloudinary'

// ─── PUT /api/upload/file ─────────────────────────────────────────────────────
// Browser → /api/upload/file (server relay) → Cloudinary
// Returns { cdnUrl, publicId, s3Key } — s3Key is an alias for publicId (backwards compat)

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contentType = req.headers.get('content-type') || 'application/octet-stream'
  const buffer      = Buffer.from(await req.arrayBuffer())

  if (buffer.byteLength > 100 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 413 })
  }

  // Determine Cloudinary resource type + folder from content-type
  const isVideo = contentType.startsWith('video/')
  const isAudio = contentType.startsWith('audio/')
  const resourceType = isVideo ? 'video' : isAudio ? 'raw' : 'image'

  const folder = isVideo
    ? `blushbite/companion_videos/${session.user.id}`
    : isAudio
    ? `blushbite/story_audio/${session.user.id}`
    : `blushbite/companion_photos/${session.user.id}`

  try {
    const { url, publicId } = await uploadBuffer(buffer, { folder, resourceType })

    return NextResponse.json({
      cdnUrl:   url,
      publicId,
      s3Key:    publicId, // backwards-compat alias — callers that use s3Key still work
    })
  } catch (err) {
    console.error('[Cloudinary] upload failed:', err)
    const msg = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
