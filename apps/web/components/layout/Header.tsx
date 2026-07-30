'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Camera,
  ChevronRight,
  HelpCircle,
  ImagePlus,
  Loader2,
  MapPin,
  Menu,
  Pencil,
  PenLine,
  Plus,
  Shield,
  Video,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'
import { useUploadToCloudinary } from '@/hooks/useUploadToCloudinary'
import SlidePanel from '@/components/ui/SlidePanel'
import NotificationsPanel from '@/components/ui/NotificationsPanel'
import { useNotifications } from '@/hooks/useNotifications'

// ─── PostMenu — companion create sheet ───────────────────────────────────────

type PostMenuView = 'menu' | 'photo' | 'video'

function PostMenu({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [view, setView] = useState<PostMenuView>('menu')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const { uploadFile, uploading } = useUploadToCloudinary()

  const resetUpload = () => {
    setUploadError(null)
    setPhotoFile(null)
    setPhotoPreview(null)
    setVideoFile(null)
    setSuccess(false)
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File must be under 5MB')
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setUploadError(null)
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('File must be under 50MB')
      return
    }
    const el = document.createElement('video')
    el.preload = 'metadata'
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(el.src)
      if (el.duration > 10) {
        setUploadError('Video must be 10 seconds or less')
        return
      }
      setVideoFile(file)
      setUploadError(null)
    }
    el.src = URL.createObjectURL(file)
  }

  const handleUploadPhoto = async () => {
    if (!photoFile || saving || uploading) return
    setSaving(true)
    setUploadError(null)
    try {
      const result = await uploadFile(photoFile)
      if (!result) throw new Error('Upload failed')
      const res = await fetch('/api/companions/media/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: result.cdnUrl, storage_key: result.s3Key }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Failed to save')
      }
      setSuccess(true)
      setTimeout(onClose, 1500)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setSaving(false)
    }
  }

  const handleUploadVideo = async () => {
    if (!videoFile || saving || uploading) return
    setSaving(true)
    setUploadError(null)
    try {
      const duration = await new Promise<number>((resolve) => {
        const el = document.createElement('video')
        el.preload = 'metadata'
        el.onloadedmetadata = () => {
          URL.revokeObjectURL(el.src)
          resolve(Math.round(el.duration))
        }
        el.src = URL.createObjectURL(videoFile)
      })
      const result = await uploadFile(videoFile)
      if (!result) throw new Error('Upload failed')
      const res = await fetch('/api/companions/media/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: result.cdnUrl,
          storage_key: result.s3Key,
          duration_seconds: duration,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Failed to save')
      }
      setSuccess(true)
      setTimeout(onClose, 1500)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setSaving(false)
    }
  }

  const busy = uploading || saving

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[850]"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: 300, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 300, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-0 left-0 right-0 z-[860]"
        style={{ maxWidth: 480, margin: '0 auto' }}
      >
        <div
          className="bg-[#0d1117] border border-[#1c2333] rounded-t-[24px] overflow-y-auto"
          style={{ maxHeight: '70vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="rounded-full bg-[#1c2333]" style={{ width: 40, height: 4 }} />
          </div>

          <AnimatePresence mode="wait">
            {view === 'menu' && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {/* Option: Write a confession */}
                <button
                  className="w-full flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.04] active:bg-white/[0.06]"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onClick={() => {
                    onClose()
                    router.push('/create')
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-[#161d2a] border border-[#1c2333] flex items-center justify-center flex-shrink-0">
                    <PenLine size={18} color="#e8607a" />
                  </div>
                  <div>
                    <div className="text-[15px] text-[#eeeef0] font-medium leading-snug">
                      Write a confession
                    </div>
                    <div className="text-[12px] text-[#6b7280] mt-[2px]">
                      Anonymous · dark canvas · paginated
                    </div>
                  </div>
                </button>

                {/* Option: Write a story */}
                <button
                  className="w-full flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.04] active:bg-white/[0.06]"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onClick={() => {
                    onClose()
                    router.push('/create?type=story')
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-[#161d2a] border border-[#1c2333] flex items-center justify-center flex-shrink-0">
                    <BookOpen size={18} color="#e8607a" />
                  </div>
                  <div>
                    <div className="text-[15px] text-[#eeeef0] font-medium leading-snug">
                      Write a story
                    </div>
                    <div className="text-[12px] text-[#6b7280] mt-[2px]">
                      Literary · longer form · editorial
                    </div>
                  </div>
                </button>

                {/* Option: Add a photo */}
                <button
                  className="w-full flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.04] active:bg-white/[0.06]"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onClick={() => setView('photo')}
                >
                  <div className="w-10 h-10 rounded-full bg-[#161d2a] border border-[#1c2333] flex items-center justify-center flex-shrink-0">
                    <Camera size={18} color="#c9a96e" />
                  </div>
                  <div>
                    <div className="text-[15px] text-[#eeeef0] font-medium leading-snug">
                      Add a photo
                    </div>
                    <div className="text-[12px] text-[#6b7280] mt-[2px]">
                      Photos appear on your profile & feed
                    </div>
                  </div>
                </button>

                {/* Option: Add a short video */}
                <button
                  className="w-full flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.04] active:bg-white/[0.06]"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onClick={() => setView('video')}
                >
                  <div className="w-10 h-10 rounded-full bg-[#161d2a] border border-[#1c2333] flex items-center justify-center flex-shrink-0">
                    <Video size={18} color="#c9a96e" />
                  </div>
                  <div>
                    <div className="text-[15px] text-[#eeeef0] font-medium leading-snug">
                      Add a short video
                    </div>
                    <div className="text-[12px] text-[#6b7280] mt-[2px]">
                      Up to 10 seconds · non-nude
                    </div>
                  </div>
                </button>

                {/* Cancel */}
                <button
                  className="w-full py-4 transition-colors hover:bg-white/[0.03]"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
                  }}
                  onClick={onClose}
                >
                  <span className="text-[13px] text-[#6b7280]">Cancel</span>
                </button>
              </motion.div>
            )}

            {(view === 'photo' || view === 'video') && (
              <motion.div
                key={view}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="px-6"
                style={{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom))' }}
              >
                {/* Back + heading */}
                <div className="flex items-center gap-3 mb-6 mt-2">
                  <button
                    onClick={() => {
                      setView('menu')
                      resetUpload()
                    }}
                    className="flex items-center justify-center rounded-full transition-colors hover:bg-white/[0.06]"
                    style={{
                      width: 36,
                      height: 36,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                    }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div
                    className="text-[16px] text-[#eeeef0]"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {view === 'photo' ? 'Add a photo' : 'Add a short video'}
                  </div>
                </div>

                {success ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.15 }}
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[20px]"
                      style={{ background: '#e8607a' }}
                    >
                      ✓
                    </motion.div>
                    <p className="text-[14px] text-[#e8607a] text-center">
                      {view === 'photo'
                        ? 'Photo uploaded — pending review'
                        : 'Video uploaded — pending review'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Hidden file inputs */}
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/quicktime"
                      className="hidden"
                      onChange={handleVideoSelect}
                    />

                    {/* Upload zone / preview */}
                    {view === 'photo' && photoPreview ? (
                      <div className="flex flex-col items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="rounded-[12px] object-cover"
                          style={{ maxHeight: 220, maxWidth: '100%' }}
                        />
                        <button
                          onClick={() => {
                            setPhotoFile(null)
                            setPhotoPreview(null)
                          }}
                          className="text-[12px] text-[#6b7280] underline"
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Choose a different photo
                        </button>
                      </div>
                    ) : view === 'video' && videoFile ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-full rounded-[12px] border border-[#1c2333] bg-[#111620] flex items-center justify-center px-5 py-5">
                          <span className="text-[13px] text-[#6b7280] text-center">
                            {videoFile.name}
                          </span>
                        </div>
                        <button
                          onClick={() => setVideoFile(null)}
                          className="text-[12px] text-[#6b7280] underline"
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Choose a different video
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          (view === 'photo' ? photoInputRef : videoInputRef).current?.click()
                        }
                        className="w-full flex flex-col items-center justify-center gap-3 rounded-[16px] transition-colors hover:border-[rgba(232,96,122,0.3)]"
                        style={{
                          minHeight: 120,
                          padding: 40,
                          background: '#111620',
                          border: '2px dashed #1c2333',
                          cursor: 'pointer',
                        }}
                      >
                        <ImagePlus size={24} color="#6b7280" />
                        <span className="text-[13px] text-[#6b7280]">Tap to select</span>
                      </button>
                    )}

                    {uploadError && (
                      <p className="text-[12px] text-[#e8607a] mt-3 text-center">{uploadError}</p>
                    )}

                    {(view === 'photo' ? photoFile : videoFile) && (
                      <button
                        onClick={view === 'photo' ? handleUploadPhoto : handleUploadVideo}
                        disabled={busy}
                        className="w-full mt-5 flex items-center justify-center gap-2 rounded-[10px] text-[14px] font-medium text-white transition-all"
                        style={{
                          padding: '13px 22px',
                          background: busy ? '#c4485e' : '#e8607a',
                          border: 'none',
                          cursor: busy ? 'not-allowed' : 'pointer',
                          opacity: busy ? 0.8 : 1,
                          boxShadow: busy ? 'none' : '0 6px 20px rgba(232,96,122,0.22)',
                        }}
                      >
                        {busy ? (
                          <>
                            <Loader2 size={16} className="animate-spin" /> Uploading…
                          </>
                        ) : (
                          'Upload →'
                        )}
                      </button>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

const USERNAME_RE = /^[a-zA-Z0-9_.\-]+$/

const editProfileSchema = z.object({
  alias: z
    .string()
    .min(2, 'At least 2 characters.')
    .max(30, 'Max 30 characters.')
    .regex(USERNAME_RE, 'Only letters, numbers, _ - . — no spaces or emojis.')
    .optional()
    .or(z.literal('')),
  bio: z.string().max(300).optional(),
  dateOfBirth: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true
      const dob = new Date(val)
      const cutoff = new Date()
      cutoff.setFullYear(cutoff.getFullYear() - 18)
      return dob <= cutoff
    }, 'You must be 18 or older.'),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
})

type EditProfileFormValues = z.infer<typeof editProfileSchema>

interface UserProfile {
  id: string
  email: string
  name: string | null
  image: string | null
  alias: string | null
  created_at: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  date_of_birth: string | null
  country: string | null
  city: string | null
  gender: string | null
  desired_genders: string[] | null
  vibes: string[] | null
  platform_role: string | null
}

export default function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [plusHover, setPlusHover] = useState(false)
  const [showPostMenu, setShowPostMenu] = useState(false)

  const isCompanion = false
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [aliasWarning, setAliasWarning] = useState<string | null>(null)
  const [locationDetecting, setLocationDetecting] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const avatarUrl = useUIStore((s) => s.avatarUrl)
  const setAvatarUrl = useUIStore((s) => s.setAvatarUrl)
  const dreamer = useUIStore((s) => s.dreamer)
  const dreamerLoading = useUIStore((s) => s.dreamerLoading)
  const openAuthModal = useUIStore((s) => s.openAuthModal)
  const community = useUIStore((s) => s.community)
  const { unreadCount } = useNotifications()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: profile
      ? {
          alias: profile.alias ?? undefined,
          bio: profile.bio ?? undefined,
          dateOfBirth: profile.date_of_birth ?? undefined,
          country: profile.country ?? undefined,
          city: profile.city ?? undefined,
        }
      : {},
  })

  useEffect(() => {
    if (!editProfileOpen || !dreamer) return
    setAliasWarning(null)
    setLocationError(null)
    fetch('/api/users/profile')
      .then((r) => r.json())
      .then((json) => {
        if (!json.data) return
        setProfile(json.data)
        reset({
          alias: json.data.alias ?? undefined,
          bio: json.data.bio ?? undefined,
          dateOfBirth: json.data.date_of_birth ?? undefined,
          country: json.data.country ?? undefined,
          city: json.data.city ?? undefined,
        })
      })
      .catch(() => {})
  }, [editProfileOpen, dreamer, reset])
  const router = useRouter()
  const pathname = usePathname()
  const isProfile = pathname === '/profile' || (isCompanion && pathname === '/companion/profile')

  const alias = dreamer?.alias ? `@${dreamer.alias}` : (dreamer?.email ?? '@guest')
  const initials = dreamer?.alias ? dreamer.alias.slice(0, 2).toUpperCase() : 'BB'

  useEffect(() => {
    setSettingsOpen(false)
  }, [pathname])

  const menuItems: Array<{
    label: string
    icon: React.ComponentType<any>
    tone: 'default' | 'danger'
    href?: string
    onClick?: () => void
  }> = [
    ...(dreamer
      ? [
          {
            label: 'Edit profile',
            icon: Pencil,
            tone: 'default' as const,
            onClick: () => setEditProfileOpen(true),
          },
        ]
      : []),
    {
      label: 'Privacy & safety',
      href: '/privacy',
      icon: Shield,
      tone: 'default' as const,
    },
    {
      label: 'Help & support',
      href: '/help',
      icon: HelpCircle,
      tone: 'default' as const,
    },
    ...(dreamer
      ? [
          {
            label: 'Sign out',
            icon: ArrowLeft,
            tone: 'danger' as const,
            onClick: async () => {
              await fetch('/api/users/auth/logout', { method: 'POST' })
              window.location.href = '/'
            },
          },
        ]
      : []),
  ]

  const profileAccent = avatarUrl
    ? {
        backgroundImage: `url(${avatarUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: 'linear-gradient(135deg,#e8607a,#9b5fe0)',
        color: '#fff',
      }

  const aliasValue = watch('alias') ?? ''
  const locationCountry = watch('country') ?? ''
  const locationCity = watch('city') ?? ''
  const bioLength = watch('bio')?.length ?? 0

  const maxDob = useMemo(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 18)
    return d.toISOString().slice(0, 10)
  }, [])

  useEffect(() => {
    if (!aliasValue) {
      setAliasWarning(null)
      return
    }
    if (/\s/.test(aliasValue)) {
      setAliasWarning('No spaces allowed.')
    } else if (/[^a-zA-Z0-9_.\-]/.test(aliasValue)) {
      setAliasWarning('Only letters, numbers, _ - . are allowed — no emojis or special characters.')
    } else {
      setAliasWarning(null)
    }
  }, [aliasValue])

  async function detectLocation() {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported on this device.')
      return
    }
    setLocationDetecting(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch('/api/users/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          })
          if (!res.ok) throw new Error('Failed to detect location.')
          const json = await res.json()
          if (json.data?.country) setValue('country', json.data.country)
          if (json.data?.city) setValue('city', json.data.city)
        } catch {
          setLocationError('Could not detect location. Try again.')
        } finally {
          setLocationDetecting(false)
        }
      },
      () => {
        setLocationError('Location access denied. Please allow access and try again.')
        setLocationDetecting(false)
      }
    )
  }

  async function onSubmitEditProfile(values: EditProfileFormValues) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload = {
        ...values,
        alias: values.alias ? values.alias.replace(/^@/, '') : undefined,
      }
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}))
        setSubmitError(error ?? 'Something went wrong. Try again.')
        return
      }
      const { data } = await res.json()
      setProfile(data ?? null)
      if (data?.avatar_url) setAvatarUrl(data.avatar_url)
      setEditProfileOpen(false)
    } catch {
      setSubmitError('Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <header
        className="bb-header fixed top-0 left-0 right-0 z-[900] border-b border-[#1c2333]"
        style={{
          background: 'rgba(7,9,15,0.82)',
          backdropFilter: 'blur(20px)',
          willChange: 'transform',
          height: 75,
        }}
      >
        {/* max-width container with design-system padding */}
        <div
          className="max-w-[1400px] mx-auto px-5 md:px-10"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '100%',
            gap: 16,
          }}
        >
          {/* ── Left — logo ──────────────────────────────────────────────── */}
          <Link href="/" className="flex-shrink-0 block" aria-label="BlushBite home">
            <Image
              src="/logo_light.png"
              alt="BlushBite"
              width={120}
              height={44}
              priority
              className="w-[76px] h-auto md:w-[100px]"
              style={{ objectFit: 'contain', objectPosition: 'left center', display: 'block' }}
            />
          </Link>

          {/* ── Center — nav links (desktop) ─────────────────────────────── */}
          <div className="hidden md:flex flex-1 justify-center items-center gap-6">
            {/* Community pill — shows active device community */}
            {community && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 11px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: 0.2,
                  border:
                    community === 'female'
                      ? '1px solid rgba(232,96,122,0.35)'
                      : community === 'male'
                        ? '1px solid rgba(96,165,250,0.35)'
                        : '1px solid rgba(192,132,252,0.35)',
                  color:
                    community === 'female'
                      ? '#e8607a'
                      : community === 'male'
                        ? '#60a5fa'
                        : '#c084fc',
                  background:
                    community === 'female'
                      ? 'rgba(232,96,122,0.08)'
                      : community === 'male'
                        ? 'rgba(96,165,250,0.08)'
                        : 'rgba(192,132,252,0.08)',
                }}
              >
                {community === 'female' ? '♀' : community === 'male' ? '♂' : '⚧'}{' '}
                {community === 'female' ? 'Female' : community === 'male' ? 'Male' : 'TS'}
              </span>
            )}

            {/* Advertise — always visible */}
            <Link
              href="/advertise"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 11px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: 0.2,
                textDecoration: 'none',
                color: '#f3f4f6',
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.04)',
                transition: 'color 0.15s, border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.color = '#e8607a'
                ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(232,96,122,0.35)'
                ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(232,96,122,0.08)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.color = '#f3f4f6'
                ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.14)'
                ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)'
              }}
            >
              Advertise
            </Link>

            {/* For Companions — logged-out only */}
            {!dreamer && !dreamerLoading && (
              <Link
                href="https://blushbite.live"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 11px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: 0.2,
                  textDecoration: 'none',
                  color: '#f3f4f6',
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(255,255,255,0.04)',
                  transition: 'color 0.15s, border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.color = '#e8607a'
                  ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(232,96,122,0.35)'
                  ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(232,96,122,0.08)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.color = '#f3f4f6'
                  ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.14)'
                  ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)'
                }}
              >
                For Companions
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  style={{ opacity: 0.5 }}
                >
                  <path
                    d="M1 9L9 1M9 1H3M9 1V7"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            )}
          </div>

          {/* ── Right — auth buttons / icon actions ──────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {!dreamerLoading && !dreamer ? (
              /* ── Not signed in — Sign in (ghost) + Enter (filled) ── */
              <>
                {/* "Sign in" hidden on xs, visible sm+ */}
                <button
                  type="button"
                  onClick={() => openAuthModal()}
                  className="hidden sm:flex items-center"
                  style={{
                    height: 36,
                    padding: '0 18px',
                    background: 'transparent',
                    border: '1px solid #1c2333',
                    borderRadius: 8,
                    color: '#eeeef0',
                    fontSize: 13,
                    fontWeight: 400,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    letterSpacing: 0.1,
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor =
                      'rgba(232,96,122,0.35)'
                    ;(e.currentTarget as HTMLButtonElement).style.color = '#e8607a'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#1c2333'
                    ;(e.currentTarget as HTMLButtonElement).style.color = '#eeeef0'
                  }}
                >
                  Sign in
                </button>
                {/* "Enter" — always visible, filled rose */}
                <button
                  type="button"
                  onClick={() => openAuthModal()}
                  style={{
                    height: 36,
                    padding: '0 20px',
                    background: '#e8607a',
                    border: 'none',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    letterSpacing: 0.2,
                    boxShadow: '0 0 16px rgba(232,96,122,0.30)',
                    transition: 'opacity 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.opacity = '0.9'
                    ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
                      '0 0 24px rgba(232,96,122,0.45)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.opacity = '1'
                    ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
                      '0 0 16px rgba(232,96,122,0.30)'
                  }}
                >
                  Enter
                </button>
              </>
            ) : isProfile ? (
              /* ── Signed in + profile page — Plus + Menu ── */
              <>
                <button
                  type="button"
                  aria-label="Write a confession"
                  onClick={() => router.push('/create')}
                  onMouseEnter={() => setPlusHover(true)}
                  onMouseLeave={() => setPlusHover(false)}
                  style={{
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: plusHover ? 'rgba(232,96,122,0.10)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  <Plus
                    size={24}
                    strokeWidth={2}
                    color={plusHover ? '#e8607a' : '#6b7280'}
                    style={{ transition: 'color 0.15s' }}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="flex items-center justify-center rounded-full transition-all duration-150"
                  style={{
                    width: 44,
                    height: 44,
                    background: 'transparent',
                    border: 'none',
                    color: settingsOpen ? '#e8607a' : '#6b7280',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(232,96,122,0.10)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  }}
                >
                  <Menu size={22} strokeWidth={1.5} />
                </button>
              </>
            ) : (
              /* ── Signed in + other pages — Plus + Bell ── */
              <>
                <button
                  type="button"
                  aria-label="Write a confession"
                  onClick={() => router.push('/create')}
                  onMouseEnter={() => setPlusHover(true)}
                  onMouseLeave={() => setPlusHover(false)}
                  style={{
                    width: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: plusHover ? 'rgba(232,96,122,0.10)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  <Plus
                    size={24}
                    strokeWidth={2}
                    color={plusHover ? '#e8607a' : '#6b7280'}
                    style={{ transition: 'color 0.15s' }}
                  />
                </button>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => router.push('/notifications')}
                    className="flex items-center justify-center rounded-full transition-all duration-150"
                    style={{
                      width: 44,
                      height: 44,
                      background:
                        pathname === '/notifications' ? 'rgba(232,96,122,0.10)' : 'transparent',
                      border: 'none',
                      color: pathname === '/notifications' ? '#e8607a' : '#6b7280',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLButtonElement).style.background =
                        'rgba(232,96,122,0.10)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLButtonElement).style.background =
                        pathname === '/notifications' ? 'rgba(232,96,122,0.10)' : 'transparent'
                    }}
                  >
                    <Bell size={22} strokeWidth={1.5} />
                  </button>
                  <AnimatePresence>
                    {unreadCount > 0 && (
                      <motion.span
                        key="badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                        style={{
                          position: 'absolute',
                          top: -3,
                          right: -3,
                          minWidth: 16,
                          height: 16,
                          borderRadius: 8,
                          background: '#e8607a',
                          border: '2px solid #07090f',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 9,
                          fontWeight: 700,
                          color: '#fff',
                          lineHeight: 1,
                          padding: '0 3px',
                          pointerEvents: 'none',
                        }}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        </div>

        <SlidePanel
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          title="Profile settings"
          headerSlot={
            <div className="mt-2 flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1c2333] text-[11px] font-semibold"
                style={profileAccent}
              >
                {!avatarUrl ? initials : null}
              </span>
              <div>
                <p className="text-[13px] text-[#eeeef0]">{alias}</p>
                <p className="text-[11px] text-[#4b5563]">
                  Manage privacy, support, and account actions.
                </p>
              </div>
            </div>
          }
        >
          <div className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isDanger = item.tone === 'danger'
              const content = (
                <>
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-[12px] border"
                    style={{
                      borderColor: isDanger ? 'rgba(232,112,112,0.18)' : '#1c2333',
                      background: isDanger ? 'rgba(232,112,112,0.08)' : '#111620',
                      color: isDanger ? '#e87070' : '#e8607a',
                    }}
                  >
                    <Icon size={18} strokeWidth={1.8} />
                  </span>
                  <span className="flex-1 text-left">
                    <span
                      className="block text-[14px]"
                      style={{ color: isDanger ? '#e87070' : '#eeeef0' }}
                    >
                      {item.label}
                    </span>
                    <span className="block pt-1 text-[12px] text-[#4b5563]">
                      {isDanger
                        ? 'End this session securely.'
                        : 'Open this screen in a full-page view.'}
                    </span>
                  </span>
                  {!isDanger && <ChevronRight size={18} color="#4b5563" />}
                </>
              )

              if (item.href) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setSettingsOpen(false)}
                    className="flex items-center gap-3 rounded-[16px] border border-[#1c2333] bg-[#111620] px-4 py-3 transition-colors duration-150 hover:border-white/10 hover:bg-white/[0.03]"
                  >
                    {content}
                  </Link>
                )
              }

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setSettingsOpen(false)
                    item.onClick?.()
                  }}
                  className="flex items-center gap-3 rounded-[16px] border px-4 py-3 text-left transition-colors duration-150"
                  style={{
                    borderColor: item.label === 'Edit profile' ? '#1c2333' : '#2a1f24',
                    background:
                      item.label === 'Edit profile' ? '#111620' : 'rgba(232,112,112,0.05)',
                  }}
                >
                  {content}
                </button>
              )
            })}
          </div>
        </SlidePanel>

        <SlidePanel
          open={editProfileOpen}
          onClose={() => setEditProfileOpen(false)}
          title="Edit profile"
          widthClassName="md:w-[480px]"
        >
          <form onSubmit={handleSubmit(onSubmitEditProfile)} className="flex flex-col gap-5">
            {/* Username */}
            <div className="flex flex-col gap-[6px]">
              <label className="text-[11px] text-[#6b7280] uppercase tracking-widest">
                Username
              </label>
              <input
                {...register('alias')}
                placeholder="yourname"
                maxLength={30}
                className="bg-[#161d2a] border border-[#1c2333] rounded-[10px] px-4 py-3 text-[13px] text-[#eeeef0] outline-none transition-colors duration-150 focus:border-[#e8607a] placeholder:text-[#4b5563] w-full"
              />
              {aliasWarning && (
                <span style={{ fontSize: 11, color: '#e87070' }}>{aliasWarning}</span>
              )}
              {!aliasWarning && errors.alias && (
                <span style={{ fontSize: 11, color: '#e87070' }}>{errors.alias.message}</span>
              )}
            </div>

            {/* Bio */}
            <div className="flex flex-col gap-[6px]">
              <label className="text-[11px] text-[#6b7280] uppercase tracking-widest">Bio</label>
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
                max={maxDob}
                className="bg-[#161d2a] border border-[#1c2333] rounded-[10px] px-4 py-3 text-[13px] text-[#eeeef0] outline-none transition-colors duration-150 focus:border-[#e8607a] placeholder:text-[#4b5563] w-full"
                style={{ colorScheme: 'dark' }}
              />
              {errors.dateOfBirth && (
                <span style={{ fontSize: 11, color: '#e87070' }}>{errors.dateOfBirth.message}</span>
              )}
            </div>

            {/* Location — auto-detected only */}
            <div className="flex flex-col gap-[6px]">
              <label className="text-[11px] text-[#6b7280] uppercase tracking-widest">
                Location
              </label>
              {/* Hidden fields so RHF submits country/city values */}
              <input type="hidden" {...register('country')} />
              <input type="hidden" {...register('city')} />

              {locationCountry || locationCity ? (
                <div className="flex items-center gap-2 px-4 py-3 rounded-[10px] bg-[#161d2a] border border-[#1c2333]">
                  <MapPin size={14} color="#e8607a" style={{ flexShrink: 0 }} />
                  <span className="text-[13px] text-[#eeeef0] flex-1">
                    {[locationCity, locationCountry].filter(Boolean).join(', ')}
                  </span>
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={locationDetecting}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: locationDetecting ? 'not-allowed' : 'pointer',
                      color: '#6b7280',
                      fontSize: 11,
                      padding: 0,
                      opacity: locationDetecting ? 0.5 : 1,
                      flexShrink: 0,
                    }}
                  >
                    {locationDetecting ? 'Detecting…' : 'Update'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={locationDetecting}
                  className="flex items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#1c2333] bg-[#161d2a] px-4 py-3 text-[13px] w-full transition-colors duration-150 hover:border-[rgba(232,96,122,0.3)]"
                  style={{
                    color: locationDetecting ? '#6b7280' : '#9ca3af',
                    cursor: locationDetecting ? 'not-allowed' : 'pointer',
                  }}
                >
                  <MapPin size={14} color={locationDetecting ? '#6b7280' : '#e8607a'} />
                  {locationDetecting ? 'Detecting your location…' : 'Detect my location'}
                </button>
              )}
              {locationError && (
                <span style={{ fontSize: 11, color: '#e87070' }}>{locationError}</span>
              )}
            </div>

            {submitError && (
              <p style={{ fontSize: 12, color: '#e87070', textAlign: 'center' }}>{submitError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 mt-2 rounded-[10px] py-[12px] text-[13.5px] font-medium text-white transition-all duration-200"
              style={{
                background: submitting ? '#c4485e' : '#e8607a',
                border: 'none',
                opacity: submitting ? 0.8 : 1,
                pointerEvents: submitting ? 'none' : 'auto',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? '⏳ Saving…' : 'Save changes'}
            </button>
          </form>
        </SlidePanel>

        <SlidePanel
          open={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          title="Notifications"
          headerSlot={
            <span className="mt-1 block text-[12px] text-[#4b5563]">
              Updates about replies, saves, and anything that needs your attention.
            </span>
          }
        >
          <NotificationsPanel
            open={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
          />
        </SlidePanel>
      </header>

      <AnimatePresence>
        {showPostMenu && isCompanion && <PostMenu onClose={() => setShowPostMenu(false)} />}
      </AnimatePresence>
    </>
  )
}
