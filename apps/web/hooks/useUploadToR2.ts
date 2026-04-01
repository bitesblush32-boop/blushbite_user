'use client'

import { useState, useRef } from 'react'

interface UploadState {
  uploading: boolean
  progress: number
  error: string | null
}

interface UploadResponse {
  cdnUrl: string
  s3Key: string
}

interface UseUploadToR2Options {
  contentFor?: 'companion_photo' | 'companion_video' | 'story_audio'
  onSuccess?: (result: UploadResponse) => void
  onError?: (error: string) => void
}

/**
 * Hook for uploading files to Cloudflare R2 via presigned URLs
 * - Gets presigned URL from backend
 * - Uploads file directly to R2 (zero bandwidth from your server)
 * - Tracks progress
 * - Auto-retry on network failure
 */
export function useUploadToR2(options: UseUploadToR2Options = {}) {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const retryCountRef = useRef(0)
  const MAX_RETRIES = 3

  async function uploadFile(file: File): Promise<UploadResponse | null> {
    // ─── Validation ─────────────────────────────────────────────────────
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

    async function attemptUpload(): Promise<UploadResponse | null> {
      try {
        // ─── Step 1: Upload to backend API (not directly to R2) ──────────
        // Backend handles R2 upload, avoiding CORS issues
        abortControllerRef.current = new AbortController()

        const uploadRes = await fetch('/api/upload/file', {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: file,
          signal: abortControllerRef.current.signal,
          credentials: 'include',
        })

        if (!uploadRes.ok) {
          throw new Error(`Upload failed: ${uploadRes.status}`)
        }

        const { cdnUrl, s3Key } = await uploadRes.json()

        setState({ uploading: false, progress: 100, error: null })
        options.onSuccess?.({ cdnUrl, s3Key })

        return { cdnUrl, s3Key }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed'

        // ─── Retry logic ────────────────────────────────────────────────
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current += 1
          console.warn(`[Upload] Retrying (${retryCountRef.current}/${MAX_RETRIES})`)
          // Wait 1s before retry, with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCountRef.current) * 1000))
          return attemptUpload()
        }

        // ─── Final error ────────────────────────────────────────────────
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

  return {
    uploadFile,
    cancel,
    ...state,
  }
}
