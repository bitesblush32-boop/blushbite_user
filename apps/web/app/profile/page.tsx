'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Camera, Lock, HelpCircle, LogOut,
  MapPin, Calendar, Mail, Edit2, ChevronRight,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import EditProfileDrawer from '@/components/ui/EditProfileDrawer'

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMonth(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

function formatDOB(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const FALLBACK_MOODS   = ['Longing', 'Curious', 'Charged', 'Tender']
const SAVE_TILES = [
  { value: '12', label: 'companions' },
  { value: '34', label: 'stories' },
  { value: '8',  label: 'audio' },
]

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="flex flex-col items-center gap-4 pt-[95px] pb-[120px] px-5 max-w-[640px] mx-auto">
      <div className="w-[80px] h-[80px] rounded-full bg-[#111620] animate-pulse" />
      <div className="h-[22px] w-[160px] bg-[#111620] animate-pulse rounded-[8px]" />
      <div className="h-[14px] w-[100px] bg-[#111620] animate-pulse rounded-[8px]" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile]       = useState<UserProfile | null>(null)
  const [loading, setLoading]       = useState(true)
  const [editOpen, setEditOpen]     = useState(false) // Phase 3 edit drawer
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError]         = useState<string | null>(null)

  // ── Fetch profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/user/profile', { credentials: 'include' })
      .then(r => r.json())
      .then(({ data }) => setProfile(data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── Avatar upload ──────────────────────────────────────────────────────────
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side pre-validation
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setAvatarError('Please upload a JPG or PNG image.')
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
      const res  = await fetch('/api/user/avatar', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload failed')
      setProfile(p => p ? { ...p, avatar_url: json.data.avatarUrl } : p)
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : 'Upload failed. Try again.')
    } finally {
      setAvatarUploading(false)
    }
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const alias    = profile?.alias ?? session?.user?.alias ?? '@you'
  const initials = alias.replace('@', '').slice(0, 2).toUpperCase()
  const vibes    = profile?.vibes?.length       ? profile.vibes       : []
  const desires  = profile?.desired_genders?.length ? profile.desired_genders : []
  const moods    = FALLBACK_MOODS // Phase 2: from user_mood_tags

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#07090f]">

      {/* Noise texture */}
      <div
        className="fixed inset-0 pointer-events-none z-[1000] opacity-60"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient rose glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(232,96,122,0.06) 0%, transparent 70%)' }}
      />

      <Header />

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

          {/* ── Section 1: Avatar + Identity ────────────────── */}
          <div className="flex flex-col items-center gap-3 mb-8">

            {/* Avatar */}
            <div
              className="relative group cursor-pointer"
              style={{ width: 80, height: 80 }}
              onClick={() => !avatarUploading && fileInputRef.current?.click()}
            >
              {/* Circle */}
              {profile?.avatar_url ? (
                <div
                  style={{
                    width: 80, height: 80, borderRadius: '50%',
                    backgroundImage: `url(${profile.avatar_url})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#e8607a,#9b5fe0)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, fontWeight: 600, color: '#fff',
                  }}
                >
                  {initials}
                </div>
              )}

              {/* Uploading spinner overlay — always visible when uploading */}
              {avatarUploading && (
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.50)' }}
                >
                  <div
                    style={{
                      width: 24, height: 24, borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.2)',
                      borderTopColor: '#fff',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                </div>
              )}

              {/* Camera overlay on hover (hidden while uploading) */}
              {!avatarUploading && (
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: 'rgba(7,9,15,0.65)' }}
                >
                  <Camera size={18} color="#eeeef0" />
                </div>
              )}
            </div>

            {/* Avatar error */}
            {avatarError && (
              <p style={{ fontSize: 11, color: '#e87070', textAlign: 'center', marginTop: 4 }}>
                {avatarError}
              </p>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />

            {/* Identity */}
            <div className="flex flex-col items-center gap-[6px]">
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#eeeef0' }}>
                {profile?.display_name ?? alias}
              </div>

              <span style={{ fontSize: 11, color: '#6b7280', opacity: 0.7 }}>{alias}</span>

              <span
                className="text-[11px] px-[10px] py-1 rounded-full text-[#e8607a]"
                style={{ border: '1px solid rgba(232,96,122,0.3)', background: 'rgba(232,96,122,0.08)' }}
              >
                The Dreamer
              </span>

              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-[6px] bg-transparent text-[#6b7280] border border-[#1c2333] px-[16px] py-[8px] rounded-[10px] text-[13px] cursor-pointer transition-all duration-200 hover:border-white/20 hover:text-[#eeeef0] mt-1"
              >
                <Edit2 size={14} />
                Edit profile
              </button>
            </div>
          </div>

          {/* ── Section 2: Account details ───────────────────── */}
          <div
            className="bg-[#111620] border border-[#1c2333] rounded-[14px] overflow-hidden mb-5"
          >
            {/* Title row */}
            <div
              className="px-5 pt-5 pb-3 border-b border-[#1c2333]"
              style={{ fontSize: 13, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              account
            </div>

            {/* Email — read only */}
            <div className="flex items-center justify-between px-5 py-[14px] border-b border-[#1c2333]">
              <span className="flex items-center gap-[10px]">
                <Mail size={15} color="#6b7280" />
                <span style={{ fontSize: 13, color: '#6b7280' }}>Email</span>
              </span>
              <span style={{ fontSize: 13, color: '#eeeef0' }}>
                {profile?.email ?? session?.user?.email ?? '—'}
              </span>
            </div>

            {/* Date of Birth */}
            {/* TODO Phase 2: Google OAuth does not return birthdate — prompt user to fill in manually */}
            <div
              className="flex items-center justify-between px-5 py-[14px] border-b border-[#1c2333] cursor-pointer hover:bg-white/[0.02] transition-colors"
              onClick={() => setEditOpen(true)}
            >
              <span className="flex items-center gap-[10px]">
                <Calendar size={15} color="#6b7280" />
                <span style={{ fontSize: 13, color: '#6b7280' }}>Birthday</span>
              </span>
              <span className="flex items-center gap-[6px]">
                <span style={{ fontSize: 13, color: profile?.date_of_birth ? '#eeeef0' : '#4b5563' }}>
                  {profile?.date_of_birth ? formatDOB(profile.date_of_birth) : 'Not set'}
                </span>
                <ChevronRight size={14} color="#4b5563" />
              </span>
            </div>

            {/* Location */}
            <div
              className="flex items-center justify-between px-5 py-[14px] border-b border-[#1c2333] cursor-pointer hover:bg-white/[0.02] transition-colors"
              onClick={() => setEditOpen(true)}
            >
              <span className="flex items-center gap-[10px]">
                <MapPin size={15} color="#6b7280" />
                <span style={{ fontSize: 13, color: '#6b7280' }}>Location</span>
              </span>
              <span className="flex items-center gap-[6px]">
                <span style={{ fontSize: 13, color: (profile?.city && profile?.country) ? '#eeeef0' : '#4b5563' }}>
                  {profile?.city && profile?.country
                    ? `${profile.city}, ${profile.country}`
                    : 'Not set'}
                </span>
                <ChevronRight size={14} color="#4b5563" />
              </span>
            </div>

            {/* Member since — read only */}
            <div className="flex items-center justify-between px-5 py-[14px]">
              <span style={{ fontSize: 13, color: '#6b7280' }}>Member since</span>
              <span style={{ fontSize: 13, color: '#eeeef0' }}>
                {profile?.created_at ? formatMonth(profile.created_at) : '—'}
              </span>
            </div>
          </div>

          {/* ── Section 3: Taste profile ─────────────────────── */}
          <div className="flex items-end justify-between mb-5">
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif" }} className="text-[22px] text-[#eeeef0] mb-1">
                Your taste
              </div>
              <p className="text-[12px] text-[#6b7280] leading-[1.5]">Shaped by what you linger on.</p>
            </div>
          </div>

          {/* Vibes */}
          <div className="mb-5">
            <div className="text-[10px] uppercase tracking-widest text-[#4b5563] mb-2">vibes</div>
            {vibes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {vibes.map(t => (
                  <span key={t} className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">{t}</span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: '#4b5563', fontStyle: 'italic' }}>Nothing yet — explore to shape this.</p>
            )}
          </div>

          {/* Moods */}
          <div className="mb-5">
            <div className="text-[10px] uppercase tracking-widest text-[#4b5563] mb-2">moods</div>
            <div className="flex flex-wrap gap-2">
              {moods.map(t => (
                <span key={t} className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">{t}</span>
              ))}
            </div>
          </div>

          {/* Desires */}
          <div className="mb-4">
            <div className="text-[10px] uppercase tracking-widest text-[#4b5563] mb-2">desires</div>
            {desires.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {desires.map(t => (
                  <span key={t} className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">{t}</span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: '#4b5563', fontStyle: 'italic' }}>Nothing yet — explore to shape this.</p>
            )}
          </div>

          <button
            onClick={() => router.push('/auth/onboarding')}
            className="bg-transparent text-[#6b7280] border border-[#1c2333] px-[20px] py-[10px] rounded-[10px] text-[13px] cursor-pointer transition-all duration-200 hover:border-white/20 hover:text-[#eeeef0] mt-4"
          >
            Refine my taste →
          </button>

          <div className="border-t border-[#1c2333] my-6" />

          {/* ── Section 4: Saved stats ───────────────────────── */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {SAVE_TILES.map(({ value, label }) => (
              <div
                key={label}
                onClick={() => router.push('/saves')}
                className="bg-[#111620] border border-[#1c2333] rounded-[14px] p-4 flex flex-col items-center gap-1 cursor-pointer transition-all duration-200 hover:-translate-y-px hover:border-[rgba(232,96,122,0.3)]"
              >
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#eeeef0' }}>
                  {value}
                </span>
                <span style={{ fontSize: 11, color: '#6b7280', textAlign: 'center' }}>{label}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#1c2333] my-6" />

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
              <ChevronRight size={14} color="#4b5563" />
            </button>

            <button
              onClick={() => router.push('/help')}
              className="flex justify-between items-center bg-[#111620] border border-[#1c2333] rounded-[12px] px-4 py-[14px] cursor-pointer transition-colors duration-200 hover:border-white/10 w-full"
            >
              <span className="flex items-center gap-[10px]">
                <HelpCircle size={15} color="#6b7280" />
                <span style={{ fontSize: 13, color: '#6b7280' }}>Help &amp; support</span>
              </span>
              <ChevronRight size={14} color="#4b5563" />
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

      <EditProfileDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={(d) => setProfile(p => p ? { ...p, ...d } : p)}
        defaults={{
          displayName: profile?.display_name ?? undefined,
          bio:         profile?.bio          ?? undefined,
          dateOfBirth: profile?.date_of_birth ?? undefined,
          country:     profile?.country      ?? undefined,
          city:        profile?.city         ?? undefined,
        }}
      />
    </div>
  )
}
