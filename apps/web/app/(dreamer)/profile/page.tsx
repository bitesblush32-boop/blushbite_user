'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Camera, Lock, HelpCircle, LogOut,
  UserRound, BookOpen, Headphones, Pencil,
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

type SavedTab = 'companions' | 'stories' | 'audio'

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

// ─── Saved grid cells ─────────────────────────────────────────────────────────

function CompanionCell({ name, gradient }: { name: string; gradient: string }) {
  return (
    <div
      className="rounded-[12px] overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
      style={{ background: gradient, aspectRatio: '3/4', position: 'relative' }}
    >
      <div className="absolute inset-0 flex items-end p-3"
        style={{ background: 'linear-gradient(transparent 50%, rgba(7,9,15,0.85) 100%)' }}>
        <span style={{ fontSize: 13, color: '#eeeef0', fontFamily: "'Playfair Display', serif" }}>{name}</span>
      </div>
    </div>
  )
}

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
      {/* Waveform bars */}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const setAvatarUrl = useUIStore(s => s.setAvatarUrl)

  const [profile, setProfile]             = useState<UserProfile | null>(null)
  const [loading, setLoading]             = useState(true)
  const [editOpen, setEditOpen]           = useState(false)
  const [tasteOpen, setTasteOpen]         = useState(false)
  const [activeTab, setActiveTab]         = useState<SavedTab>('companions')
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

  const TABS: { id: SavedTab; icon: React.ReactNode }[] = [
    { id: 'companions', icon: <UserRound size={20} /> },
    { id: 'stories',    icon: <BookOpen size={20} /> },
    { id: 'audio',      icon: <Headphones size={20} /> },
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

            {/* Alias — hero name */}
            <div style={{
              fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#e8607a',
              letterSpacing: '-0.01em',
            }}>
              {alias}
            </div>

            {/* Display name */}
            {profile?.display_name && (
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: -6 }}>
                {profile.display_name}
              </div>
            )}

            {/* Bio */}
            {profile?.bio && (
              <p style={{
                fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 1.6,
                maxWidth: 320, fontStyle: 'italic',
              }}>
                {profile.bio}
              </p>
            )}

            {/* Role chip */}
            <span className="text-[11px] px-[10px] py-1 rounded-full text-[#e8607a]"
              style={{ border: '1px solid rgba(232,96,122,0.3)', background: 'rgba(232,96,122,0.08)' }}>
              The Dreamer
            </span>

            {/* Edit profile button */}
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
              { n: '12', label: 'companions' },
              { n: '34', label: 'stories' },
              { n: '8',  label: 'audio' },
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

            {/* Vibes */}
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

            {/* Desires */}
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

          {/* ── Section 4: Saved tabs ────────────────────────── */}
          {/* Tab bar — icon only, Instagram style */}
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

          {/* Tab content */}
          <div className="pt-4 mb-8">
            {activeTab === 'companions' && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {companions.map(c => (
                  <CompanionCell key={c.id} name={c.name} gradient={c.gradient} />
                ))}
              </div>
            )}
            {activeTab === 'stories' && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {stories.map(s => (
                  <StoryCell key={s.id} title={s.title} gradient={s.gradient} />
                ))}
              </div>
            )}
            {activeTab === 'audio' && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {audios.map(a => (
                  <AudioCell key={a.id} title={a.title} voice={a.voice} gradient={a.gradient} />
                ))}
              </div>
            )}
          </div>

          <div style={{ height: 1, background: '#1c2333', marginBottom: 20 }} />

          {/* ── Section 5: Account actions ───────────────────── */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push('/privacy')}
              className="flex justify-between items-center bg-[#111620] border border-[#1c2333] rounded-[12px] px-4 py-[14px] cursor-pointer transition-colors duration-200 hover:border-white/10 w-full"
            >
              <span className="flex items-center gap-[10px]">
                <Lock size={15} color="#6b7280" />
                <span style={{ fontSize: 13, color: '#6b7280' }}>Privacy &amp; safety</span>
              </span>
            </button>

            <button
              onClick={() => router.push('/help')}
              className="flex justify-between items-center bg-[#111620] border border-[#1c2333] rounded-[12px] px-4 py-[14px] cursor-pointer transition-colors duration-200 hover:border-white/10 w-full"
            >
              <span className="flex items-center gap-[10px]">
                <HelpCircle size={15} color="#6b7280" />
                <span style={{ fontSize: 13, color: '#6b7280' }}>Help &amp; support</span>
              </span>
            </button>

            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="flex items-center bg-[#111620] border border-[#1c2333] rounded-[12px] px-4 py-[14px] cursor-pointer transition-colors duration-200 hover:border-[rgba(232,96,122,0.2)] w-full gap-[10px]"
            >
              <LogOut size={15} color="#e87070" />
              <span style={{ fontSize: 13, color: '#e87070' }}>Sign out</span>
            </button>
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
          displayName: profile?.display_name ?? undefined,
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
