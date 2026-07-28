'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'

const LocationPicker = dynamic(() => import('@/components/ui/LocationPicker'), { ssr: false })
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Camera,
  LayoutGrid,
  Heart,
  Bookmark,
  BookMarked,
  Pencil,
  MapPin,
  LogIn,
} from 'lucide-react'
import EditProfileDrawer from '@/components/ui/EditProfileDrawer'
import TasteDrawer, { type TasteData } from '@/components/ui/TasteDrawer'
import { SavedConfessionsGrid } from '@/components/ui/SavedConfessionsGrid'
import { ConfessionsCollectionCard } from '@/components/ui/ConfessionsCollectionCard'
import { LikedGrid } from '@/components/ui/LikedGrid'
import { useSavedConfessions } from '@/hooks/useSavedConfessions'
import { useLikedContent } from '@/hooks/useLikedContent'
import { useUIStore, type ProfileViewerStory } from '@/store/uiStore'

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface UserPost {
  id: string
  title: string | null
  excerpt: string | null
  firstImage: string | null
  pageImageUrls: string[]
  categories: string[]
  likeCount: number
  saveCount: number
  viewCount: number
  commentCount: number
  moderationStatus: string
  createdAt: string
}

type MainTab = 'posts' | 'likes' | 'saved'
type LikedSubTab = 'all' | 'confessions' | 'stories'
type SavedSubTab = 'all' | 'collections' | 'companions'

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="flex flex-col items-center gap-4 pt-[95px] pb-[120px] px-5 max-w-[640px] mx-auto">
      <div className="w-[96px] h-[96px] rounded-full bg-[#111620] animate-pulse" />
      <div className="h-[22px] w-[140px] bg-[#111620] animate-pulse rounded-[8px]" />
      <div className="h-[14px] w-[100px] bg-[#111620] animate-pulse rounded-[8px]" />
    </div>
  )
}

// ─── PostCell ─────────────────────────────────────────────────────────────────

