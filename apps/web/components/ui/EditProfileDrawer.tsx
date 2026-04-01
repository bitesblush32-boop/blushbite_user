'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { FileUpload } from '@/components/FileUpload'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  displayName:  z.string().max(100).optional(),
  bio:          z.string().max(300).optional(),
  dateOfBirth:  z.string().optional(),
  country:      z.string().max(100).optional(),
  city:         z.string().max(100).optional(),
})

type FormValues = z.infer<typeof schema>

// ─── Props ────────────────────────────────────────────────────────────────────

interface EditProfileDrawerProps {
  open:     boolean
  onClose:  () => void
  onSaved:  (data: Partial<FormValues>) => void
  defaults?: Partial<FormValues>
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditProfileDrawer({
  open,
  onClose,
  onSaved,
  defaults,
}: EditProfileDrawerProps) {
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults ?? {},
  })

  const bioLength = watch('bio')?.length ?? 0

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/user/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(values),
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}))
        setSubmitError(error ?? 'Something went wrong. Try again.')
        return
      }
      const { data } = await res.json()
      onSaved(data)
      onClose()
    } catch {
      setSubmitError('Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[850]"
            style={{ background: 'rgba(0,0,0,0.60)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[860] overflow-y-auto"
            style={{
              background:   '#0d1117',
              borderTop:    '1px solid #1c2333',
              borderRadius: '20px 20px 0 0',
              maxHeight:    '92vh',
              willChange:   'transform',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            {/* Header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-[#1c2333]"
              style={{ background: '#0d1117' }}
            >
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#eeeef0' }}>
                Edit profile
              </span>
              <button
                onClick={onClose}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid #1c2333',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#6b7280', fontSize: 16,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,96,122,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="px-5 py-6 flex flex-col gap-5"
            >

              
              {/* Photo upload */}
              <div className="flex flex-col gap-[6px] mt-2">
                <label className="text-[11px] text-[#6b7280] uppercase tracking-widest">
                  Profile photo
                </label>
                <FileUpload
                  contentFor="companion_photo"
                  onSuccess={async (cdnUrl) => {
                    setPhotoUrl(cdnUrl)
                    // Auto-save photo to profile
                    try {
                      await fetch('/api/user/photos', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cdnUrl, s3Key: cdnUrl }),
                        credentials: 'include',
                      })
                    } catch (err) {
                      console.error('Failed to save photo:', err)
                    }
                  }}
                  label="Drop photo or click to upload"
                  acceptedTypes="image/jpeg,image/png,image/webp"
                />
              </div>

              {/* Display name */}
              <div className="flex flex-col gap-[6px]">
                <label className="text-[11px] text-[#6b7280] uppercase tracking-widest">
                  Display name
                </label>
                <input
                  {...register('displayName')}
                  placeholder="How you'd like to be called"
                  className="bg-[#161d2a] border border-[#1c2333] rounded-[10px] px-4 py-3 text-[13px] text-[#eeeef0] outline-none transition-colors duration-150 focus:border-[#e8607a] placeholder:text-[#4b5563]"
                />
                {errors.displayName && (
                  <span style={{ fontSize: 11, color: '#e87070' }}>{errors.displayName.message}</span>
                )}
              </div>

              {/* Bio */}
              <div className="flex flex-col gap-[6px]">
                <label className="text-[11px] text-[#6b7280] uppercase tracking-widest">
                  Bio
                </label>
                <div className="relative">
                  <textarea
                    {...register('bio')}
                    rows={3}
                    placeholder="A little about your desires…"
                    className="bg-[#161d2a] border border-[#1c2333] rounded-[10px] px-4 py-3 text-[13px] text-[#eeeef0] outline-none transition-colors duration-150 focus:border-[#e8607a] placeholder:text-[#4b5563] w-full resize-none"
                  />
                  <span
                    className="absolute bottom-2 right-3"
                    style={{ fontSize: 10, color: '#4b5563', pointerEvents: 'none' }}
                  >
                    {bioLength}/300
                  </span>
                </div>
                {errors.bio && (
                  <span style={{ fontSize: 11, color: '#e87070' }}>{errors.bio.message}</span>
                )}
              </div>

              {/* Date of birth */}
              <div className="flex flex-col gap-[6px]">
                <label className="text-[11px] text-[#6b7280] uppercase tracking-widest">
                  Date of birth
                </label>
                <input
                  {...register('dateOfBirth')}
                  type="date"
                  className="bg-[#161d2a] border border-[#1c2333] rounded-[10px] px-4 py-3 text-[13px] text-[#eeeef0] outline-none transition-colors duration-150 focus:border-[#e8607a] placeholder:text-[#4b5563]"
                  style={{ colorScheme: 'dark' }}
                />
                {errors.dateOfBirth && (
                  <span style={{ fontSize: 11, color: '#e87070' }}>{errors.dateOfBirth.message}</span>
                )}
              </div>

              {/* Country */}
              <div className="flex flex-col gap-[6px]">
                <label className="text-[11px] text-[#6b7280] uppercase tracking-widest">
                  Country
                </label>
                <input
                  {...register('country')}
                  type="text"
                  placeholder="e.g. India"
                  className="bg-[#161d2a] border border-[#1c2333] rounded-[10px] px-4 py-3 text-[13px] text-[#eeeef0] outline-none transition-colors duration-150 focus:border-[#e8607a] placeholder:text-[#4b5563]"
                />
                {errors.country && (
                  <span style={{ fontSize: 11, color: '#e87070' }}>{errors.country.message}</span>
                )}
              </div>

              {/* City / Area */}
              <div className="flex flex-col gap-[6px]">
                <label className="text-[11px] text-[#6b7280] uppercase tracking-widest">
                  City / Area
                </label>
                <input
                  {...register('city')}
                  type="text"
                  placeholder="e.g. Mumbai, Bandra"
                  className="bg-[#161d2a] border border-[#1c2333] rounded-[10px] px-4 py-3 text-[13px] text-[#eeeef0] outline-none transition-colors duration-150 focus:border-[#e8607a] placeholder:text-[#4b5563]"
                />
                {errors.city && (
                  <span style={{ fontSize: 11, color: '#e87070' }}>{errors.city.message}</span>
                )}
              </div>

              {/* Submit error */}
              {submitError && (
                <p style={{ fontSize: 12, color: '#e87070', textAlign: 'center' }}>
                  {submitError}
                </p>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 mt-2 rounded-[10px] py-[12px] text-[13.5px] font-medium text-white cursor-pointer transition-all duration-200"
                style={{
                  background:    submitting ? '#c4485e' : '#e8607a',
                  border:        'none',
                  opacity:       submitting ? 0.8 : 1,
                  pointerEvents: submitting ? 'none' : 'auto',
                }}
                onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = '#c4485e' }}
                onMouseLeave={e => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = '#e8607a' }}
              >
                {submitting ? (
                  <>
                    <span
                      style={{
                        width: 20, height: 20, borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.2)',
                        borderTopColor: '#fff',
                        animation: 'spin 0.7s linear infinite',
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    Saving…
                  </>
                ) : (
                  'Save changes'
                )}
              </button>

            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
