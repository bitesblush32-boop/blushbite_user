'use client'

import { useRef } from 'react'
import { Loader2, AlertCircle, Check } from 'lucide-react'
import { useUploadToCloudinary } from '@/hooks/useUploadToCloudinary'

interface FileUploadProps {
  contentFor?: 'companion_photo' | 'companion_video' | 'story_audio'
  onSuccess?: (cdnUrl: string) => void
  maxSize?: number
  acceptedTypes?: string
  label?: string
}

/**
 * Reusable file upload component with drag-drop support
 * - Uploads directly to R2 (no server bandwidth)
 * - Shows progress bar
 * - Error handling with retry
 */
export function FileUpload({
  contentFor = 'companion_photo',
  onSuccess,
  maxSize = 100,
  acceptedTypes = 'image/jpeg,image/png,image/webp',
  label = 'Drop file here or click to upload',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { uploadFile, cancel, uploading, progress, error } = useUploadToCloudinary({
    contentFor,
    onSuccess: (result) => onSuccess?.(result.cdnUrl),
  })

  async function handleFileSelect(file: File) {
    await uploadFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="relative border-2 border-dashed border-[#1c2333] rounded-[12px] p-8 text-center cursor-pointer transition-colors hover:border-[#e8607a] hover:bg-[rgba(232,96,122,0.05)]"
    >
      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleChange}
        disabled={uploading}
        className="hidden"
      />

      {/* Idle state */}
      {!uploading && !error && (
        <button onClick={() => inputRef.current?.click()} className="w-full">
          <div className="text-[14px] text-[#eeeef0] font-medium mb-1">{label}</div>
          <div className="text-[12px] text-[#6b7280]">Max {maxSize}MB</div>
        </button>
      )}

      {/* Uploading state */}
      {uploading && (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-[#e8607a] animate-spin" />
          <div className="text-[14px] text-[#eeeef0]">Uploading...</div>
          <div className="w-full bg-[#161d2a] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#e8607a] h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button
            onClick={cancel}
            className="text-[12px] text-[#6b7280] hover:text-[#eeeef0] underline"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <div className="text-[14px] text-red-500">{error}</div>
          <button
            onClick={() => inputRef.current?.click()}
            className="text-[12px] text-[#e8607a] hover:text-[#c4485e] underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Success state (after progress completes) */}
      {!uploading && !error && progress === 100 && (
        <div className="flex flex-col items-center gap-2">
          <Check className="w-6 h-6 text-green-500" />
          <div className="text-[14px] text-green-500">Uploaded!</div>
        </div>
      )}
    </div>
  )
}
