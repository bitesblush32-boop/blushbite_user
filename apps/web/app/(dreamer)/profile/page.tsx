'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Camera,
  LayoutGrid, Heart, Bookmark, BookMarked, Pencil,
} from 'lucide-react'
import EditProfileDrawer from '@/components/ui/EditProfileDrawer'
import TasteDrawer, { type TasteData } from '@/components/ui/TasteDrawer'
import { SavedConfessionsGrid } from '@/components/ui/SavedConfessionsGrid'
import { ConfessionsCollectionCard } from '@/components/ui/ConfessionsCollectionCard'
import { useSavedConfessions } from '@/hooks/useSavedConfessions'
import { useUIStore } from '@/store/uiStore'

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface UserPost {
  id:               string
  title:            string | null
  excerpt:          string | null
  firstImage:       string | null
  pageImageUrls:    string[]
  categories:       string[]
  likeCount:        number
  saveCount:        number
  viewCount:        number
  commentCount:     number
  moderationStatus: string
  createdAt:        string
}

type MainTab    = 'posts' | 'likes' | 'saved'
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

function PostCell({
  post,
  isDeleting,
  onDelete,
}: {
  post: UserPost
  isDeleting: boolean
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      style={{ aspectRatio: '3/4', position: 'relative', overflow: 'hidden',
               background: '#111620', cursor: 'pointer' }}
      onClick={() => !menuOpen && setMenuOpen(false)}
    >
      {post.firstImage ? (
        <img
          src={post.firstImage}
          alt={post.title ?? 'Confession'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(160deg, #0d1117 0%, #07090f 60%, #0d0a12 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '12px',
        }}>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 11, color: '#6b7280', lineHeight: 1.6,
            textAlign: 'center', overflow: 'hidden',
            display: '-webkit-box', WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
          }}>
            {post.excerpt ?? ''}
          </p>
        </div>
      )}

      <button
        onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
        style={{
          position: 'absolute', top: 6, right: 6,
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(7,9,15,0.72)', border: 'none',
          color: '#eeeef0', fontSize: 16, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}
      >
        ⋯
      </button>

      {menuOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={e => { e.stopPropagation(); setMenuOpen(false) }}
          />
          <div style={{
            position: 'absolute', top: 36, right: 6, zIndex: 50,
            background: '#161d2a', border: '1px solid #1c2333',
            borderRadius: 10, overflow: 'hidden', minWidth: 140,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}>
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete() }}
              disabled={isDeleting}
              style={{
                width: '100%', padding: '10px 14px', background: 'transparent',
                border: 'none', textAlign: 'left', fontSize: 13,
                color: isDeleting ? '#6b7280' : '#e87070',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => { if (!isDeleting) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,96,122,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              {isDeleting ? '⏳ Deleting…' : '🗑 Delete'}
            </button>
          </div>
        </>
      )}

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(transparent, rgba(7,9,15,0.85))',
        padding: '16px 8px 8px',
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <span style={{ fontSize: 10, color: '#eeeef0', display: 'flex', alignItems: 'center', gap: 3 }}>
          ♥ {post.likeCount}
        </span>
        <span style={{ fontSize: 10, color: '#eeeef0', display: 'flex', alignItems: 'center', gap: 3 }}>
          💬 {post.commentCount}
        </span>
        {post.moderationStatus === 'pending' && (
          <span style={{
            fontSize: 9, color: '#c9a96e', marginLeft: 'auto',
            background: 'rgba(201,169,110,0.12)',
            border: '1px solid rgba(201,169,110,0.25)',
            borderRadius: 20, padding: '1px 6px',
          }}>
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
      <div className="absolute inset-0 flex items-end p-3"
        style={{ background: 'linear-gradient(transparent 40%, rgba(7,9,15,0.9) 100%)' }}>
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
            <div key={i} style={{
              width: 3, borderRadius: 2, background: 'rgba(232,96,122,0.6)',
              height: `${10 + (i % 4) * 5}px`,
              animation: `wave 1.2s ease-in-out ${(i * 0.1).toFixed(1)}s infinite`,
            }} />
          ))}
        </div>
      </div>
      <div className="absolute inset-0 flex items-end p-3"
        style={{ background: 'linear-gradient(transparent 50%, rgba(7,9,15,0.9) 100%)' }}>
        <div>
          <div style={{ fontSize: 12, color: '#eeeef0' }}>{title}</div>
          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{voice}</div>
        </div>
      </div>
    </div>
  )
}

// ─── SavedTabContent ──────────────────────────────────────────────────────────

const SAVED_SUB_TABS: { id: SavedSubTab; label: string }[] = [
  { id: 'all',         label: 'All' },
  { id: 'collections', label: 'Collections' },
  { id: 'companions',  label: 'Companions' },
]

