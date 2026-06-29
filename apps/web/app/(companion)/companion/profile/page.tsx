'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { Camera, LayoutGrid, Heart, Bookmark, BookMarked, Settings2, MapPin } from 'lucide-react'

const LocationPicker = dynamic(() => import('@/components/ui/LocationPicker'), { ssr: false })
import { SavedConfessionsGrid } from '@/components/ui/SavedConfessionsGrid'
import { ConfessionsCollectionCard } from '@/components/ui/ConfessionsCollectionCard'
import { LikedGrid } from '@/components/ui/LikedGrid'
import { useSavedConfessions } from '@/hooks/useSavedConfessions'
import { useLikedContent } from '@/hooks/useLikedContent'
import { useUIStore, type ProfileViewerStory } from '@/store/uiStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompanionProfileData {
  companion: {
    id: string
    name: string | null
    email: string
    alias: string | null
  }
  profile: {
    id: string
    bio: string | null
    tagline: string | null
    city: string | null
    availability_status: string
    is_verified: boolean
    is_live: boolean
    profile_completeness: number
  }
  photos: { id: string; url: string; is_primary: boolean }[]
  videos: {
    id: string
    url: string
    thumbnail_url: string | null
    duration_seconds: number | null
    is_approved: boolean
  }[]
  stories: {
    id: string
    title: string | null
    moderation_status: string
    like_count: number
    created_at: string
  }[]
  session_cards: {
    id: string
    title: string
    price: string | null
    currency: string
    duration_minutes: number | null
  }[]
  selected_vibe_tag_ids: number[]
  available_vibe_tags: { id: number; name: string }[]
  selected_fantasy_tag_ids: number[]
  available_fantasy_tags: { id: number; name: string; category_id?: number }[]
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
type PostsSubTab = 'all' | 'photos' | 'videos' | 'confessions' | 'stories'
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

// ─── PostsTabContent ──────────────────────────────────────────────────────────

const POSTS_SUB_TABS: { id: PostsSubTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'photos', label: 'Photos' },
  { id: 'videos', label: 'Videos' },
  { id: 'confessions', label: 'Confessions' },
  { id: 'stories', label: 'Stories' },
]

