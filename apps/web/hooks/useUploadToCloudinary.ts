'use client'

import { useState, useRef } from 'react'

interface UploadState {
  uploading: boolean
  progress:  number
  error:     string | null
}

export interface UploadResult {
  cdnUrl:   string
  publicId: string
  s3Key:    string // alias for publicId — backwards compat
}

interface UseUploadToCloudinaryOptions {
  contentFor?: 'companion_photo' | 'companion_video' | 'story_audio'
  onSuccess?:  (result: UploadResult) => void
  onError?:    (error: string) => void
}

/**
 * Hook for uploading files to Cloudinary via the server relay endpoint.
 * Browser → /api/upload/file (server) → Cloudinary
 *
 * Returns { cdnUrl, publicId, s3Key } — s3Key is an alias for publicId
 * so existing callers that destructure s3Key continue to work unchanged.
 */
export function useUploadToCloudinary(options: UseUploadToCloudinaryOptions = {}) {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress:  0,
    error:     null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const retryCountRef      = useRef(0)
  const MAX_RETRIES        = 3

  async function uploadFile(file: File): Promise<UploadResult | null> {
    if (!file) {
      const err = 'No file selected'
      setState(s => ({ ...s, error: err }))
      options.onError?.(err)
      return null
    }

    if (file.size > 100 * 1024 * 1024) {
      const err = 'File too large (max 100MB)'
      setState(s => ({ ...s, error: err }))
      options.onError?.(err)
      return null
    }

    setState({ uploading: true, progress: 0, error: null })
    retryCountRef.current = 0

    async function attemptUpload(): Promise<UploadResult | null> {
      try {
        abortControllerRef.current = new AbortController()

        const uploadRes = await fetch('/api/upload/file', {
          method:  'PUT',
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          body:    file,
          signal:  abortControllerRef.current.signal,
          credentials: 'include',
        })

        if (!uploadRes.ok) {
          throw new Error(`Upload failed: ${uploadRes.status}`)
        }

        const { cdnUrl, publicId, s3Key } = await uploadRes.json()
        const result: UploadResult = {
          cdnUrl,
          publicId: publicId ?? s3Key,
          s3Key:    s3Key ?? publicId,
        }

        setState({ uploading: false, progress: 100, error: null })
        options.onSuccess?.(result)
        return result
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed'

        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current += 1
          console.warn(`[Upload] Retrying (${retryCountRef.current}/${MAX_RETRIES})`)
          await new Promise(resolve =>
            setTimeout(resolve, Math.pow(2, retryCountRef.current) * 1000)
          )
          return attemptUpload()
        }

        setState({ uploading: false, progress: 0, error: errorMsg })
        options.onError?.(errorMsg)
        console.error('[Upload] failed:', errorMsg)
        return null
      }
    }

    return attemptUpload()
  }

  function cancel() {
    abortControllerRef.current?.abort()
    setState({ uploading: false, progress: 0, error: null })
  }

  return { uploadFile, cancel, ...state }
}
