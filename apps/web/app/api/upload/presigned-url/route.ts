import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { generateSignedUploadParams } from '@/lib/cloudinary'

// ─── Validation ───────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'audio/mpeg']
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

const presignedUrlSchema = z.object({
  fileName:   z.string().min(1).max(255),
  contentType: z.enum(ALLOWED_TYPES as [string, ...string[]]),
  fileSize:    z.number().min(1).max(MAX_FILE_SIZE),
  contentFor:  z.enum(['companion_photo', 'companion_video', 'story_audio']).optional(),
})

// ─── POST /api/upload/presigned-url ──────────────────────────────────────────
// Returns Cloudinary signed upload parameters for direct client → Cloudinary upload.
// The client POSTs the file directly to Cloudinary using these params, bypassing the server.
//
// Client usage:
//   const form = new FormData()
//   form.append('file', file)
//   form.append('api_key', api_key)
//   form.append('timestamp', String(timestamp))
//   form.append('signature', signature)
//   form.append('folder', folder)
//   await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, { method: 'POST', body: form })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: z.infer<typeof presignedUrlSchema>
  try {
    const json = await req.json()
    body = presignedUrlSchema.parse(json)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const isVideo    = body.contentType.startsWith('video/')
  const resourceType: 'image' | 'video' = isVideo ? 'video' : 'image'

  const folderMap: Record<string, string> = {
    companion_photo:  `blushbite/companion_photos/${session.user.id}`,
    companion_video:  `blushbite/companion_videos/${session.user.id}`,
    story_audio:      `blushbite/story_audio/${session.user.id}`,
  }
  const folder = folderMap[body.contentFor ?? 'companion_photo']

  try {
    const params = generateSignedUploadParams(folder, resourceType)
    return NextResponse.json({
      ...params,
      expiresIn: 600, // 10 minutes
    })
  } catch (err) {
    console.error('[Cloudinary] signed params failed:', err)
    return NextResponse.json({ error: 'Could not generate upload params' }, { status: 500 })
  }
}