function PostCell({ post, onTap }: { post: UserPost; onTap: () => void }) {
  return (
    <div
      style={{
        aspectRatio: '3/4',
        position: 'relative',
        overflow: 'hidden',
        background: '#111620',
        cursor: 'pointer',
      }}
      onClick={onTap}
    >
      {post.firstImage ? (
        <Image
          src={post.firstImage}
          alt={post.title ?? 'Confession'}
          fill
          style={{ objectFit: 'cover' }}
          sizes="33vw"
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(160deg, #0d1117 0%, #07090f 60%, #0d0a12 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
          }}
        >
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 11,
              color: '#6b7280',
              lineHeight: 1.6,
              textAlign: 'center',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {post.excerpt ?? ''}
          </p>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(7,9,15,0.85))',
          padding: '16px 8px 8px',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <span
          style={{ fontSize: 10, color: '#eeeef0', display: 'flex', alignItems: 'center', gap: 3 }}
        >
          ♥ {post.likeCount}
        </span>
        <span
          style={{ fontSize: 10, color: '#eeeef0', display: 'flex', alignItems: 'center', gap: 3 }}
        >
          💬 {post.commentCount}
        </span>
        {post.moderationStatus === 'pending' && (
          <span
            style={{
              fontSize: 9,
              color: '#c9a96e',
              marginLeft: 'auto',
              background: 'rgba(201,169,110,0.12)',
              border: '1px solid rgba(201,169,110,0.25)',
              borderRadius: 20,
              padding: '1px 6px',
            }}
          >
            pending
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Saved grid cells ─────────────────────────────────────────────────────────

function StoryCell({ title, gradient }: { title: string; gradient: string }) {
  return (
    <div
      className="rounded-[12px] overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
      style={{ background: gradient, aspectRatio: '3/4', position: 'relative' }}
    >
      <div
        className="absolute inset-0 flex items-end p-3"
        style={{ background: 'linear-gradient(transparent 40%, rgba(7,9,15,0.9) 100%)' }}
      >
        <span style={{ fontSize: 12, color: '#eeeef0', lineHeight: 1.35 }}>{title}</span>
      </div>
    </div>
  )
}

function AudioCell({ title, voice, gradient }: { title: string; voice: string; gradient: string }) {
  return (
    <div
      className="rounded-[12px] overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
      style={{ background: gradient, aspectRatio: '3/4', position: 'relative' }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-[3px] h-[32px]">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 3,
                borderRadius: 2,
                background: 'rgba(232,96,122,0.6)',
                height: `${10 + (i % 4) * 5}px`,
                animation: `wave 1.2s ease-in-out ${(i * 0.1).toFixed(1)}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
      <div
        className="absolute inset-0 flex items-end p-3"
        style={{ background: 'linear-gradient(transparent 50%, rgba(7,9,15,0.9) 100%)' }}
      >
        <div>
          <div style={{ fontSize: 12, color: '#eeeef0' }}>{title}</div>
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{voice}</div>
        </div>
      </div>
    </div>
  )
}

// ─── LikedTabContent ──────────────────────────────────────────────────────────

const LIKED_SUB_TABS: { id: LikedSubTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'confessions', label: 'Confessions' },
  { id: 'stories', label: 'Stories' },
]

// Inner component so the hook is never called conditionally
function LikedContentPane({ type }: { type: LikedSubTab }) {
  const { items, isLoading } = useLikedContent(type)
  return <LikedGrid items={items} isLoading={isLoading} />
}

function LikesTabContent({
  likedSubTab,
  setLikedSubTab,
}: {
  likedSubTab: LikedSubTab
  setLikedSubTab: (t: LikedSubTab) => void
}) {
  return (
    <div>
      {/* Sub-tab pills */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {LIKED_SUB_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setLikedSubTab(id)}
            style={{
              flexShrink: 0,
              fontSize: 12,
              padding: '5px 14px',
              borderRadius: 999,
              border: `1px solid ${likedSubTab === id ? '#e8607a' : '#1c2333'}`,
              color: likedSubTab === id ? '#e8607a' : '#6b7280',
              background: likedSubTab === id ? 'rgba(232,96,122,0.08)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <LikedContentPane type={likedSubTab} />
    </div>
  )
}

// ─── SavedTabContent ──────────────────────────────────────────────────────────

const SAVED_SUB_TABS: { id: SavedSubTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'collections', label: 'Collections' },
  { id: 'companions', label: 'Companions' },
]

function SavedTabContent({
  savedSubTab,
  setSavedSubTab,
}: {
  savedSubTab: SavedSubTab
  setSavedSubTab: (t: SavedSubTab) => void
}) {
  const { items, total, isLoading } = useSavedConfessions()

  // Split saved items by content type for separate collection cards
  const confessionItems = items.filter((i) => i.authorType === 'user')
  const storyItems = items.filter((i) => i.authorType !== 'user')

  const confessionCovers = confessionItems
    .slice(0, 4)
    .map((i) => i.firstImage)
    .filter((v): v is string => Boolean(v))
  const storyCovers = storyItems
    .slice(0, 4)
    .map((i) => i.firstImage)
    .filter((v): v is string => Boolean(v))

  const skeletonGrid = (
    <div className="grid grid-cols-3 gap-[2px]">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          style={{ aspectRatio: '3/4', background: '#111620' }}
          className="animate-pulse"
        />
      ))}
    </div>
  )

  return (
    <div>
      {/* Sub-tab pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4" style={{ scrollbarWidth: 'none' }}>
        {SAVED_SUB_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setSavedSubTab(id)}
            style={{
              flexShrink: 0,
              fontSize: 12,
              padding: '5px 14px',
              borderRadius: 999,
              border: `1px solid ${savedSubTab === id ? '#e8607a' : '#1c2333'}`,
              color: savedSubTab === id ? '#e8607a' : '#6b7280',
              background: savedSubTab === id ? 'rgba(232,96,122,0.08)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      {savedSubTab === 'all' && (isLoading ? skeletonGrid : <SavedConfessionsGrid items={items} />)}

      {savedSubTab === 'collections' &&
        (isLoading ? (
          <div className="flex flex-col gap-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                style={{
                  height: 140,
                  borderRadius: 14,
                  background: '#0d1117',
                  border: '1px solid #1c2333',
                }}
                className="animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <BookMarked size={32} color="#1c2333" />
            <p style={{ fontSize: 13, color: '#4b5563', fontStyle: 'italic', textAlign: 'center' }}>
              No collections yet. Save confessions or stories to create your first.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {confessionItems.length > 0 && (
              <ConfessionsCollectionCard
                title="Confessions"
                count={confessionItems.length}
                coverImages={confessionCovers}
              />
            )}
            {storyItems.length > 0 && (
              <ConfessionsCollectionCard
                title="Stories"
                count={storyItems.length}
                coverImages={storyCovers}
              />
            )}
          </div>
        ))}

      {savedSubTab === 'companions' && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Bookmark size={32} color="#1c2333" />
          <p style={{ fontSize: 13, color: '#4b5563', fontStyle: 'italic', textAlign: 'center' }}>
            Saved companions will appear here.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const setAvatarUrl = useUIStore((s) => s.setAvatarUrl)
  const openProfileViewer = useUIStore((s) => s.openProfileViewer)
  const dreamer = useUIStore((s) => s.dreamer)
  const dreamerLoading = useUIStore((s) => s.dreamerLoading)
  const openAuthModal = useUIStore((s) => s.openAuthModal)

  const [tasteOpen, setTasteOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<MainTab>('posts')
  const [likedSubTab, setLikedSubTab] = useState<LikedSubTab>('all')
  const [savedSubTab, setSavedSubTab] = useState<SavedSubTab>('all')
  const [editOpen, setEditOpen] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [profileOverride, setProfileOverride] = useState<Partial<UserProfile> | null>(null)

  // ── Fetch profile ──────────────────────────────────────────────────────────
  const { data: profileData, isLoading: loading } = useQuery<{ data: UserProfile | null }>({
    queryKey: ['user', 'profile'],
    queryFn: () => fetch('/api/users/profile', { credentials: 'include' }).then((r) => r.json()),
    staleTime: 60_000,
  })
  const profile: UserProfile | null = profileOverride
    ? ({ ...(profileData?.data ?? (null as any)), ...profileOverride } as UserProfile)
    : (profileData?.data ?? null)

  useEffect(() => {
    if (profileData?.data?.avatar_url) setAvatarUrl(profileData.data.avatar_url)
  }, [profileData?.data?.avatar_url, setAvatarUrl])

  // ── Fetch posts ────────────────────────────────────────────────────────────
  const { data: postsData, isLoading: postsLoading } = useQuery<{ data: UserPost[] }>({
    queryKey: ['user', 'posts'],
    queryFn: () => fetch('/api/users/posts', { credentials: 'include' }).then((r) => r.json()),
    staleTime: 60_000,
  })
  const posts = postsData?.data ?? []

  // ── Location detection ─────────────────────────────────────────────────────
  type LocationStatus = 'idle' | 'detecting' | 'failed' | 'picking'
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle')
  const geoAttemptedRef = useRef(false)

  const attemptGeolocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationStatus('failed')
      return
    }
    setLocationStatus('detecting')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch('/api/users/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          })
          const json = await res.json()
          if (!res.ok || !json.data?.city) throw new Error()
          const { city, country } = json.data
          await fetch('/api/users/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city, ...(country ? { country } : {}) }),
          })
          setProfileOverride((o) => ({ ...(o ?? {}), city, ...(country ? { country } : {}) }))
          setLocationStatus('idle')
        } catch {
          setLocationStatus('failed')
        }
      },
      () => setLocationStatus('failed'),
      { timeout: 8000, maximumAge: 300_000 }
    )
  }, [])

  useEffect(() => {
    if (loading || profile?.city || geoAttemptedRef.current) return
    geoAttemptedRef.current = true
    attemptGeolocation()
  }, [loading, profile?.city, attemptGeolocation])

  // ── Avatar upload ──────────────────────────────────────────────────────────
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('JPG, PNG or WebP only.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be under 5 MB.')
      return
    }
    setAvatarUploading(true)
    setAvatarError(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/users/avatar', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload failed')
      setProfileOverride((o) => ({ ...(o ?? {}), avatar_url: json.data.avatarUrl }))
      setAvatarUrl(json.data.avatarUrl)
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setAvatarUploading(false)
    }
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const alias = profile?.alias ?? dreamer?.alias ?? '@you'
  const initials = alias.replace('@', '').slice(0, 2).toUpperCase()
  const vibes = profile?.vibes?.length ? profile.vibes : []
  const desires = profile?.desired_genders?.length ? profile.desired_genders : []

  const TABS: { id: MainTab; icon: React.ReactNode }[] = [
    { id: 'posts', icon: <LayoutGrid size={20} /> },
    { id: 'likes', icon: <Heart size={20} /> },
    { id: 'saved', icon: <Bookmark size={20} /> },
  ]

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (!dreamerLoading && !dreamer) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-5 px-5"
        style={{ minHeight: '100svh', paddingTop: 75 }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(232,96,122,0.08)',
            border: '1px solid rgba(232,96,122,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LogIn size={28} color="#e8607a" strokeWidth={1.5} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 20,
              color: '#eeeef0',
              marginBottom: 8,
            }}
          >
            Your private world awaits
          </p>
          <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, maxWidth: 280 }}>
            Sign in to access your profile, saved confessions, and likes.
          </p>
        </div>
        <button
          onClick={() => openAuthModal()}
          style={{
            height: 44,
            padding: '0 28px',
            background: '#e8607a',
            border: 'none',
            borderRadius: 22,
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(232,96,122,0.28)',
          }}
        >
          Sign in
        </button>
      </div>
    )
  }

  return (
    <>
      {loading ? (
        <Skeleton />
      ) : (
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 mx-auto px-5 pt-[95px] pb-[120px]"
          style={{ maxWidth: 640 }}
        >
          {/* ── Section 1: Hero identity ─────────────────────── */}
          <div className="flex flex-col items-center gap-3 mb-6">
            {/* Avatar */}
            <div
              className="relative group cursor-pointer"
              style={{ width: 96, height: 96 }}
              onClick={() => !avatarUploading && fileInputRef.current?.click()}
            >
              {profile?.avatar_url ? (
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: '50%',
                    backgroundImage: `url(${profile.avatar_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '2px solid #1c2333',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#e8607a,#9b5fe0)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    fontWeight: 600,
                    color: '#fff',
                    border: '2px solid #1c2333',
                  }}
                >
                  {initials}
                </div>
              )}
              {avatarUploading ? (
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.55)' }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.2)',
                      borderTopColor: '#fff',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                </div>
              ) : (
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: 'rgba(7,9,15,0.65)' }}
                >
                  <Camera size={20} color="#eeeef0" />
                </div>
              )}
            </div>

            {avatarError && (
              <p style={{ fontSize: 11, color: '#e87070', textAlign: 'center' }}>{avatarError}</p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />

            {/* Alias */}
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 22,
                color: '#e8607a',
                letterSpacing: '-0.01em',
              }}
            >
              {alias}
            </div>

            {/* {profile?.display_name && (
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: -6 }}>
                {profile.display_name}
              </div>
            )} */}

            <button
              onClick={() => setEditOpen(true)}
              style={{
                fontSize: 12,
                color: '#e8607a',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: 0,
                marginTop: -2,
              }}
            >
              <Pencil size={11} />
              Edit profile
            </button>

            {profile?.bio && (
              <p
                style={{
                  fontSize: 13,
                  color: '#9ca3af',
                  textAlign: 'center',
                  lineHeight: 1.6,
                  maxWidth: 320,
                  fontStyle: 'italic',
                }}
              >
                {profile.bio}
              </p>
            )}

            {/* ── Location block ── */}
            {profile?.city ? (
              <button
                onClick={() => setLocationStatus('picking')}
                className="flex items-center gap-[5px] bg-transparent border-none cursor-pointer p-0 transition-opacity hover:opacity-70"
                style={{ fontSize: 12, color: '#6b7280' }}
              >
                <MapPin size={12} color="#6b7280" />
                {[profile.city, profile.country].filter(Boolean).join(', ')}
              </button>
            ) : locationStatus === 'detecting' ? (
              <div
                className="flex items-center gap-[5px]"
                style={{ fontSize: 11, color: '#4b5563', fontStyle: 'italic' }}
              >
                <MapPin size={11} color="#4b5563" />
                Locating…
              </div>
            ) : locationStatus === 'picking' ? (
              <LocationPicker
                onSaved={(city) => {
                  setProfileOverride((o) => ({ ...(o ?? {}), city }))
                  setLocationStatus('idle')
                }}
                onCancel={() => setLocationStatus(profile?.city ? 'idle' : 'failed')}
              />
            ) : locationStatus === 'failed' ? (
              <div className="flex flex-col items-center gap-[10px]">
                <span style={{ fontSize: 11, color: '#4b5563' }}>
                  We couldn&apos;t find your location
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      geoAttemptedRef.current = false
                      attemptGeolocation()
                    }}
                    className="text-[11px] px-3 py-[5px] rounded-full cursor-pointer border-none transition-all duration-150"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: '#6b7280',
                      border: '1px solid #1c2333',
                    }}
                  >
                    Try again
                  </button>
                  <button
                    onClick={() => setLocationStatus('picking')}
                    className="text-[11px] px-3 py-[5px] rounded-full cursor-pointer border-none transition-all duration-150"
                    style={{
                      background: 'rgba(232,96,122,0.08)',
                      color: '#e8607a',
                      border: '1px solid rgba(232,96,122,0.3)',
                    }}
                  >
                    Add manually
                  </button>
                </div>
              </div>
            ) : null}

            <span
              className="text-[11px] px-[10px] py-1 rounded-full text-[#e8607a]"
              style={{
                border: '1px solid rgba(232,96,122,0.3)',
                background: 'rgba(232,96,122,0.08)',
              }}
            >
              The Dreamer
            </span>
          </div>

          {/* ── Section 2: Stats ─────────────────────────────── */}
          <div className="flex items-center justify-center gap-0 mb-7">
            {[
              { n: posts.length.toString(), label: 'confessions' },
              { n: posts.reduce((a, p) => a + p.likeCount, 0).toString(), label: 'likes' },
              { n: posts.reduce((a, p) => a + p.saveCount, 0).toString(), label: 'saved' },
            ].map(({ n, label }, i) => (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center px-6 py-2">
                  <span
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 22,
                      color: '#eeeef0',
                    }}
                  >
                    {n}
                  </span>
                  <span style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{label}</span>
                </div>
                {i < 2 && <div style={{ width: 1, height: 32, background: '#1c2333' }} />}
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: '#1c2333', marginBottom: 28 }} />

          {/* ── Section 3: Your taste ────────────────────────── */}
          <div className="mb-7">
            <div className="flex items-center justify-between mb-4">
              <span
                style={{
                  fontSize: 10,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                your taste
              </span>
              <button
                onClick={() => setTasteOpen(true)}
                className="flex items-center gap-[5px] bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-[#eeeef0]"
                style={{ fontSize: 12, color: '#e8607a', padding: 0 }}
              >
                <Pencil size={11} />
                Edit
              </button>
            </div>

            <div className="mb-4">
              <div
                style={{
                  fontSize: 10,
                  color: '#4b5563',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 8,
                }}
              >
                vibes
              </div>
              {vibes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {vibes.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => setTasteOpen(true)}
                  className="text-[12px] bg-transparent border-none cursor-pointer p-0 transition-colors hover:text-[#eeeef0]"
                  style={{ color: '#4b5563', fontStyle: 'italic' }}
                >
                  Nothing yet — tap Edit to add your vibes.
                </button>
              )}
            </div>

            <div>
              <div
                style={{
                  fontSize: 10,
                  color: '#4b5563',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 8,
                }}
              >
                Gender Preference
              </div>
              {desires.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {desires.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] px-[10px] py-1 rounded-full text-[#e8607a]"
                      style={{
                        border: '1px solid rgba(232,96,122,0.3)',
                        background: 'rgba(232,96,122,0.08)',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => setTasteOpen(true)}
                  className="text-[12px] bg-transparent border-none cursor-pointer p-0 transition-colors hover:text-[#eeeef0]"
                  style={{ color: '#4b5563', fontStyle: 'italic' }}
                >
                  Nothing yet — tap Edit to shape your desires.
                </button>
              )}
            </div>
          </div>

          <div style={{ height: 1, background: '#1c2333', marginBottom: 0 }} />

          {/* ── Section 4: Tabs ──────────────────────────────── */}
          <div className="flex border-b border-[#1c2333]">
            {TABS.map(({ id, icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex-1 flex items-center justify-center py-3 transition-all duration-150 border-b-[2px] bg-transparent cursor-pointer"
                style={{
                  borderColor: activeTab === id ? '#e8607a' : 'transparent',
                  color: activeTab === id ? '#e8607a' : '#4b5563',
                }}
              >
                {icon}
              </button>
            ))}
          </div>

          <div className="pt-4 mb-8">
            {activeTab === 'posts' &&
              (postsLoading ? (
                <div className="grid grid-cols-3 gap-[2px]">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      style={{ aspectRatio: '3/4', background: '#111620', borderRadius: 4 }}
                      className="animate-pulse"
                    />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <LayoutGrid size={32} color="#1c2333" />
                  <p
                    style={{
                      fontSize: 13,
                      color: '#4b5563',
                      fontStyle: 'italic',
                      textAlign: 'center',
                    }}
                  >
                    Your confessions will appear here.
                  </p>
                  <button
                    onClick={() => router.push('/create')}
                    className="text-[12px] text-[#e8607a] px-4 py-2 rounded-full mt-1 cursor-pointer"
                    style={{
                      border: '1px solid rgba(232,96,122,0.3)',
                      background: 'rgba(232,96,122,0.08)',
                    }}
                  >
                    Write your first confession →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-[2px]">
                  {posts.map((post, idx) => (
                    <PostCell
                      key={post.id}
                      post={post}
                      onTap={() => {
                        const storiesArray: ProfileViewerStory[] = posts.map((p) => ({
                          id: p.id,
                          title: p.title,
                          body: '',
                          rawBody: p.excerpt ?? '',
                          pageImageUrls: p.pageImageUrls,
                          categoryName: p.categories[0] ?? '',
                          categories: p.categories,
                          moodTags: [],
                          likeCount: p.likeCount,
                          saveCount: p.saveCount,
                          commentCount: p.commentCount,
                          userHasLiked: false,
                          userHasSaved: false,
                          authorAlias: dreamer?.alias ?? null,
                          isAnonymous: false,
                          createdAt: p.createdAt,
                        }))
                        openProfileViewer(storiesArray, idx, 'own')
                      }}
                    />
                  ))}
                </div>
              ))}

            {activeTab === 'likes' && (
              <LikesTabContent likedSubTab={likedSubTab} setLikedSubTab={setLikedSubTab} />
            )}

            {activeTab === 'saved' && (
              <SavedTabContent savedSubTab={savedSubTab} setSavedSubTab={setSavedSubTab} />
            )}
          </div>
        </motion.main>
      )}

      {/* ── Taste drawer ─────────────────────────────────────── */}
      <TasteDrawer
        open={tasteOpen}
        onClose={() => setTasteOpen(false)}
        onSaved={(d: TasteData) =>
          setProfileOverride((o) => ({
            ...(o ?? {}),
            vibes: d.vibes,
            gender: d.gender,
            desired_genders: d.desiredGenders,
          }))
        }
        defaults={{
          vibes: profile?.vibes ?? [],
          gender: profile?.gender ?? '',
          desiredGenders: profile?.desired_genders ?? [],
        }}
      />

      {/* ── Edit profile drawer ───────────────────────────────── */}
      <EditProfileDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        defaults={{
          alias: profile?.alias ?? undefined,
          bio: profile?.bio ?? undefined,
          dateOfBirth: profile?.date_of_birth ?? undefined,
          country: profile?.country ?? undefined,
          city: profile?.city ?? undefined,
        }}
        currentAvatar={profile?.avatar_url ?? null}
        onSaved={(data) => {
          setProfileOverride((o) => ({ ...(o ?? {}), ...data }))
          setEditOpen(false)
        }}
      />
    </>
  )
}
