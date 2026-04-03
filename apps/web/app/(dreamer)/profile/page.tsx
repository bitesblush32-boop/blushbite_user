'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, Lock, HelpCircle, LogOut,
  Heart, Bookmark, LayoutGrid, MoreHorizontal, Pencil,
} from 'lucide-react'
import EditProfileDrawer from '@/components/ui/EditProfileDrawer'
import TasteDrawer, { type TasteData } from '@/components/ui/TasteDrawer'
import { useUIStore } from '@/store/uiStore'
import { companions, stories, audios } from '@/lib/data'

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

type MainTab     = 'posts' | 'likes' | 'saved'
type SavedSubTab = 'all' | 'collections' | 'companions' | 'posts' | 'audio'

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

// ─── Grid cells ───────────────────────────────────────────────────────────────

function CompanionCell({ name, gradient }: { name: string; gradient: string }) {
  return (
    <div className="rounded-[12px] overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
      style={{ background: gradient, aspectRatio: '3/4', position: 'relative' }}>
      <div className="absolute inset-0 flex items-end p-3"
        style={{ background: 'linear-gradient(transparent 50%, rgba(7,9,15,0.85) 100%)' }}>
        <span style={{ fontSize: 13, color: '#eeeef0', fontFamily: "'Playfair Display', serif" }}>{name}</span>
      </div>
    </div>
  )
}

function StoryCell({ title, gradient }: { title: string; gradient: string }) {
  return (
    <div className="rounded-[12px] overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
      style={{ background: gradient, aspectRatio: '3/4', position: 'relative' }}>
      <div className="absolute inset-0 flex items-end p-3"
        style={{ background: 'linear-gradient(transparent 40%, rgba(7,9,15,0.9) 100%)' }}>
        <span style={{ fontSize: 12, color: '#eeeef0', lineHeight: 1.35 }}>{title}</span>
      </div>
    </div>
  )
}

