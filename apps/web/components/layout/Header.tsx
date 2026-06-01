'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { ArrowLeft, Bell, BookOpen, Camera, ChevronRight, HelpCircle, ImagePlus, Loader2, LogOut, Menu, Pencil, PenLine, Plus, Shield, Video } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'
import { useUploadToR2 } from '@/hooks/useUploadToR2'
import SlidePanel from '@/components/ui/SlidePanel'
import NotificationsPanel from '@/components/ui/NotificationsPanel'
import { useNotifications } from '@/hooks/useNotifications'

// ─── PostMenu — companion create sheet ───────────────────────────────────────

type PostMenuView = 'menu' | 'photo' | 'video'

function PostMenu({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [view, setView]             = useState<PostMenuView>('menu')
  const [photoFile, setPhotoFile]   = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [videoFile, setVideoFile]   = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [saving, setSaving]         = useState(false)
  const [success, setSuccess]       = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const { uploadFile, uploading }   = useUploadToR2()

  const resetUpload = () => {
    setUploadError(null); setPhotoFile(null); setPhotoPreview(null); setVideoFile(null); setSuccess(false)
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setUploadError('File must be under 5MB'); return }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setUploadError(null)
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) { setUploadError('File must be under 50MB'); return }
    const el = document.createElement('video')
    el.preload = 'metadata'
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(el.src)
      if (el.duration > 10) { setUploadError('Video must be 10 seconds or less'); return }
      setVideoFile(file); setUploadError(null)
    }
    el.src = URL.createObjectURL(file)
  }

  const handleUploadPhoto = async () => {
    if (!photoFile || saving || uploading) return
    setSaving(true); setUploadError(null)
    try {
      const result = await uploadFile(photoFile)
      if (!result) throw new Error('Upload failed')
      const res = await fetch('/api/companions/media/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: result.cdnUrl, storage_key: result.s3Key }),
      })
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error ?? 'Failed to save') }
      setSuccess(true)
      setTimeout(onClose, 1500)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally { setSaving(false) }
  }

  const handleUploadVideo = async () => {
    if (!videoFile || saving || uploading) return
    setSaving(true); setUploadError(null)
    try {
      const duration = await new Promise<number>(resolve => {
        const el = document.createElement('video')
        el.preload = 'metadata'
        el.onloadedmetadata = () => { URL.revokeObjectURL(el.src); resolve(Math.round(el.duration)) }
        el.src = URL.createObjectURL(videoFile)
      })
      const result = await uploadFile(videoFile)
      if (!result) throw new Error('Upload failed')
      const res = await fetch('/api/companions/media/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: result.cdnUrl, storage_key: result.s3Key, duration_seconds: duration }),
      })
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error ?? 'Failed to save') }
      setSuccess(true)
      setTimeout(onClose, 1500)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally { setSaving(false) }
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
          onClick={e => e.stopPropagation()}
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
                  style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  onClick={() => { onClose(); router.push('/create') }}
                >
                  <div className="w-10 h-10 rounded-full bg-[#161d2a] border border-[#1c2333] flex items-center justify-center flex-shrink-0">
                    <PenLine size={18} color="#e8607a" />
                  </div>
                  <div>
                    <div className="text-[15px] text-[#eeeef0] font-medium leading-snug">Write a confession</div>
                    <div className="text-[12px] text-[#6b7280] mt-[2px]">Anonymous · dark canvas · paginated</div>
                  </div>
                </button>

                {/* Option: Write a story */}
                <button
                  className="w-full flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.04] active:bg-white/[0.06]"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  onClick={() => { onClose(); router.push('/create?type=story') }}
                >
                  <div className="w-10 h-10 rounded-full bg-[#161d2a] border border-[#1c2333] flex items-center justify-center flex-shrink-0">
                    <BookOpen size={18} color="#e8607a" />
                  </div>
                  <div>
                    <div className="text-[15px] text-[#eeeef0] font-medium leading-snug">Write a story</div>
                    <div className="text-[12px] text-[#6b7280] mt-[2px]">Literary · longer form · editorial</div>
                  </div>
                </button>

                {/* Option: Add a photo */}
                <button
                  className="w-full flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.04] active:bg-white/[0.06]"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  onClick={() => setView('photo')}
                >
                  <div className="w-10 h-10 rounded-full bg-[#161d2a] border border-[#1c2333] flex items-center justify-center flex-shrink-0">
                    <Camera size={18} color="#c9a96e" />
                  </div>
                  <div>
                    <div className="text-[15px] text-[#eeeef0] font-medium leading-snug">Add a photo</div>
                    <div className="text-[12px] text-[#6b7280] mt-[2px]">Photos appear on your profile & feed</div>
                  </div>
                </button>

                {/* Option: Add a short video */}
                <button
                  className="w-full flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.04] active:bg-white/[0.06]"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  onClick={() => setView('video')}
                >
                  <div className="w-10 h-10 rounded-full bg-[#161d2a] border border-[#1c2333] flex items-center justify-center flex-shrink-0">
                    <Video size={18} color="#c9a96e" />
                  </div>
                  <div>
                    <div className="text-[15px] text-[#eeeef0] font-medium leading-snug">Add a short video</div>
                    <div className="text-[12px] text-[#6b7280] mt-[2px]">Up to 10 seconds · non-nude</div>
                  </div>
                </button>

                {/* Cancel */}
                <button
                  className="w-full py-4 transition-colors hover:bg-white/[0.03]"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
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
                    onClick={() => { setView('menu'); resetUpload() }}
                    className="flex items-center justify-center rounded-full transition-colors hover:bg-white/[0.06]"
                    style={{ width: 36, height: 36, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
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
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }}
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[20px]"
                      style={{ background: '#e8607a' }}>
                      ✓
                    </motion.div>
                    <p className="text-[14px] text-[#e8607a] text-center">
                      {view === 'photo' ? 'Photo uploaded — pending review' : 'Video uploaded — pending review'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Hidden file inputs */}
                    <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={handlePhotoSelect} />
                    <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime" className="hidden"
                      onChange={handleVideoSelect} />

                    {/* Upload zone / preview */}
                    {view === 'photo' && photoPreview ? (
                      <div className="flex flex-col items-center gap-3">
                        <img src={photoPreview} alt="Preview"
                          className="rounded-[12px] object-cover"
                          style={{ maxHeight: 220, maxWidth: '100%' }} />
                        <button onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                          className="text-[12px] text-[#6b7280] underline"
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                          Choose a different photo
                        </button>
                      </div>
                    ) : view === 'video' && videoFile ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-full rounded-[12px] border border-[#1c2333] bg-[#111620] flex items-center justify-center px-5 py-5">
                          <span className="text-[13px] text-[#6b7280] text-center">{videoFile.name}</span>
                        </div>
                        <button onClick={() => setVideoFile(null)}
                          className="text-[12px] text-[#6b7280] underline"
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                          Choose a different video
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => (view === 'photo' ? photoInputRef : videoInputRef).current?.click()}
                        className="w-full flex flex-col items-center justify-center gap-3 rounded-[16px] transition-colors hover:border-[rgba(232,96,122,0.3)]"
                        style={{ minHeight: 120, padding: 40, background: '#111620', border: '2px dashed #1c2333', cursor: 'pointer' }}
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
                        {busy ? <><Loader2 size={16} className="animate-spin" /> Uploading…</> : 'Upload →'}
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

const LOCATIONS: Record<string, string[]> = {
  'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'],
  'France': ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux'],
  'Germany': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
  'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Bristol'],
  'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao'],
  'Other': [],
}
const COUNTRY_LIST = Object.keys(LOCATIONS)