function PhotoGrid({ photos }: { photos: CompanionProfileData['photos'] }) {
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <LayoutGrid size={32} color="#1c2333" />
        <p style={{ fontSize: 13, color: '#4b5563', fontStyle: 'italic', textAlign: 'center' }}>
          No photos yet. Add photos from your profile settings.
        </p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-3 gap-[2px]">
      {photos.map((photo) => (
        <div
          key={photo.id}
          style={{
            aspectRatio: '3/4',
            position: 'relative',
            overflow: 'hidden',
            background: '#111620',
          }}
        >
          <Image src={photo.url} alt="" fill style={{ objectFit: 'cover' }} sizes="33vw" />
          {photo.is_primary && (
            <div
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                fontSize: 9,
                color: '#c9a96e',
                background: 'rgba(201,169,110,0.15)',
                border: '1px solid rgba(201,169,110,0.3)',
                borderRadius: 999,
                padding: '2px 6px',
              }}
            >
              primary
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function VideoGrid({ videos }: { videos: CompanionProfileData['videos'] }) {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <LayoutGrid size={32} color="#1c2333" />
        <p style={{ fontSize: 13, color: '#4b5563', fontStyle: 'italic', textAlign: 'center' }}>
          No videos yet. Add short videos from your profile settings.
        </p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-3 gap-[2px]">
      {videos.map((video) => (
        <div
          key={video.id}
          style={{
            aspectRatio: '3/4',
            position: 'relative',
            overflow: 'hidden',
            background: '#111620',
          }}
        >
          {video.thumbnail_url ? (
            <Image
              src={video.thumbnail_url}
              alt=""
              fill
              style={{ objectFit: 'cover' }}
              sizes="33vw"
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg,#1a1228,#2a1535,#1a2240)',
              }}
            />
          )}
          {/* play overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.25)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(232,96,122,0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="12" height="14" viewBox="0 0 12 14" fill="white">
                <path d="M1 1l10 6-10 6V1z" />
              </svg>
            </div>
          </div>
          {video.duration_seconds && (
            <div
              style={{
                position: 'absolute',
                bottom: 6,
                right: 6,
                fontSize: 9,
                color: '#eeeef0',
                background: 'rgba(7,9,15,0.75)',
                borderRadius: 4,
                padding: '2px 5px',
              }}
            >
              {video.duration_seconds}s
            </div>
          )}
          {!video.is_approved && (
            <div
              style={{
                position: 'absolute',
                top: 6,
                left: 6,
                fontSize: 9,
                color: '#c9a96e',
                background: 'rgba(201,169,110,0.15)',
                border: '1px solid rgba(201,169,110,0.3)',
                borderRadius: 999,
                padding: '2px 6px',
              }}
            >
              pending
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function StoriesGrid({ stories }: { stories: CompanionProfileData['stories'] }) {
  if (stories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <LayoutGrid size={32} color="#1c2333" />
        <p style={{ fontSize: 13, color: '#4b5563', fontStyle: 'italic', textAlign: 'center' }}>
          No stories yet.
        </p>
      </div>
    )
  }
  const gradients = [
    'linear-gradient(135deg,#1a0e20,#2a1540)',
    'linear-gradient(135deg,#0e1a18,#101f30)',
    'linear-gradient(135deg,#1a1010,#2a1520)',
    'linear-gradient(135deg,#0f1428,#1a1040)',
  ]
  return (
    <div className="grid grid-cols-3 gap-[2px]">
      {stories.map((story, i) => (
        <div
          key={story.id}
          style={{
            aspectRatio: '3/4',
            position: 'relative',
            overflow: 'hidden',
            background: gradients[i % gradients.length],
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(transparent 40%, rgba(7,9,15,0.9) 100%)',
              display: 'flex',
              alignItems: 'flex-end',
              padding: 8,
            }}
          >
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 11,
                color: '#eeeef0',
                lineHeight: 1.4,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                margin: 0,
              }}
            >
              {story.title ?? 'Untitled'}
            </p>
          </div>
          {story.moderation_status === 'pending' && (
            <div
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                fontSize: 9,
                color: '#c9a96e',
                background: 'rgba(201,169,110,0.15)',
                border: '1px solid rgba(201,169,110,0.3)',
                borderRadius: 999,
                padding: '2px 6px',
              }}
            >
              pending
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function PostsTabContent({
  postsSubTab,
  setPostsSubTab,
  posts,
  postsLoading,
  photos,
  videos,
  stories,
  onPostTap,
  onWriteConfession,
  authorAlias,
}: {
  postsSubTab: PostsSubTab
  setPostsSubTab: (t: PostsSubTab) => void
  posts: UserPost[]
  postsLoading: boolean
  photos: CompanionProfileData['photos']
  videos: CompanionProfileData['videos']
  stories: CompanionProfileData['stories']
  onPostTap: (idx: number) => void
  onWriteConfession: () => void
  authorAlias: string | null
}) {
  const skeletonGrid = (
    <div className="grid grid-cols-3 gap-[2px]">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{ aspectRatio: '3/4', background: '#111620', borderRadius: 4 }}
          className="animate-pulse"
        />
      ))}
    </div>
  )

  return (
    <div>
      {/* Sub-tab pills */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {POSTS_SUB_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setPostsSubTab(id)}
            style={{
              flexShrink: 0,
              fontSize: 12,
              padding: '5px 14px',
              borderRadius: 999,
              border: `1px solid ${postsSubTab === id ? '#e8607a' : '#1c2333'}`,
              color: postsSubTab === id ? '#e8607a' : '#6b7280',
              background: postsSubTab === id ? 'rgba(232,96,122,0.08)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {postsLoading ? (
        skeletonGrid
      ) : (
        <>
          {postsSubTab === 'all' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {photos.length > 0 && <PhotoGrid photos={photos} />}
              {videos.length > 0 && <VideoGrid videos={videos} />}
              {posts.length > 0 ? (
                <div className="grid grid-cols-3 gap-[2px]">
                  {posts.map((post, idx) => (
                    <PostCell key={post.id} post={post} onTap={() => onPostTap(idx)} />
                  ))}
                </div>
              ) : (
                photos.length === 0 &&
                videos.length === 0 && (
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
                      Nothing posted yet.
                    </p>
                    <button
                      onClick={onWriteConfession}
                      className="text-[12px] text-[#e8607a] px-4 py-2 rounded-full mt-1 cursor-pointer"
                      style={{
                        border: '1px solid rgba(232,96,122,0.3)',
                        background: 'rgba(232,96,122,0.08)',
                      }}
                    >
                      Write your first confession →
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          {postsSubTab === 'photos' && <PhotoGrid photos={photos} />}

          {postsSubTab === 'videos' && <VideoGrid videos={videos} />}

          {postsSubTab === 'confessions' &&
            (posts.length === 0 ? (
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
                  onClick={onWriteConfession}
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
                  <PostCell key={post.id} post={post} onTap={() => onPostTap(idx)} />
                ))}
              </div>
            ))}

          {postsSubTab === 'stories' && <StoriesGrid stories={stories} />}
        </>
      )}
    </div>
  )
}

// ─── LikedTabContent ──────────────────────────────────────────────────────────

const LIKED_SUB_TABS: { id: LikedSubTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'confessions', label: 'Confessions' },
  { id: 'stories', label: 'Stories' },
]

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
  const { items, isLoading } = useSavedConfessions()

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

export default function CompanionProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const setAvatarUrl = useUIStore((s) => s.setAvatarUrl)
  const openProfileViewer = useUIStore((s) => s.openProfileViewer)

  const [activeTab, setActiveTab] = useState<MainTab>('posts')
  const [postsSubTab, setPostsSubTab] = useState<PostsSubTab>('all')
  const [likedSubTab, setLikedSubTab] = useState<LikedSubTab>('all')
  const [savedSubTab, setSavedSubTab] = useState<SavedSubTab>('all')
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  // ── Fetch companion profile ────────────────────────────────────────────────
  const { data: profileData, isLoading: loading } = useQuery<CompanionProfileData | null>({
    queryKey: ['companion', 'profile', 'full'],
    queryFn: () =>
      fetch('/api/companions/profile/full', { credentials: 'include' })
        .then((r) => r.json())
        .then((d) => (d.error ? null : d)),
    staleTime: 2 * 60 * 1000,
  })

  // ── Fetch posts (companion's own confessions/stories) ─────────────────────
  const { data: postsData, isLoading: postsLoading } = useQuery<UserPost[]>({
    queryKey: ['user', 'posts'],
    queryFn: () =>
      fetch('/api/users/posts', { credentials: 'include' })
        .then((r) => r.json())
        .then(({ data }) => data ?? []),
    staleTime: 2 * 60 * 1000,
  })
  const posts = postsData ?? []

  // ── Location detection ─────────────────────────────────────────────────────
  type LocationStatus = 'idle' | 'detecting' | 'failed' | 'picking'
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle')
  const geoAttemptedRef = useRef(false)

  const saveCompanionCity = useCallback(
    async (city: string) => {
      await fetch('/api/companions/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'B', city }),
      })
      queryClient.setQueryData<CompanionProfileData | null>(
        ['companion', 'profile', 'full'],
        (old) => (old ? { ...old, profile: { ...old.profile, city } } : old)
      )
    },
    [queryClient]
  )

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
          await saveCompanionCity(json.data.city)
          setLocationStatus('idle')
        } catch {
          setLocationStatus('failed')
        }
      },
      () => setLocationStatus('failed'),
      { timeout: 8000, maximumAge: 300_000 }
    )
  }, [saveCompanionCity])

  useEffect(() => {
    if (loading || profileData?.profile?.city || geoAttemptedRef.current) return
    geoAttemptedRef.current = true
    attemptGeolocation()
  }, [loading, profileData?.profile?.city, attemptGeolocation])

  // ── Sync avatar from profile data ─────────────────────────────────────────
  useEffect(() => {
    if (!profileData) return
    const primary =
      profileData.photos?.find((p: { is_primary: boolean }) => p.is_primary) ??
      profileData.photos?.[0]
    if (primary?.url) setAvatarUrl(primary.url)
  }, [profileData, setAvatarUrl])

  // ── Primary photo upload ───────────────────────────────────────────────────
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('JPG, PNG or WebP only.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image must be under 5 MB.')
      return
    }
    setPhotoUploading(true)
    setPhotoError(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/users/avatar', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload failed')
      const newUrl = json.data?.avatarUrl ?? json.avatarUrl
      if (newUrl) {
        queryClient.setQueryData<CompanionProfileData | null>(
          ['companion', 'profile', 'full'],
          (old) =>
            old
              ? {
                  ...old,
                  photos: [
                    { id: 'temp', url: newUrl, is_primary: true },
                    ...old.photos.filter((ph) => !ph.is_primary),
                  ],
                }
              : old
        )
        setAvatarUrl(newUrl)
      }
    } catch (err: unknown) {
      setPhotoError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setPhotoUploading(false)
    }
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const alias = profileData?.companion?.alias ?? session?.user?.alias ?? '@you'
  const initials = alias.replace('@', '').slice(0, 2).toUpperCase()
  const vibes =
    profileData?.available_vibe_tags
      .filter((t) => profileData.selected_vibe_tag_ids.includes(t.id))
      .map((t) => t.name) ?? []
  const desires =
    profileData?.available_fantasy_tags
      .filter((t) => profileData.selected_fantasy_tag_ids.includes(t.id))
      .map((t) => t.name) ?? []
  const primaryPhoto = profileData?.photos?.find((p) => p.is_primary) ?? profileData?.photos?.[0]
  const completeness = profileData?.profile?.profile_completeness ?? 0

  const TABS: { id: MainTab; icon: React.ReactNode }[] = [
    { id: 'posts', icon: <LayoutGrid size={20} /> },
    { id: 'likes', icon: <Heart size={20} /> },
    { id: 'saved', icon: <Bookmark size={20} /> },
  ]

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
            {/* Avatar / primary photo */}
            <div
              className="relative group cursor-pointer"
              style={{ width: 96, height: 96 }}
              onClick={() => !photoUploading && photoInputRef.current?.click()}
            >
              {primaryPhoto?.url ? (
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: '50%',
                    backgroundImage: `url(${primaryPhoto.url})`,
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
                    background: 'linear-gradient(135deg,#1a1228,#2a1535,#1a2240)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #1c2333',
                  }}
                >
                  <svg width="40" height="80" viewBox="0 0 70 140" fill="rgba(255,255,255,0.15)">
                    <ellipse cx="35" cy="22" rx="16" ry="18" />
                    <path d="M12 68 Q18 45 35 43 Q52 45 58 68 L60 130 Q50 138 35 140 Q20 138 10 130Z" />
                  </svg>
                </div>
              )}
              {photoUploading ? (
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

            {photoError && (
              <p style={{ fontSize: 11, color: '#e87070', textAlign: 'center' }}>{photoError}</p>
            )}

            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
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

            {profileData?.companion?.name && (
              <div style={{ fontSize: 13, color: '#9ca3af', marginTop: -6 }}>
                {profileData.companion.name}
              </div>
            )}

            {profileData?.profile?.bio && (
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
                {profileData.profile.bio}
              </p>
            )}

            {/* ── Location block ── */}
            {profileData?.profile?.city ? (
              <button
                onClick={() => setLocationStatus('picking')}
                className="flex items-center gap-[5px] bg-transparent border-none cursor-pointer p-0 transition-opacity hover:opacity-70"
                style={{ fontSize: 12, color: '#6b7280' }}
              >
                <MapPin size={12} color="#6b7280" />
                {profileData.profile.city}
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
                saveCity={saveCompanionCity}
                onSaved={(city) => {
                  queryClient.setQueryData<CompanionProfileData | null>(
                    ['companion', 'profile', 'full'],
                    (old) => (old ? { ...old, profile: { ...old.profile, city } } : old)
                  )
                  setLocationStatus('idle')
                }}
                onCancel={() => setLocationStatus(profileData?.profile?.city ? 'idle' : 'failed')}
              />
            ) : locationStatus === 'failed' ? (
              <div className="flex flex-col items-center gap-[10px]">
                <span style={{ fontSize: 11, color: '#4b5563' }}>
                  We couldn't find your location
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

            {/* Role badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                className="text-[11px] px-[10px] py-1 rounded-full text-[#c9a96e]"
                style={{
                  border: '1px solid rgba(201,169,110,0.35)',
                  background: 'rgba(201,169,110,0.08)',
                }}
              >
                ✦ Companion
              </span>
              {profileData?.profile?.is_verified && (
                <span
                  className="text-[11px] px-[10px] py-1 rounded-full text-[#c9a96e]"
                  style={{
                    border: '1px solid rgba(201,169,110,0.35)',
                    background: 'rgba(201,169,110,0.08)',
                  }}
                >
                  Verified
                </span>
              )}
            </div>

            {/* Profile completeness prompt */}
            {completeness < 100 && (
              <button
                onClick={() => router.push('/companion/profile/builder')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: '#e8607a',
                  background: 'rgba(232,96,122,0.08)',
                  border: '1px solid rgba(232,96,122,0.3)',
                  borderRadius: 999,
                  padding: '6px 14px',
                  cursor: 'pointer',
                }}
              >
                <Settings2 size={12} />
                Complete your profile — {completeness}%
              </button>
            )}
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

          {/* ── Section 3: Vibe tags ──────────────────────────── */}
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
                my vibe
              </span>
              <button
                onClick={() => router.push('/companion/profile/builder')}
                className="flex items-center gap-[5px] bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-[#eeeef0]"
                style={{ fontSize: 12, color: '#e8607a', padding: 0 }}
              >
                <Settings2 size={11} />
                Edit
              </button>
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
                onClick={() => router.push('/companion/profile/builder')}
                className="text-[12px] bg-transparent border-none cursor-pointer p-0 transition-colors hover:text-[#eeeef0]"
                style={{ color: '#4b5563', fontStyle: 'italic' }}
              >
                Nothing yet — tap Edit to add your vibe tags.
              </button>
            )}
          </div>

          {/* ── Section 3b: Desires (fantasy tags) ──────────── */}
          {desires.length > 0 && (
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
                  my desires
                </span>
                <button
                  onClick={() => router.push('/companion/profile/builder')}
                  className="flex items-center gap-[5px] bg-transparent border-none cursor-pointer transition-colors duration-150 hover:text-[#eeeef0]"
                  style={{ fontSize: 12, color: '#e8607a', padding: 0 }}
                >
                  <Settings2 size={11} />
                  Edit
                </button>
              </div>
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
            </div>
          )}

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
            {activeTab === 'posts' && (
              <PostsTabContent
                postsSubTab={postsSubTab}
                setPostsSubTab={setPostsSubTab}
                posts={posts}
                postsLoading={postsLoading}
                photos={profileData?.photos ?? []}
                videos={profileData?.videos ?? []}
                stories={profileData?.stories ?? []}
                onPostTap={(idx) => {
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
                    authorAlias: session?.user?.alias ?? null,
                    isAnonymous: false,
                    createdAt: p.createdAt,
                  }))
                  openProfileViewer(storiesArray, idx, 'own')
                }}
                onWriteConfession={() => router.push('/create')}
                authorAlias={session?.user?.alias ?? null}
              />
            )}

            {activeTab === 'likes' && (
              <LikesTabContent likedSubTab={likedSubTab} setLikedSubTab={setLikedSubTab} />
            )}

            {activeTab === 'saved' && (
              <SavedTabContent savedSubTab={savedSubTab} setSavedSubTab={setSavedSubTab} />
            )}
          </div>
        </motion.main>
      )}
    </>
  )
}