function AudioCell({ title, voice, gradient }: { title: string; voice: string; gradient: string }) {
  return (
    <div className="rounded-[12px] overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
      style={{ background: gradient, aspectRatio: '3/4', position: 'relative' }}>
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

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 14, color: '#4b5563', textAlign: 'center' }}>
        {message}
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const menuRef      = useRef<HTMLDivElement>(null)
  const setAvatarUrl = useUIStore(s => s.setAvatarUrl)

  const [profile, setProfile]             = useState<UserProfile | null>(null)
  const [loading, setLoading]             = useState(true)
  const [editOpen, setEditOpen]           = useState(false)
  const [tasteOpen, setTasteOpen]         = useState(false)
  const [menuOpen, setMenuOpen]           = useState(false)
  const [activeTab, setActiveTab]         = useState<MainTab>('posts')
  const [savedSubTab, setSavedSubTab]     = useState<SavedSubTab>('all')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError]     = useState<string | null>(null)

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

  // ── Close 3-dot menu on outside click ─────────────────────────────────────
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

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

  // ── Derived values ─────────────────────────────────────────────────────────
  const alias    = profile?.alias ?? session?.user?.alias ?? '@you'
  const initials = alias.replace('@', '').slice(0, 2).toUpperCase()
  const vibes    = profile?.vibes?.length           ? profile.vibes           : []
  const desires  = profile?.desired_genders?.length ? profile.desired_genders : []

  const MAIN_TABS: { id: MainTab; icon: React.ReactNode }[] = [
    { id: 'posts', icon: <LayoutGrid size={19} /> },
    { id: 'likes', icon: <Heart size={19} /> },
    { id: 'saved', icon: <Bookmark size={19} /> },
  ]

  const SAVED_SUB_TABS: { id: SavedSubTab; label: string }[] = [
    { id: 'all',         label: 'All' },
    { id: 'collections', label: 'Collections' },
    { id: 'companions',  label: 'Companions' },
    { id: 'posts',       label: 'Posts' },
    { id: 'audio',       label: 'Audio' },
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

          {/* ── 3-dot menu ──────────────────────────────────────── */}
          <div ref={menuRef} className="flex justify-end mb-[-8px] relative">
            <button
              onClick={() => setMenuOpen(m => !m)}
              className="w-[36px] h-[36px] rounded-full flex items-center justify-center transition-colors duration-200"
              style={{
                background: menuOpen ? 'rgba(232,96,122,0.1)' : 'transparent',
                color: menuOpen ? '#e8607a' : '#6b7280',
              }}
            >
              <MoreHorizontal size={20} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-2 w-[210px] rounded-[14px] overflow-hidden z-50"
                  style={{
                    background: '#0d1117',
                    border: '1px solid #1c2333',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                  }}
                >
                  <button
                    onClick={() => { setEditOpen(true); setMenuOpen(false) }}
                    className="w-full flex items-center gap-3 px-4 py-[13px] transition-colors duration-150 hover:bg-white/[0.04] border-b border-[#1c2333]"
                  >
                    <Pencil size={14} color="#6b7280" />
                    <span style={{ fontSize: 13, color: '#eeeef0' }}>Edit profile</span>
                  </button>
                  <button
                    onClick={() => { router.push('/privacy'); setMenuOpen(false) }}
                    className="w-full flex items-center gap-3 px-4 py-[13px] transition-colors duration-150 hover:bg-white/[0.04] border-b border-[#1c2333]"
                  >
                    <Lock size={14} color="#6b7280" />
                    <span style={{ fontSize: 13, color: '#eeeef0' }}>Privacy &amp; safety</span>
                  </button>
                  <button
                    onClick={() => { router.push('/help'); setMenuOpen(false) }}
                    className="w-full flex items-center gap-3 px-4 py-[13px] transition-colors duration-150 hover:bg-white/[0.04] border-b border-[#1c2333]"
                  >
                    <HelpCircle size={14} color="#6b7280" />
                    <span style={{ fontSize: 13, color: '#eeeef0' }}>Help &amp; support</span>
                  </button>
                  <button
                    onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                    className="w-full flex items-center gap-3 px-4 py-[13px] transition-colors duration-150 hover:bg-white/[0.04]"
                  >
                    <LogOut size={14} color="#e87070" />
                    <span style={{ fontSize: 13, color: '#e87070' }}>Sign out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Section 1: Hero identity ─────────────────────────── */}
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
          </div>

          <div style={{ height: 1, background: '#1c2333', marginBottom: 28 }} />

          {/* ── Section 2: Your taste ────────────────────────────── */}
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

          <div style={{ height: 1, background: '#1c2333' }} />

          {/* ── Section 3: Main tabs ─────────────────────────────── */}
          <div className="flex border-b border-[#1c2333]">
            {MAIN_TABS.map(({ id, icon }) => (
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

          {/* ── Tab content ──────────────────────────────────────── */}
          <div className="pt-4 mb-8">

            {/* Posts — user's own posts */}
            {activeTab === 'posts' && (
              <EmptyState message="Nothing posted yet. Your stories will appear here." />
            )}

            {/* Likes — companions + posts mixed in one grid */}
            {activeTab === 'likes' && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {companions.slice(0, 3).map(c => (
                  <CompanionCell key={`c-${c.id}`} name={c.name} gradient={c.gradient} />
                ))}
                {stories.slice(0, 4).map(s => (
                  <StoryCell key={`s-${s.id}`} title={s.title} gradient={s.gradient} />
                ))}
              </div>
            )}

            {/* Saved — sub-tabs */}
            {activeTab === 'saved' && (
              <>
                {/* Sub-tab pills */}
                <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {SAVED_SUB_TABS.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setSavedSubTab(id)}
                      className="text-[12px] px-[14px] py-[6px] rounded-full border cursor-pointer transition-all duration-150 flex-shrink-0"
                      style={{
                        borderColor: savedSubTab === id ? '#e8607a' : '#1c2333',
                        color:       savedSubTab === id ? '#e8607a' : '#6b7280',
                        background:  savedSubTab === id ? 'rgba(232,96,122,0.08)' : 'transparent',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Sub-tab content — all empty for now */}
                {savedSubTab === 'all' && (
                  <EmptyState message="Nothing saved yet. Your taste is still forming." />
                )}
                {savedSubTab === 'posts' && (
                  <EmptyState message="Saved posts will appear here." />
                )}
                {savedSubTab === 'audio' && (
                  <EmptyState message="Saved audio will appear here." />
                )}
                {savedSubTab === 'collections' && (
                  <EmptyState message="No collections yet. Save posts into named collections to find them here." />
                )}
                {savedSubTab === 'companions' && (
                  <EmptyState message="Saved companions will appear here." />
                )}
              </>
            )}
          </div>

        </motion.main>
      )}

      {/* ── Edit profile drawer ───────────────────────────────────── */}
      <EditProfileDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        currentAvatar={profile?.avatar_url ?? null}
        onSaved={(d) => {
          setProfile(p => p ? { ...p, ...d } : p)
          if (d.avatar_url) setAvatarUrl(d.avatar_url)
        }}
        defaults={{
          displayName: profile?.display_name ?? undefined,
          bio:         profile?.bio          ?? undefined,
          dateOfBirth: profile?.date_of_birth ?? undefined,
          country:     profile?.country      ?? undefined,
          city:        profile?.city         ?? undefined,
        }}
      />

      {/* ── Taste drawer ─────────────────────────────────────────── */}
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