const editProfileSchema = z.object({
  alias:       z.string().max(100).optional(),
  bio:         z.string().max(300).optional(),
  dateOfBirth: z.string().optional(),
  country:     z.string().max(100).optional(),
  city:        z.string().max(100).optional(),
})

type EditProfileFormValues = z.infer<typeof editProfileSchema>

interface UserProfile {
  id:              string
  email:           string
  name:            string | null
  image:           string | null
  alias:           string | null
  created_at:      string
  display_name:    string | null
  avatar_url:      string | null
  bio:             string | null
  date_of_birth:   string | null
  country:         string | null
  city:            string | null
  gender:          string | null
  desired_genders: string[] | null
  vibes:           string[] | null
  platform_role:   string | null
}

export default function Header() {
  const { data: session } = useSession()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [plusHover, setPlusHover] = useState(false)
  const [showPostMenu, setShowPostMenu] = useState(false)

  const isCompanion = (session?.user as any)?.platform_role === 'companion'
    || (session?.user as any)?.platform_role === 'dream'
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const avatarUrl = useUIStore(s => s.avatarUrl)
  const setAvatarUrl = useUIStore(s => s.setAvatarUrl)
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
    defaultValues: profile ? {
      alias:       profile.alias ?? undefined,
      bio:         profile.bio ?? undefined,
      dateOfBirth: profile.date_of_birth ?? undefined,
      country:     profile.country ?? undefined,
      city:        profile.city ?? undefined,
    } : {},
  })

  useEffect(() => {
    if (editProfileOpen && profile) {
      reset({
        alias:       profile.alias ?? undefined,
        bio:         profile.bio ?? undefined,
        dateOfBirth: profile.date_of_birth ?? undefined,
        country:     profile.country ?? undefined,
        city:        profile.city ?? undefined,
      })
    }
  }, [editProfileOpen, profile, reset])
  const router = useRouter()
  const pathname = usePathname()
  const isProfile = pathname === '/profile' || (isCompanion && pathname === '/companion/profile')

  const alias = session?.user?.alias ?? '??'
  const initials = alias.replace('@', '').slice(0, 2).toUpperCase()

  useEffect(() => {
    setSettingsOpen(false)
  }, [pathname])

  const menuItems = isCompanion
    ? [
        {
          label: 'Complete my profile',
          href: '/companion/profile/settings',
          icon: Pencil,
          tone: 'default' as const,
        },
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
        {
          label: 'Sign out',
          icon: LogOut,
          tone: 'danger' as const,
          onClick: () => signOut({ callbackUrl: '/auth/signin' }),
        },
      ]
    : [
        {
          label: 'Edit profile',
          icon: Pencil,
          tone: 'default' as const,
          onClick: () => setEditProfileOpen(true),
        },
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
        {
          label: 'Sign out',
          icon: LogOut,
          tone: 'danger' as const,
          onClick: () => signOut({ callbackUrl: '/auth/signin' }),
        },
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

  const selectedCountry = watch('country') ?? ''
  const cityOptions    = LOCATIONS[selectedCountry] ?? []
  const bioLength      = watch('bio')?.length ?? 0

  async function onSubmitEditProfile(values: EditProfileFormValues) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/users/profile', {
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
      <div
        className="px-5 md:px-8"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        <div style={{ justifySelf: 'start' }}>
          <button
            type="button"
            aria-label="Write a confession"
            onClick={() => isCompanion ? setShowPostMenu(true) : router.push('/create')}
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
              size={28}
              strokeWidth={2}
              color={plusHover ? '#e8607a' : '#6b7280'}
              style={{ transition: 'color 0.15s' }}
            />
          </button>
        </div>

        <div style={{ justifySelf: 'center' }}>
          <Link href="/" className="flex-shrink-0 block">
            <Image
              src="/bb_croped.png"
              alt="BlushBite"
              width={140}
              height={1150}
              // width={90}
              // height={1150}
              priority
              style={{ objectFit: 'contain', objectPosition: 'center', display: 'block' }}
            />
          </Link>
        </div>

        <div style={{ justifySelf: 'end' }}>
          {isProfile ? (
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
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,96,122,0.10)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <Menu size={22} strokeWidth={1.5} />
            </button>
          ) : (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => router.push('/notifications')}
                className="flex items-center justify-center rounded-full transition-all duration-150"
                style={{
                  width: 44,
                  height: 44,
                  background: pathname === '/notifications' ? 'rgba(232,96,122,0.10)' : 'transparent',
                  border: 'none',
                  color: pathname === '/notifications' ? '#e8607a' : '#6b7280',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,96,122,0.10)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = pathname === '/notifications' ? 'rgba(232,96,122,0.10)' : 'transparent' }}
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
          )}
        </div>
      </div>

      <SlidePanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Profile settings"
        headerSlot={(
          <div className="mt-2 flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1c2333] text-[11px] font-semibold"
              style={profileAccent}
            >
              {!avatarUrl ? initials : null}
            </span>
            <div>
              <p className="text-[13px] text-[#eeeef0]">{alias}</p>
              <p className="text-[11px] text-[#4b5563]">Manage privacy, support, and account actions.</p>
            </div>
          </div>
        )}
      >
        <div className="flex flex-col gap-2">
          {menuItems.map(item => {
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
                  <span className="block text-[14px]" style={{ color: isDanger ? '#e87070' : '#eeeef0' }}>
                    {item.label}
                  </span>
                  <span className="block pt-1 text-[12px] text-[#4b5563]">
                    {isDanger ? 'End this session securely.' : 'Open this screen in a full-page view.'}
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
                  background: item.label === 'Edit profile' ? '#111620' : 'rgba(232,112,112,0.05)',
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
          {/* Alias */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[11px] text-[#6b7280] uppercase tracking-widest">Private alias</label>
            <input
              {...register('alias')}
              placeholder="Your anonymous name (e.g., @midnight-wanderer)"
              className="bg-[#161d2a] border border-[#1c2333] rounded-[10px] px-4 py-3 text-[13px] text-[#eeeef0] outline-none transition-colors duration-150 focus:border-[#e8607a] placeholder:text-[#4b5563] w-full"
            />
            {errors.alias && <span style={{ fontSize: 11, color: '#e87070' }}>{errors.alias.message}</span>}
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
              <span className="absolute bottom-2 right-3" style={{ fontSize: 10, color: '#4b5563', pointerEvents: 'none' }}>
                {bioLength}/300
              </span>
            </div>
            {errors.bio && <span style={{ fontSize: 11, color: '#e87070' }}>{errors.bio.message}</span>}
          </div>

          {/* Date of birth */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[11px] text-[#6b7280] uppercase tracking-widest">Date of birth</label>
            <input
              {...register('dateOfBirth')}
              type="date"
              className="bg-[#161d2a] border border-[#1c2333] rounded-[10px] px-4 py-3 text-[13px] text-[#eeeef0] outline-none transition-colors duration-150 focus:border-[#e8607a] placeholder:text-[#4b5563] w-full"
              style={{ colorScheme: 'dark' }}
            />
            {errors.dateOfBirth && <span style={{ fontSize: 11, color: '#e87070' }}>{errors.dateOfBirth.message}</span>}
          </div>

          {/* Country */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[11px] text-[#6b7280] uppercase tracking-widest">Country</label>
            <div className="relative">
              <select
                {...register('country')}
                className="bg-[#161d2a] border border-[#1c2333] rounded-[10px] px-4 py-3 text-[13px] text-[#eeeef0] outline-none transition-colors duration-150 focus:border-[#e8607a] placeholder:text-[#4b5563] w-full"
                style={{ colorScheme: 'dark', appearance: 'none', paddingRight: 36 }}
              >
                <option value="">Select your country</option>
                {COUNTRY_LIST.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] text-[11px]">▾</div>
            </div>
            {errors.country && <span style={{ fontSize: 11, color: '#e87070' }}>{errors.country.message}</span>}
          </div>

          {/* City */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[11px] text-[#6b7280] uppercase tracking-widest">City</label>
            {cityOptions.length > 0 ? (
              <div className="relative">
                <select
                  {...register('city')}
                  className="bg-[#161d2a] border border-[#1c2333] rounded-[10px] px-4 py-3 text-[13px] text-[#eeeef0] outline-none transition-colors duration-150 focus:border-[#e8607a] placeholder:text-[#4b5563] w-full"
                  style={{ colorScheme: 'dark', appearance: 'none', paddingRight: 36 }}
                  disabled={!selectedCountry}
                >
                  <option value="">Select your city</option>
                  {cityOptions.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] text-[11px]">▾</div>
              </div>
            ) : (
              <input
                {...register('city')}
                type="text"
                placeholder={selectedCountry ? 'Enter your city' : 'Select a country first'}
                disabled={!selectedCountry}
                className="bg-[#161d2a] border border-[#1c2333] rounded-[10px] px-4 py-3 text-[13px] text-[#eeeef0] outline-none transition-colors duration-150 focus:border-[#e8607a] placeholder:text-[#4b5563] w-full"
                style={{ opacity: selectedCountry ? 1 : 0.5 }}
              />
            )}
            {errors.city && <span style={{ fontSize: 11, color: '#e87070' }}>{errors.city.message}</span>}
          </div>

          {submitError && (
            <p style={{ fontSize: 12, color: '#e87070', textAlign: 'center' }}>{submitError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 mt-2 rounded-[10px] py-[12px] text-[13.5px] font-medium text-white transition-all duration-200"
            style={{
              background:    submitting ? '#c4485e' : '#e8607a',
              border:        'none',
              opacity:       submitting ? 0.8 : 1,
              pointerEvents: submitting ? 'none' : 'auto',
              cursor:        submitting ? 'not-allowed' : 'pointer',
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
        headerSlot={(
          <span className="mt-1 block text-[12px] text-[#4b5563]">
            Updates about replies, saves, and anything that needs your attention.
          </span>
        )}
      >
        <NotificationsPanel
          open={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
        />
      </SlidePanel>
    </header>

    <AnimatePresence>
      {showPostMenu && isCompanion && (
        <PostMenu onClose={() => setShowPostMenu(false)} />
      )}
    </AnimatePresence>
    </>
  )
}
