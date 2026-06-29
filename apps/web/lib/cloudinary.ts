import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export { cloudinary }

export type CloudinaryResourceType = 'image' | 'video' | 'raw' | 'auto'

// ─── Upload a Buffer to Cloudinary ────────────────────────────────────────────
// Returns the secure CDN URL and public_id (used as storage key in DB)

export async function uploadBuffer(
  buffer: Buffer,
  options: {
    folder: string
    publicId?: string
    resourceType?: CloudinaryResourceType
    transformation?: Record<string, unknown>[]
  }
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.publicId,
        resource_type: options.resourceType ?? 'auto',
        transformation: options.transformation,
        overwrite: true,
      },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('Cloudinary upload failed'))
        resolve({ url: result.secure_url, publicId: result.public_id })
      }
    )
    uploadStream.end(buffer)
  })
}

// ─── Upload a remote URL to Cloudinary ────────────────────────────────────────

export async function uploadFromUrl(
  url: string,
  options: {
    folder: string
    publicId?: string
    resourceType?: CloudinaryResourceType
  }
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(url, {
    folder: options.folder,
    public_id: options.publicId,
    resource_type: options.resourceType ?? 'auto',
    overwrite: true,
  })
  return { url: result.secure_url, publicId: result.public_id }
}

// ─── Delete an asset by public_id ─────────────────────────────────────────────

export async function deleteAsset(
  publicId: string,
  resourceType: CloudinaryResourceType = 'image'
) {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}

// ─── Extract public_id from a Cloudinary URL ──────────────────────────────────
// e.g. https://res.cloudinary.com/cloud/image/upload/blushbite/avatars/user-123.webp
//   → blushbite/avatars/user-123

export function extractPublicId(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/)
  return match ? match[1] : null
}

// ─── Generate signed upload params for direct client → Cloudinary upload ──────

export function generateSignedUploadParams(
  folder: string,
  resourceType: 'image' | 'video' = 'image'
): {
  signature: string
  timestamp: number
  folder: string
  api_key: string
  cloud_name: string
  resource_type: string
} {
  const timestamp = Math.round(Date.now() / 1000)
  const paramsToSign: Record<string, unknown> = { folder, timestamp }
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  )
  return {
    signature,
    timestamp,
    folder,
    api_key: process.env.CLOUDINARY_API_KEY!,
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    resource_type: resourceType,
  }
}