function SavedTabContent({
  savedSubTab,
  setSavedSubTab,
}: {
  savedSubTab:    SavedSubTab
  setSavedSubTab: (t: SavedSubTab) => void
}) {
  const { items, total, isLoading } = useSavedConfessions()

  const coverImages = items
    .slice(0, 4)
    .map(i => i.firstImage)
    .filter((v): v is string => Boolean(v))

  const skeletonGrid = (
    <div className="grid grid-cols-3 gap-[2px]">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} style={{ aspectRatio: '3/4', background: '#111620' }} className="animate-pulse" />
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
              flexShrink:   0,
              fontSize:     12,
              padding:      '5px 14px',
              borderRadius: 999,
              border:       `1px solid ${savedSubTab === id ? '#e8607a' : '#1c2333'}`,
              color:        savedSubTab === id ? '#e8607a' : '#6b7280',
              background:   savedSubTab === id ? 'rgba(232,96,122,0.08)' : 'transparent',
              cursor:       'pointer',
              transition:   'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      {savedSubTab === 'all' && (
        isLoading ? skeletonGrid : <SavedConfessionsGrid items={items} />
      )}

      {savedSubTab === 'collections' && (
        isLoading ? (
          <div style={{ height: 140, borderRadius: 14, background: '#0d1117', border: '1px solid #1c2333' }}
            className="animate-pulse" />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <BookMarked size={32} color="#1c2333" />
            <p style={{ fontSize: 13, color: '#4b5563', fontStyle: 'italic', textAlign: 'center' }}>
              No collections yet. Save confessions to create your first.
            </p>
          </div>
        ) : (
          <ConfessionsCollectionCard count={total} coverImages={coverImages} />
        )
      )}

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
  const { data: session } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const setAvatarUrl = useUIStore(s => s.setAvatarUrl)

  const [profile, setProfile]               = useState<UserProfile | null>(null)
  const [loading, setLoading]               = useState(true)
  const [editOpen, setEditOpen]             = useState(false)
  const [tasteOpen, setTasteOpen]           = useState(false)
  const [activeTab, setActiveTab]           = useState<MainTab>('posts')
  const [savedSubTab, setSavedSubTab]       = useState<SavedSubTab>('all')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError]       = useState<string | null>(null)

  const [posts, setPosts]               = useState<UserPost[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [deletingId, setDeletingId]     = useState<string | null>(null)

  // ── Fetch profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/users/profile', { credentials: 'include' })
      .then(r => r.json())
      .then(({ data }) => {
        setProfile(data ?? null)
        setAvatarUrl(data?.avatar_url ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [setAvatarUrl])

  // ── Fetch posts ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/users/posts', { credentials: 'include' })
      .then(r => r.json())
      .then(({ data }) => setPosts(data ?? []))
      .catch(() => {})
      .finally(() => setPostsLoading(false))
  }, [])

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
      const res  = await fetch('/api/users/avatar', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload failed')
      setProfile(p => p ? { ...p, avatar_url: json.data.avatarUrl } : p)
      setAvatarUrl(json.data.avatarUrl)
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setAvatarUploading(false)
    }
  }

  // ── Delete post ────────────────────────────────────────────────────────────
  async function handleDeletePost(postId: string) {
    if (!confirm('Delete this confession? This cannot be undone.')) return
    setDeletingId(postId)
    try {
      const res = await fetch(`/api/users/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId))
      }
    } catch {}
    finally { setDeletingId(null) }
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const alias    = profile?.alias ?? session?.user?.alias ?? '@you'
  const initials = alias.replace('@', '').slice(0, 2).toUpperCase()
  const vibes    = profile?.vibes?.length           ? profile.vibes           : []
  const desires  = profile?.desired_genders?.length ? profile.desired_genders : []

  const TABS: { id: MainTab; icon: React.ReactNode }[] = [
    { id: 'posts', icon: <LayoutGrid size={20} /> },
    { id: 'likes', icon: <Heart size={20} /> },
    { id: 'saved', icon: <Bookmark size={20} /> },
  ]

  return (
    <>
      {loading ? <Skeleton /> : (
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
                <div style={{
                  width: 96, height: 96, borderRadius: '50%',
                  backgroundImage: `url(${profile.avatar_url})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  border: '2px solid #1c2333',
                }} />
              ) : (
                <div style={{
                  width: 96, height: 96, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#e8607a,#9b5fe0)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 600, color: '#fff',
                  border: '2px solid #1c2333',
                }}>
                  {initials}
                </div>
              )}
              {avatarUploading ? (
                <div className="absolute inset-0 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.55)' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                </div>
              ) : (
                <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: 'rgba(7,9,15,0.65)' }}>
                  <Camera size={20} color="#eeeef0" />
                </div>
              )}
            </div>

            {avatarError && (
              <p style={{ fontSize: 11, color: '#e87070', textAlign: 'center' }}>{avatarError}</p>
            )}

            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }} onChange={handleAvatarChange} />

            {/* Alias */}
            <div style={{
              fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#e8607a',
              letterSpacing: '-0.01em',
            }}>
              {alias}
            </div>

            {profile?.display_name && (
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: -6 }}>
                {profile.display_name}
              </div>
            )}

            {profile?.bio && (
              <p style={{
                fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 1.6,
                maxWidth: 320, fontStyle: 'italic',
              }}>
                {profile.bio}
              </p>
            )}

            <span className="text-[11px] px-[10px] py-1 rounded-full text-[#e8607a]"
              style={{ border: '1px solid rgba(232,96,122,0.3)', background: 'rgba(232,96,122,0.08)' }}>
              The Dreamer
            </span>

            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-[6px] bg-transparent text-[#6b7280] border border-[#1c2333] px-[18px] py-[8px] rounded-[10px] text-[13px] cursor-pointer transition-all duration-200 hover:border-white/20 hover:text-[#eeeef0] mt-1"
            >
              <Pencil size={13} />
              Edit profile
            </button>
          </div>

          {/* ── Section 2: Stats ─────────────────────────────── */}
          <div className="flex items-center justify-center gap-0 mb-7">
            {[
              { n: posts.length.toString(),                                label: 'confessions' },
              { n: posts.reduce((a, p) => a + p.likeCount, 0).toString(), label: 'likes' },
              { n: posts.reduce((a, p) => a + p.saveCount, 0).toString(), label: 'saved' },
            ].map(({ n, label }, i) => (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center px-6 py-2">
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#eeeef0' }}>{n}</span>
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
              <span style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
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
              <div style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                vibes
              </div>
              {vibes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {vibes.map(t => (
                    <span key={t} className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">{t}</span>
                  ))}
                </div>
              ) : (
                <button onClick={() => setTasteOpen(true)}
                  className="text-[12px] bg-transparent border-none cursor-pointer p-0 transition-colors hover:text-[#eeeef0]"
                  style={{ color: '#4b5563', fontStyle: 'italic' }}>
                  Nothing yet — tap Edit to add your vibes.
                </button>
              )}
            </div>

            <div>
              <div style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                desires
              </div>
              {desires.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {desires.map(t => (
                    <span key={t} className="text-[11px] px-[10px] py-1 rounded-full text-[#e8607a]"
                      style={{ border: '1px solid rgba(232,96,122,0.3)', background: 'rgba(232,96,122,0.08)' }}>
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <button onClick={() => setTasteOpen(true)}
                  className="text-[12px] bg-transparent border-none cursor-pointer p-0 transition-colors hover:text-[#eeeef0]"
                  style={{ color: '#4b5563', fontStyle: 'italic' }}>
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
                  color:       activeTab === id ? '#e8607a' : '#4b5563',
                }}
              >
                {icon}
              </button>
            ))}
          </div>

          <div className="pt-4 mb-8">
            {activeTab === 'posts' && (
              postsLoading ? (
                <div className="grid grid-cols-3 gap-[2px]">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ aspectRatio: '3/4', background: '#111620', borderRadius: 4 }}
                      className="animate-pulse" />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <LayoutGrid size={32} color="#1c2333" />
                  <p style={{ fontSize: 13, color: '#4b5563', fontStyle: 'italic', textAlign: 'center' }}>
                    Your confessions will appear here.
                  </p>
                  <button
                    onClick={() => router.push('/create')}
                    className="text-[12px] text-[#e8607a] px-4 py-2 rounded-full mt-1 cursor-pointer"
                    style={{ border: '1px solid rgba(232,96,122,0.3)', background: 'rgba(232,96,122,0.08)' }}
                  >
                    Write your first confession →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-[2px]">
                  {posts.map(post => (
                    <PostCell
                      key={post.id}
                      post={post}
                      isDeleting={deletingId === post.id}
                      onDelete={() => handleDeletePost(post.id)}
                    />
                  ))}
                </div>
              )
            )}

            {activeTab === 'likes' && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Heart size={32} color="#1c2333" />
                <p style={{ fontSize: 13, color: '#4b5563', fontStyle: 'italic', textAlign: 'center' }}>
                  Confessions you've liked will appear here.
                </p>
              </div>
            )}

            {activeTab === 'saved' && (
              <SavedTabContent
                savedSubTab={savedSubTab}
                setSavedSubTab={setSavedSubTab}
              />
            )}
          </div>

        </motion.main>
      )}

      {/* ── Edit profile drawer ───────────────────────────────── */}
      <EditProfileDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        currentAvatar={profile?.avatar_url ?? null}
        onSaved={(d) => {
          setProfile(p => p ? { ...p, ...d } : p)
          if (d.avatar_url) setAvatarUrl(d.avatar_url)
        }}
        defaults={{
          alias:       profile?.alias         ?? undefined,
          bio:         profile?.bio          ?? undefined,
          dateOfBirth: profile?.date_of_birth ?? undefined,
          country:     profile?.country      ?? undefined,
          city:        profile?.city         ?? undefined,
        }}
      />

      {/* ── Taste drawer ─────────────────────────────────────── */}
      <TasteDrawer
        open={tasteOpen}
        onClose={() => setTasteOpen(false)}
        onSaved={(d: TasteData) => setProfile(p => p ? {
          ...p,
          vibes:           d.vibes,
          gender:          d.gender,
          desired_genders: d.desiredGenders,
        } : p)}
        defaults={{
          vibes:          profile?.vibes          ?? [],
          gender:         profile?.gender         ?? '',
          desiredGenders: profile?.desired_genders ?? [],
        }}
      />
    </>
  )
}
