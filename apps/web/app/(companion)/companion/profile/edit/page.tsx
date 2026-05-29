'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Loader2, Lock, X, Star, CheckCircle2, Phone, Video, MessageCircle, Users2, Sparkles } from 'lucide-react'
import { useUploadToR2 } from '@/hooks/useUploadToR2'

const DiditVerify = dynamic(() => import('@/components/ui/DiditVerify'), { ssr: false })

// ── Constants (shared with onboarding profile page) ──────────────────────────

const RESTRICTED_COUNTRIES = ['Sweden', 'Norway', 'Iceland', 'Singapore', 'Canada']

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Argentina','Armenia','Australia','Austria','Azerbaijan',
  'Bahrain','Bangladesh','Belarus','Belgium','Bolivia','Bosnia and Herzegovina','Brazil','Bulgaria',
  'Cambodia','Cameroon','Chile','China','Colombia','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic',
  'Denmark','Dominican Republic','Ecuador','Egypt','Estonia','Ethiopia',
  'Finland','France','Georgia','Germany','Ghana','Greece','Guatemala',
  'Hungary','India','Indonesia','Iraq','Ireland','Israel','Italy',
  'Japan','Jordan','Kazakhstan','Kenya','Kuwait','Latvia','Lebanon','Libya','Lithuania','Luxembourg',
  'Malaysia','Malta','Mexico','Moldova','Morocco','Netherlands','New Zealand','Nigeria',
  'North Macedonia','Oman','Pakistan','Panama','Paraguay','Peru','Philippines','Poland','Portugal',
  'Qatar','Romania','Russia','Saudi Arabia','Senegal','Serbia','Slovakia','Slovenia','South Africa',
  'South Korea','Spain','Sri Lanka','Sweden','Switzerland','Taiwan','Thailand','Tunisia','Turkey',
  'Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan',
  'Venezuela','Vietnam','Yemen','Zimbabwe',
  ...RESTRICTED_COUNTRIES,
].filter((v, i, a) => a.indexOf(v) === i).sort()

const LANGUAGES = [
  { code: 'en', name: 'English' }, { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' }, { code: 'it', name: 'Italian' },
  { code: 'de', name: 'German' }, { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' }, { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' }, { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Mandarin' }, { code: 'tr', name: 'Turkish' },
]

const VIBE_OPTIONS = [
  'Soft & Intimate', 'Roleplay-Friendly', 'Club Companion', 'Multilingual',
  'Bold & Confident', 'Intellectual', 'Adventurous', 'Nurturing',
]

const SESSION_TYPES = [
  { value: 'in_person',   label: 'In-Person',  Icon: Users2        },
  { value: 'audio_call',  label: 'Audio Call',  Icon: Phone         },
  { value: 'video_call',  label: 'Video Call',  Icon: Video         },
  { value: 'chat',        label: 'Chat',        Icon: MessageCircle },
  { value: 'custom',      label: 'Custom',      Icon: Sparkles      },
]

const DURATION_OPTIONS = [
  { value: '30min',   label: '30 min',   minutes: 30  },
  { value: '1h',      label: '1 hour',   minutes: 60  },
  { value: '2h',      label: '2 hours',  minutes: 120 },
  { value: 'halfday', label: 'Half day', minutes: 240 },
  { value: 'fullday', label: 'Full day', minutes: 480 },
  { value: 'custom',  label: 'Custom',   minutes: null },
]

// ── Types ────────────────────────────────────────────────────────────────────

interface PhotoItem {
  id: string
  url: string | null
  storage_key: string | null
  previewUrl: string
  uploading: boolean
  error: string | null
}

interface VideoItem {
  url: string
  storage_key: string
  durationSeconds: number
  previewUrl: string
}

interface SessionCardData {
  id: string
  title: string
  sessionType: string
  durationKey: string
  price: string
  currency: 'EUR' | 'USD' | 'GBP'
  description: string
}

function emptyCard(): SessionCardData {
  return { id: crypto.randomUUID(), title: '', sessionType: 'in_person', durationKey: '1h', price: '', currency: 'EUR', description: '' }
}

function durKeyFromMinutes(m: number | null): string {
  if (!m) return 'custom'
  const map: Record<number, string> = { 30: '30min', 60: '1h', 120: '2h', 240: 'halfday', 480: 'fullday' }
  return map[m] ?? 'custom'
}

// ── Shared styles ────────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%', background: '#161d2a', border: '1px solid #1c2333',
  borderRadius: 10, padding: '11px 14px', color: '#eeeef0',
  fontSize: 14, outline: 'none', transition: 'border-color 0.15s',
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ letter, title, subtitle }: { letter: string; title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-3">
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: '50%', fontSize: 11, fontWeight: 700,
          color: '#c9a96e', background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.3)',
        }}>{letter}</span>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#eeeef0', fontWeight: 600 }}>{title}</h2>
      </div>
      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16, lineHeight: 1.5 }}>{subtitle}</p>
      <div style={{ height: 1, background: '#1c2333' }} />
    </div>
  )
}

function FieldWrap({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>{label}</label>
      {children}
      {helper && <p style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic', marginTop: 5 }}>{helper}</p>}
    </div>
  )
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-5">
      <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>
        {label}
      </label>
      <div style={{ ...inputBase, display: 'flex', alignItems: 'center', gap: 10, opacity: 0.6, cursor: 'not-allowed' }}>
        <Lock size={12} color="#6b7280" />
        <span style={{ fontSize: 14, color: '#6b7280' }}>{value}</span>
      </div>
      <p style={{ fontSize: 11, color: '#4b5563', fontStyle: 'italic', marginTop: 5 }}>
        Contact support to update
      </p>
    </div>
  )
}

function SaveButton({ section, saving, saved, onSave }: {
  section: string
  saving: boolean
  saved: boolean
  onSave: () => void
}) {
  return (
    <div className="flex items-center gap-3 mt-6 pt-5" style={{ borderTop: '1px solid #1c2333' }}>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 rounded-[10px] text-white font-medium transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(232,96,122,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        style={{ background: '#e8607a', border: 'none', padding: '10px 22px', fontSize: 13, cursor: 'pointer' }}
      >
        {saving ? <><Loader2 size={13} className="animate-spin" />Saving…</> : `Save section ${section}`}
      </button>
      {saved && (
        <motion.div
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1"
        >
          <CheckCircle2 size={14} color="#34d399" />
          <span style={{ fontSize: 12, color: '#34d399' }}>Saved</span>
        </motion.div>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function EditProfilePage() {
  // ── Section A state ──
  const [legalName, setLegalName]     = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [country, setCountry]         = useState('')
  const [displayName, setDisplayName] = useState('')

  // ── Section B state ──
  const [tagline, setTagline]         = useState('')
  const [bio, setBio]                 = useState('')
  const [city, setCity]               = useState('')
  const [availability, setAvailability] = useState<'available' | 'busy' | 'offline'>('available')

  // ── Section C state ──
  const [fantasyTags, setFantasyTags]         = useState<{ id: number; name: string }[]>([])
  const [selectedFantasy, setSelectedFantasy] = useState<number[]>([])
  const [selectedVibes, setSelectedVibes]     = useState<string[]>([])
  const [selectedLangs, setSelectedLangs]     = useState<string[]>([])

  // ── Section D state ──
  const [cards, setCards] = useState<SessionCardData[]>([emptyCard()])

  // ── Section E state ──
  const [photos, setPhotos]               = useState<PhotoItem[]>([])
  const [video, setVideo]                 = useState<VideoItem | null>(null)
  const [videoDragging, setVideoDragging] = useState(false)
  const [photoDragging, setPhotoDragging] = useState(false)
  const [videoError, setVideoError]       = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const { uploadFile: uploadPhoto }     = useUploadToR2({ contentFor: 'companion_photo' })
  const { uploadFile: uploadVideoFile } = useUploadToR2({ contentFor: 'companion_video' })

  // ── Section F state ──
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'running' | 'pending' | 'approved' | 'declined' | 'skipped'>('idle')
  const [verifyUrl, setVerifyUrl]       = useState<string | null>(null)
  const [verifiedAt, setVerifiedAt]     = useState<string | null>(null)

  // ── Section G state (appearance) ──
  const [gender,     setGender]     = useState('')
  const [heightCm,   setHeightCm]   = useState('')
  const [bodyType,   setBodyType]   = useState('')
  const [ethnicity,  setEthnicity]  = useState('')
  const [eyeColor,   setEyeColor]   = useState('')
  const [hairColor,  setHairColor]  = useState('')
  const [skinColor,  setSkinColor]  = useState('')

  // ── Section H state (connect) ──
  const [whatsappNumber,   setWhatsappNumber]   = useState('')
  const [instagramHandle,  setInstagramHandle]  = useState('')
  const [websiteUrl,       setWebsiteUrl]       = useState('')

  // ── Section I state (go live) ──
  const [sessionModality, setSessionModality] = useState<'in_person' | 'online' | 'both'>('in_person')
  const [isLive,          setIsLive]          = useState(false)
  const [profileCompleteness, setProfileCompleteness] = useState(0)

  // ── Saving / saved per section ──
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved,  setSaved]  = useState<Record<string, boolean>>({})
  const [saveError, setSaveError] = useState<string | null>(null)

  // ── Load profile + tags (shared cache with settings/profile pages) ──────────
  const { data: profileQueryData, isLoading: profileLoading } = useQuery({
    queryKey: ['companion', 'profile'],
    queryFn:  () => fetch('/api/companions/profile', { credentials: 'include' }).then(r => r.json()),
    staleTime: 2 * 60 * 1000,
  })
  const { data: tagsQueryData, isLoading: tagsLoading } = useQuery({
    queryKey: ['tags'],
    queryFn:  () => fetch('/api/tags').then(r => r.json()),
    staleTime: 60 * 60 * 1000,
  })
  const loading = profileLoading || tagsLoading

  // ── Hydrate local form state from query data ───────────────────────────────
  useEffect(() => {
    if (tagsQueryData?.fantasyTags) setFantasyTags(tagsQueryData.fantasyTags)
  }, [tagsQueryData])

  useEffect(() => {
    const data = profileQueryData
    if (!data?.companion) return

    const c = data.companion
    setLegalName(c.full_name ?? '')
    setDateOfBirth(c.date_of_birth ?? '')
    setCountry(c.country ?? '')
    setDisplayName(c.name ?? '')

    if (data.profile) {
      const p = data.profile
      setTagline(p.tagline ?? '')
      setBio(p.bio ?? '')
      setCity(p.city ?? '')
      setAvailability(p.availability_status ?? 'available')
      setProfileCompleteness(p.profile_completeness ?? 0)
      // Section G
      setGender(p.gender ?? '')
      setHeightCm(p.height_cm ? String(p.height_cm) : '')
      setBodyType(p.body_type ?? '')
      setEthnicity(p.ethnicity ?? '')
      setEyeColor(p.eye_color ?? '')
      setHairColor(p.hair_color ?? '')
      setSkinColor(p.skin_color ?? '')
      // Section H
      setWhatsappNumber(p.whatsapp_number ?? '')
      setInstagramHandle(p.instagram_handle ?? '')
      setWebsiteUrl(p.website_url ?? '')
      // Section I
      setSessionModality(p.session_modality ?? 'in_person')
      setIsLive(p.is_live ?? false)
    }

    if (data.fantasy_tag_ids?.length)  setSelectedFantasy(data.fantasy_tag_ids)
    if (data.vibe_tag_names?.length)   setSelectedVibes(data.vibe_tag_names)
    if (data.language_codes?.length)   setSelectedLangs(data.language_codes)

    if (data.session_cards?.length) {
      setCards(data.session_cards.map((c: any) => ({
        id:          c.id,
        title:       c.title,
        sessionType: c.session_type ?? 'in_person',
        durationKey: durKeyFromMinutes(c.duration_minutes),
        price:       c.price?.toString() ?? '',
        currency:    c.currency ?? 'EUR',
        description: c.description ?? '',
      })))
    }

    if (data.photos?.length) {
      setPhotos(data.photos.map((p: any) => ({
        id:          p.id,
        url:         p.url,
        storage_key: p.storage_key,
        previewUrl:  p.url,
        uploading:   false,
        error:       null,
      })))
    }

    if (data.videos?.length) {
      const v = data.videos[0]
      setVideo({ url: v.url, storage_key: v.storage_key, durationSeconds: v.duration_seconds ?? 0, previewUrl: v.url })
    }

    if (data.verification) {
      const st = data.verification.status
      setVerifyStatus(st === 'approved' ? 'approved' : st === 'pending' ? 'pending' : st === 'declined' ? 'declined' : 'idle')
      setVerifiedAt(data.verification.verified_at ?? null)
    }
  }, [profileQueryData])

  // ── Save helpers ──
  async function saveSection(section: string, payload: object) {
    setSaving(p => ({ ...p, [section]: true }))
    setSaved(p => ({ ...p, [section]: false }))
    setSaveError(null)
    try {
      const res = await fetch('/api/companions/profile', {
        method:      'PATCH',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ section, ...payload }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSaveError(data?.error ?? `Save failed (${res.status}). Please try again.`)
        return
      }
      setSaved(p => ({ ...p, [section]: true }))
      setTimeout(() => setSaved(p => ({ ...p, [section]: false })), 2500)
    } catch {
      setSaveError('Network error. Please check your connection and try again.')
    } finally {
      setSaving(p => ({ ...p, [section]: false }))
    }
  }

  // ── Photo upload ──
  const processPhotoFiles = useCallback(async (files: File[]) => {
    const allowed = files.filter(f => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type))
    const toAdd = allowed.slice(0, 20 - photos.length)
    if (!toAdd.length) return
    const newItems: PhotoItem[] = toAdd.map(f => ({
      id: crypto.randomUUID(), url: null, storage_key: null,
      previewUrl: URL.createObjectURL(f), uploading: true, error: null,
    }))
    setPhotos(p => [...p, ...newItems])
    for (let i = 0; i < toAdd.length; i++) {
      const item = newItems[i]
      const result = await uploadPhoto(toAdd[i])
      setPhotos(p => p.map(ph =>
        ph.id === item.id
          ? result
            ? { ...ph, url: result.cdnUrl, storage_key: result.s3Key, uploading: false }
            : { ...ph, uploading: false, error: 'Upload failed' }
          : ph
      ))
    }
  }, [photos.length, uploadPhoto])

  // ── Video upload ──
  async function processVideoFile(file: File) {
    setVideoError(null)
    const duration = await new Promise<number>((resolve, reject) => {
      const el = document.createElement('video')
      el.preload = 'metadata'
      el.onloadedmetadata = () => { URL.revokeObjectURL(el.src); resolve(el.duration) }
      el.onerror = reject
      el.src = URL.createObjectURL(file)
    }).catch(() => 999)
    if (duration > 10) { setVideoError('Video must be 10 seconds or under.'); return }
    if (file.size > 50 * 1024 * 1024) { setVideoError('Max file size is 50MB.'); return }
    const preview = URL.createObjectURL(file)
    setVideo({ url: '', storage_key: '', durationSeconds: Math.round(duration), previewUrl: preview })
    const result = await uploadVideoFile(file)
    if (result) setVideo({ url: result.cdnUrl, storage_key: result.s3Key, durationSeconds: Math.round(duration), previewUrl: preview })
    else { setVideo(null); setVideoError('Upload failed.') }
  }

  // ── Verify ──
  async function startVerification() {
    setVerifyStatus('running')
    try {
      const res = await fetch('/api/companions/onboarding/verify/start', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error()
      setVerifyUrl(data.verification_url)
    } catch { setVerifyStatus('idle') }
  }

  const uploadedPhotos = photos.filter(p => p.url)

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 300 }}>
        <Loader2 size={24} color="#e8607a" className="animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Page header */}
      <div className="mb-10">
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: '#eeeef0', marginBottom: 4 }}>
          Edit Your Profile
        </h1>
        <p style={{ fontSize: 12, color: '#c9a96e' }}>Changes save instantly per section.</p>
      </div>

      {/* Save error banner */}
      {saveError && (
        <div style={{
          background: 'rgba(232,96,122,0.1)', border: '1px solid rgba(232,96,122,0.3)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <span style={{ fontSize: 13, color: '#e8607a' }}>{saveError}</span>
          <button type="button" onClick={() => setSaveError(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e8607a', fontSize: 16, lineHeight: 1 }}>✕</button>
        </div>
      )}

      {/* ── SECTION A ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        style={{ background: '#111620', border: '1px solid #1c2333', borderRadius: 16, padding: '28px 32px', marginBottom: 20 }}
      >
        <SectionHeader letter="A" title="Private Identity" subtitle="Legal details are locked after submission." />

        <ReadonlyField label="Legal full name" value={legalName || '—'} />
        <ReadonlyField label="Date of birth" value={dateOfBirth || '—'} />
        <ReadonlyField label="Country" value={country || '—'} />

        <FieldWrap label="Display name" helper="The name your clients know you by.">
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your display name"
            style={inputBase}
            onFocus={e => { e.currentTarget.style.borderColor = '#e8607a' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#1c2333' }}
          />
        </FieldWrap>

        <SaveButton section="A" saving={!!saving.A} saved={!!saved.A}
          onSave={() => saveSection('A', { displayName })} />
      </motion.div>

      {/* ── SECTION B ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{ background: '#111620', border: '1px solid #1c2333', borderRadius: 16, padding: '28px 32px', marginBottom: 20 }}
      >
        <SectionHeader letter="B" title="Your Public Profile" subtitle="This is what dreamers see when they discover you." />

        <FieldWrap label={`Tagline (${tagline.length}/80)`} helper="A single line. Make it linger.">
          <input
            value={tagline}
            onChange={e => setTagline(e.target.value.slice(0, 80))}
            placeholder="What would you whisper to someone who just found you?"
            style={inputBase}
            onFocus={e => { e.currentTarget.style.borderColor = '#e8607a' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#1c2333' }}
          />
        </FieldWrap>

        <FieldWrap label={`Bio (${bio.length}/500)`} helper="Your story. Write in first person.">
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value.slice(0, 500))}
            rows={5}
            placeholder="Your story. Your energy. What makes an evening with you unforgettable."
            style={{ ...inputBase, resize: 'vertical', fontFamily: "'Playfair Display', serif", lineHeight: 1.7, fontSize: 13.5 } as React.CSSProperties}
            onFocus={e => { e.currentTarget.style.borderColor = '#e8607a' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#1c2333' }}
          />
        </FieldWrap>

        <FieldWrap label="City" helper="City only — never your exact location.">
          <input
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="City only"
            style={inputBase}
            onFocus={e => { e.currentTarget.style.borderColor = '#e8607a' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#1c2333' }}
          />
        </FieldWrap>

        <FieldWrap label="Availability">
          <select
            value={availability}
            onChange={e => setAvailability(e.target.value as 'available' | 'busy' | 'offline')}
            style={{ ...inputBase, appearance: 'none' } as React.CSSProperties}
          >
            <option value="available">Available Now</option>
            <option value="busy">By Appointment</option>
            <option value="offline">Paused</option>
          </select>
        </FieldWrap>

        <SaveButton section="B" saving={!!saving.B} saved={!!saved.B}
          onSave={() => saveSection('B', { tagline, bio, city, availability })} />
      </motion.div>

      {/* ── SECTION C ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        style={{ background: '#111620', border: '1px solid #1c2333', borderRadius: 16, padding: '28px 32px', marginBottom: 20 }}
      >
        <SectionHeader letter="C" title="Your Identity on BlushBite" subtitle="Help dreamers find you. Be honest — mismatched tags lead to wrong-fit bookings." />

        {/* Fantasy tags */}
        <div className="mb-8">
          <p style={{ fontSize: 13, color: '#eeeef0', marginBottom: 6, fontWeight: 500 }}>Fantasy interest tags</p>
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>Select 3–7 tags that genuinely match you.</p>
          {fantasyTags.length === 0
            ? <p style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>Loading tags…</p>
            : (
              <div className="flex flex-wrap gap-2">
                {fantasyTags.map(tag => {
                  const active = selectedFantasy.includes(tag.id)
                  return (
                    <button key={tag.id} type="button"
                      onClick={() => {
                        if (active) setSelectedFantasy(p => p.filter(id => id !== tag.id))
                        else if (selectedFantasy.length < 7) setSelectedFantasy(p => [...p, tag.id])
                      }}
                      style={{
                        fontSize: 11, padding: '5px 12px', borderRadius: 999, cursor: 'pointer',
                        border:      active ? '1px solid rgba(232,96,122,0.5)' : '1px solid #1c2333',
                        color:       active ? '#e8607a' : '#6b7280',
                        background:  active ? 'rgba(232,96,122,0.1)' : 'transparent',
                        transition:  'all 0.15s',
                      }}>
                      {tag.name}
                    </button>
                  )
                })}
              </div>
            )
          }
        </div>

        {/* Vibe tags */}
        <div className="mb-8">
          <p style={{ fontSize: 13, color: '#eeeef0', marginBottom: 6, fontWeight: 500 }}>Vibe tags</p>
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>Select 3–5.</p>
          <div className="flex flex-wrap gap-2">
            {VIBE_OPTIONS.map(vibe => {
              const active = selectedVibes.includes(vibe)
              return (
                <button key={vibe} type="button"
                  onClick={() => {
                    if (active) setSelectedVibes(p => p.filter(v => v !== vibe))
                    else if (selectedVibes.length < 5) setSelectedVibes(p => [...p, vibe])
                  }}
                  style={{
                    fontSize: 11, padding: '5px 12px', borderRadius: 999, cursor: 'pointer',
                    border:     active ? '1px solid rgba(201,169,110,0.4)' : '1px solid #1c2333',
                    color:      active ? '#c9a96e' : '#6b7280',
                    background: active ? 'rgba(201,169,110,0.1)' : 'transparent',
                    transition: 'all 0.15s',
                  }}>
                  {vibe}
                </button>
              )
            })}
          </div>
        </div>

        {/* Languages */}
        <div className="mb-4">
          <p style={{ fontSize: 13, color: '#eeeef0', marginBottom: 6, fontWeight: 500 }}>Languages</p>
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>Languages you can host sessions in.</p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(lang => {
              const active = selectedLangs.includes(lang.code)
              return (
                <button key={lang.code} type="button"
                  onClick={() => {
                    if (active) setSelectedLangs(p => p.filter(c => c !== lang.code))
                    else setSelectedLangs(p => [...p, lang.code])
                  }}
                  style={{
                    fontSize: 11, padding: '5px 12px', borderRadius: 999, cursor: 'pointer',
                    border:     '1px solid #1c2333',
                    color:      active ? '#eeeef0' : '#6b7280',
                    background: active ? '#161d2a' : 'transparent',
                    transition: 'all 0.15s',
                  }}>
                  {lang.name}
                </button>
              )
            })}
          </div>
        </div>

        <SaveButton section="C" saving={!!saving.C} saved={!!saved.C}
          onSave={() => saveSection('C', { fantasyTagIds: selectedFantasy, vibeTagNames: selectedVibes, languageCodes: selectedLangs })} />
      </motion.div>

      {/* ── SECTION D ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        style={{ background: '#111620', border: '1px solid #1c2333', borderRadius: 16, padding: '28px 32px', marginBottom: 20 }}
      >
        <SectionHeader letter="D" title="Services & Rate Chart" subtitle="How dreamers can book you." />

        <div className="lg:grid lg:gap-6" style={{ gridTemplateColumns: '1fr 300px' }}>
          <div>
            {cards.map((card) => (
              <div key={card.id} style={{ background: '#161d2a', border: '1px solid #1c2333', borderRadius: 14, padding: 18, marginBottom: 14, position: 'relative' }}>
                {cards.length > 1 && (
                  <button type="button" onClick={() => setCards(p => p.filter(c => c.id !== card.id))}
                    style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                    <X size={12} />
                  </button>
                )}
                <div className="mb-4">
                  <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 5 }}>Service title</label>
                  <input value={card.title}
                    onChange={e => setCards(p => p.map(c => c.id === card.id ? { ...c, title: e.target.value } : c))}
                    placeholder="Evening Companion" style={inputBase} />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 5 }}>Session type</label>
                    <select value={card.sessionType}
                      onChange={e => setCards(p => p.map(c => c.id === card.id ? { ...c, sessionType: e.target.value } : c))}
                      style={{ ...inputBase, appearance: 'none' } as React.CSSProperties}>
                      {SESSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 5 }}>Duration</label>
                    <select value={card.durationKey}
                      onChange={e => setCards(p => p.map(c => c.id === card.id ? { ...c, durationKey: e.target.value } : c))}
                      style={{ ...inputBase, appearance: 'none' } as React.CSSProperties}>
                      {DURATION_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 5 }}>Price</label>
                    <input type="number" min={0} value={card.price}
                      onChange={e => setCards(p => p.map(c => c.id === card.id ? { ...c, price: e.target.value } : c))}
                      placeholder="280" style={inputBase} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 5 }}>Currency</label>
                    <select value={card.currency}
                      onChange={e => setCards(p => p.map(c => c.id === card.id ? { ...c, currency: e.target.value as 'EUR' | 'USD' | 'GBP' } : c))}
                      style={{ ...inputBase, appearance: 'none' } as React.CSSProperties}>
                      <option value="EUR">EUR €</option>
                      <option value="USD">USD $</option>
                      <option value="GBP">GBP £</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 5 }}>Description ({card.description.length}/200)</label>
                  <textarea value={card.description} maxLength={200} rows={2}
                    onChange={e => setCards(p => p.map(c => c.id === card.id ? { ...c, description: e.target.value } : c))}
                    placeholder="What does this experience feel like?"
                    style={{ ...inputBase, resize: 'none' } as React.CSSProperties} />
                </div>
              </div>
            ))}
            {cards.length < 5 && (
              <button type="button" onClick={() => setCards(p => [...p, emptyCard()])}
                style={{ fontSize: 13, color: '#e8607a', background: 'transparent', border: '1px dashed rgba(232,96,122,0.3)', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', width: '100%' }}>
                + Add another service
              </button>
            )}
          </div>

          {/* Rate preview */}
          <div className="mt-6 lg:mt-0">
            <div style={{ background: '#161d2a', border: '1px solid #1c2333', borderRadius: 14, padding: 18, position: 'sticky', top: 80 }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#eeeef0', marginBottom: 4 }}>Rate preview</p>
              <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 14 }}>Live — updates as you type</p>
              {cards.filter(c => c.title).length === 0
                ? <p style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>Your services will appear here…</p>
                : cards.filter(c => c.title).map(c => {
                    const TypeIcon = SESSION_TYPES.find(t => t.value === c.sessionType)?.Icon ?? Users2
                    const durLabel = DURATION_OPTIONS.find(d => d.value === c.durationKey)?.label ?? c.durationKey
                    const sym = { EUR: '€', USD: '$', GBP: '£' }[c.currency] ?? ''
                    return (
                      <div key={c.id} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid #1c2333' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <TypeIcon size={11} color="#6b7280" />
                          <span style={{ fontSize: 12, color: '#eeeef0', fontWeight: 500 }}>{c.title}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span style={{ fontSize: 11, color: '#6b7280' }}>{durLabel}</span>
                          {c.price && <span style={{ fontSize: 13, color: '#e8607a', fontWeight: 500 }}>{sym}{c.price}</span>}
                        </div>
                      </div>
                    )
                  })
              }
            </div>
          </div>
        </div>

        <SaveButton section="D" saving={!!saving.D} saved={!!saved.D}
          onSave={() => saveSection('D', {
            sessionCardsData: cards.filter(c => c.title.trim() && c.price).map(c => ({
              title: c.title, sessionType: c.sessionType, durationKey: c.durationKey,
              price: c.price, currency: c.currency, description: c.description,
            })),
          })} />
      </motion.div>

      {/* ── SECTION E ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        style={{ background: '#111620', border: '1px solid #1c2333', borderRadius: 16, padding: '28px 32px', marginBottom: 20 }}
      >
        <SectionHeader letter="E" title="Your Media" subtitle="Your visual presence. This is the first thing a dreamer sees." />

        {/* Photos */}
        <div className="mb-8">
          <p style={{ fontSize: 13, color: '#eeeef0', marginBottom: 6, fontWeight: 500 }}>
            Photos ({uploadedPhotos.length}/20) <span style={{ color: '#6b7280', fontWeight: 400 }}>— min 3 required</span>
          </p>
          <div
            onClick={() => photoInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setPhotoDragging(true) }}
            onDragLeave={() => setPhotoDragging(false)}
            onDrop={e => { e.preventDefault(); setPhotoDragging(false); processPhotoFiles(Array.from(e.dataTransfer.files)) }}
            style={{
              border: `2px dashed ${photoDragging ? 'rgba(232,96,122,0.6)' : '#1c2333'}`,
              borderRadius: 12, padding: '24px 20px', textAlign: 'center', cursor: 'pointer',
              background: photoDragging ? 'rgba(232,96,122,0.04)' : 'transparent',
              transition: 'all 0.15s', marginBottom: 12,
            }}>
            <p style={{ fontSize: 13, color: '#6b7280' }}>Drop photos here or <span style={{ color: '#e8607a' }}>click to select</span></p>
            <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>JPG, PNG, WebP · Max 20 files</p>
          </div>
          <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
            onChange={e => { processPhotoFiles(Array.from(e.target.files ?? [])); e.target.value = '' }} />

          {photos.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-3">
              {photos.map((photo, i) => (
                <div key={photo.id} style={{ position: 'relative', width: 96, height: 126, borderRadius: 10, overflow: 'hidden', border: '1px solid #1c2333', flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {photo.uploading && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(7,9,15,0.7)' }}>
                      <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid #1c2333', borderTop: '2px solid #e8607a', borderRadius: '50%' }} />
                    </div>
                  )}
                  {photo.error && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(7,9,15,0.8)' }}>
                      <span style={{ fontSize: 10, color: '#e8607a' }}>Failed</span>
                    </div>
                  )}
                  {i === 0 && photo.url && (
                    <div style={{ position: 'absolute', top: 5, left: 5 }}><Star size={11} color="#c9a96e" fill="#c9a96e" /></div>
                  )}
                  {!photo.uploading && (
                    <button type="button" onClick={() => setPhotos(p => p.filter(ph => ph.id !== photo.id))}
                      style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%', background: 'rgba(7,9,15,0.8)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eeeef0' }}>
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Video */}
        <div>
          <p style={{ fontSize: 13, color: '#eeeef0', marginBottom: 6, fontWeight: 500 }}>
            Short video <span style={{ color: '#6b7280', fontWeight: 400 }}>— optional</span>
          </p>
          {!video ? (
            <>
              <div
                onClick={() => videoInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setVideoDragging(true) }}
                onDragLeave={() => setVideoDragging(false)}
                onDrop={async e => { e.preventDefault(); setVideoDragging(false); const f = e.dataTransfer.files[0]; if (f) await processVideoFile(f) }}
                style={{
                  border: `2px dashed ${videoDragging ? 'rgba(232,96,122,0.6)' : '#1c2333'}`,
                  borderRadius: 12, padding: '22px 20px', textAlign: 'center', cursor: 'pointer',
                  background: videoDragging ? 'rgba(232,96,122,0.04)' : 'transparent', transition: 'all 0.15s',
                }}>
                <p style={{ fontSize: 13, color: '#6b7280' }}>Drop video here or <span style={{ color: '#e8607a' }}>click to select</span></p>
                <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>MP4 or MOV · Max 10 seconds · Max 50MB</p>
              </div>
              <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime" className="hidden"
                onChange={async e => { const f = e.target.files?.[0]; if (f) { await processVideoFile(f); e.target.value = '' } }} />
              {videoError && <p style={{ fontSize: 11, color: '#e8607a', marginTop: 6 }}>{videoError}</p>}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#161d2a', border: '1px solid #1c2333', borderRadius: 12, padding: 14 }}>
              <video src={video.previewUrl} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8 }} muted />
              <div style={{ flex: 1 }}>
                {video.url
                  ? <p style={{ fontSize: 12, color: '#eeeef0' }}>Video ready · {video.durationSeconds}s</p>
                  : <div className="flex items-center gap-2"><div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid #1c2333', borderTop: '2px solid #e8607a', borderRadius: '50%' }} /><span style={{ fontSize: 12, color: '#6b7280' }}>Uploading…</span></div>
                }
              </div>
              {video.url && (
                <button type="button" onClick={() => setVideo(null)}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(232,96,122,0.1)', border: '1px solid rgba(232,96,122,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={12} color="#e8607a" />
                </button>
              )}
            </div>
          )}
        </div>

        <SaveButton section="E" saving={!!saving.E} saved={!!saved.E}
          onSave={() => saveSection('E', {
            photos: uploadedPhotos.map(p => ({ url: p.url!, storage_key: p.storage_key! })),
            video:  video?.url ? { url: video.url, storage_key: video.storage_key, durationSeconds: video.durationSeconds } : null,
          })} />
      </motion.div>

      {/* ── SECTION F ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        style={{ background: '#111620', border: '1px solid #1c2333', borderRadius: 16, padding: '28px 32px', marginBottom: 20 }}
      >
        <SectionHeader letter="F" title="Identity Verification" subtitle="Verified companions get approved faster and appear with a badge." />

        {verifyStatus === 'approved' && (
          <div className="flex items-center gap-3 p-4 rounded-[12px]" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.25)' }}>
            <CheckCircle2 size={18} color="#34d399" />
            <div>
              <p style={{ fontSize: 13, color: '#34d399', fontWeight: 500 }}>Identity verified</p>
              {verifiedAt && <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Verified on {new Date(verifiedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>}
            </div>
          </div>
        )}

        {verifyStatus === 'pending' && (
          <div className="flex items-center gap-3 p-4 rounded-[12px]" style={{ background: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.25)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#c9a96e', animation: 'bbPulse 1.2s ease-in-out infinite', flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: '#c9a96e' }}>Verification under review. We'll notify you by email.</p>
          </div>
        )}

        {(verifyStatus === 'idle' || verifyStatus === 'declined') && (
          <div>
            {verifyStatus === 'declined' && (
              <div className="mb-4 p-3 rounded-[10px]" style={{ background: 'rgba(232,96,122,0.08)', border: '1px solid rgba(232,96,122,0.25)' }}>
                <p style={{ fontSize: 12, color: '#e8607a' }}>Your previous verification was declined. You can retry below.</p>
              </div>
            )}
            <button
              type="button"
              onClick={startVerification}
              className="flex items-center gap-2 rounded-[10px] text-white font-medium transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(232,96,122,0.3)]"
              style={{ background: '#e8607a', border: 'none', padding: '10px 22px', fontSize: 13, cursor: 'pointer' }}
            >
              {verifyStatus === 'declined' ? 'Retry verification →' : 'Start verification →'}
            </button>
          </div>
        )}

        {verifyStatus === 'running' && verifyUrl && (
          <div style={{ border: '1px solid #1c2333', borderRadius: 14, overflow: 'hidden' }}>
            <DiditVerify
              verificationUrl={verifyUrl}
              onComplete={() => setVerifyStatus('pending')}
            />
          </div>
        )}

        {verifyStatus === 'running' && !verifyUrl && (
          <div className="flex items-center gap-2">
            <Loader2 size={14} color="#e8607a" className="animate-spin" />
            <span style={{ fontSize: 13, color: '#6b7280' }}>Starting verification session…</span>
          </div>
        )}
      </motion.div>

      {/* ── SECTION G ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        style={{ background: '#111620', border: '1px solid #1c2333', borderRadius: 16, padding: '28px 32px', marginBottom: 20 }}
      >
        <SectionHeader letter="G" title="Your Appearance" subtitle="Helps dreamers discover you. Everything here is optional but increases visibility." />

        <FieldWrap label="Gender identity">
          <div className="flex flex-wrap gap-2">
            {(['woman','man','non_binary','trans_woman','trans_man','other'] as const).map(g => {
              const label: Record<string, string> = { woman: 'Woman', man: 'Man', non_binary: 'Non-binary', trans_woman: 'Trans woman', trans_man: 'Trans man', other: 'Other' }
              return (
                <button key={g} type="button" onClick={() => setGender(g)}
                  className="text-[12px] px-[14px] py-[7px] rounded-full border cursor-pointer transition-all duration-150"
                  style={{ borderColor: gender === g ? '#e8607a' : '#1c2333', color: gender === g ? '#e8607a' : '#6b7280', background: gender === g ? 'rgba(232,96,122,0.08)' : 'transparent' }}>
                  {label[g]}
                </button>
              )
            })}
          </div>
        </FieldWrap>

        <div className="grid grid-cols-2 gap-4">
          <FieldWrap label="Height (cm)" helper="Between 140 and 220">
            <input type="number" min={140} max={220} value={heightCm}
              onChange={e => setHeightCm(e.target.value)}
              style={{ ...inputBase }} placeholder="e.g. 168" />
          </FieldWrap>
          <FieldWrap label="Body type">
            <div className="flex flex-wrap gap-2">
              {['slim','athletic','average','curvy','plus_size','prefer_not_to_say'].map(b => (
                <button key={b} type="button" onClick={() => setBodyType(b)}
                  className="text-[12px] px-[12px] py-[6px] rounded-full border cursor-pointer transition-all duration-150"
                  style={{ borderColor: bodyType === b ? '#e8607a' : '#1c2333', color: bodyType === b ? '#e8607a' : '#6b7280', background: bodyType === b ? 'rgba(232,96,122,0.08)' : 'transparent' }}>
                  {b.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </FieldWrap>
        </div>

        <FieldWrap label="Ethnicity" helper="Free text — describe however feels right to you">
          <input type="text" value={ethnicity} onChange={e => setEthnicity(e.target.value)}
            style={{ ...inputBase }} placeholder="e.g. Mixed, Mediterranean, Nordic…" />
        </FieldWrap>

        <div className="grid grid-cols-2 gap-4">
          <FieldWrap label="Eye color">
            <div className="flex flex-wrap gap-2">
              {['brown','blue','green','hazel','grey'].map(c => (
                <button key={c} type="button" onClick={() => setEyeColor(c)}
                  className="text-[12px] px-[12px] py-[6px] rounded-full border cursor-pointer transition-all duration-150"
                  style={{ borderColor: eyeColor === c ? '#e8607a' : '#1c2333', color: eyeColor === c ? '#e8607a' : '#6b7280', background: eyeColor === c ? 'rgba(232,96,122,0.08)' : 'transparent' }}>
                  {c}
                </button>
              ))}
            </div>
          </FieldWrap>
          <FieldWrap label="Hair color">
            <div className="flex flex-wrap gap-2">
              {['blonde','brown','black','auburn','grey','red','dark'].map(c => (
                <button key={c} type="button" onClick={() => setHairColor(c)}
                  className="text-[12px] px-[12px] py-[6px] rounded-full border cursor-pointer transition-all duration-150"
                  style={{ borderColor: hairColor === c ? '#e8607a' : '#1c2333', color: hairColor === c ? '#e8607a' : '#6b7280', background: hairColor === c ? 'rgba(232,96,122,0.08)' : 'transparent' }}>
                  {c}
                </button>
              ))}
            </div>
          </FieldWrap>
        </div>

        <FieldWrap label="Skin tone">
          <div className="flex flex-wrap gap-2">
            {['fair','light','medium','olive','brown','dark'].map(c => (
              <button key={c} type="button" onClick={() => setSkinColor(c)}
                className="text-[12px] px-[14px] py-[7px] rounded-full border cursor-pointer transition-all duration-150"
                style={{ borderColor: skinColor === c ? '#e8607a' : '#1c2333', color: skinColor === c ? '#e8607a' : '#6b7280', background: skinColor === c ? 'rgba(232,96,122,0.08)' : 'transparent' }}>
                {c}
              </button>
            ))}
          </div>
        </FieldWrap>

        <SaveButton section="G" saving={!!saving.G} saved={!!saved.G}
          onSave={() => saveSection('G', { gender, height_cm: heightCm ? Number(heightCm) : null, body_type: bodyType, ethnicity, eye_color: eyeColor, hair_color: hairColor, skin_color: skinColor })} />
      </motion.div>

      {/* ── SECTION H ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        style={{ background: '#111620', border: '1px solid #1c2333', borderRadius: 16, padding: '28px 32px', marginBottom: 20 }}
      >
        <SectionHeader letter="H" title="Connect" subtitle="Private contact details used only for confirmed bookings." />

        <FieldWrap label="WhatsApp number" helper="International format, e.g. +31612345678">
          <input type="tel" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)}
            style={{ ...inputBase }} placeholder="+31612345678" />
        </FieldWrap>

        <FieldWrap label="Instagram handle" helper="Without the @ symbol">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontSize: 14 }}>@</span>
            <input type="text" value={instagramHandle} onChange={e => setInstagramHandle(e.target.value.replace(/^@/, ''))}
              style={{ ...inputBase, paddingLeft: 28 }} placeholder="yourhandle" />
          </div>
        </FieldWrap>

        <FieldWrap label="Personal website" helper="Optional">
          <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
            style={{ ...inputBase }} placeholder="https://yoursite.com" />
        </FieldWrap>

        <SaveButton section="H" saving={!!saving.H} saved={!!saved.H}
          onSave={() => saveSection('H', { whatsapp_number: whatsappNumber, instagram_handle: instagramHandle, website_url: websiteUrl })} />
      </motion.div>

      {/* ── SECTION I ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.45 }}
        style={{ background: '#111620', border: '1px solid #1c2333', borderRadius: 16, padding: '28px 32px', marginBottom: 40 }}
      >
        <SectionHeader letter="I" title="Availability & Go Live" subtitle="Control how dreamers can connect with you, and when you appear in the feed." />

        <FieldWrap label="Session type">
          <div className="flex gap-2">
            {(['in_person', 'online', 'both'] as const).map(m => {
              const labels = { in_person: 'In person', online: 'Online', both: 'Both' }
              return (
                <button key={m} type="button" onClick={() => setSessionModality(m)}
                  className="flex-1 text-[12px] py-[10px] rounded-[10px] border cursor-pointer transition-all duration-150 font-medium"
                  style={{ borderColor: sessionModality === m ? '#e8607a' : '#1c2333', color: sessionModality === m ? '#e8607a' : '#6b7280', background: sessionModality === m ? 'rgba(232,96,122,0.08)' : 'transparent' }}>
                  {labels[m]}
                </button>
              )
            })}
          </div>
        </FieldWrap>

        <div className="flex items-center justify-between p-4 rounded-[12px] mt-2" style={{ background: '#161d2a', border: '1px solid #1c2333' }}>
          <div>
            <p style={{ fontSize: 13, color: '#eeeef0', fontWeight: 500, marginBottom: 3 }}>Appear in the dreamer feed</p>
            <p style={{ fontSize: 11, color: '#6b7280' }}>
              {profileCompleteness < 70
                ? `Complete ${70 - profileCompleteness}% more of your profile to go live`
                : 'Your profile is visible to dreamers when active'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => profileCompleteness >= 70 && setIsLive(v => !v)}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: profileCompleteness < 70 ? 'not-allowed' : 'pointer',
              background: isLive && profileCompleteness >= 70 ? '#e8607a' : '#1c2333',
              position: 'relative', transition: 'background 0.2s', opacity: profileCompleteness < 70 ? 0.5 : 1, flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute', top: 2, left: isLive && profileCompleteness >= 70 ? 22 : 2,
              width: 20, height: 20, borderRadius: '50%', background: '#eeeef0', transition: 'left 0.2s',
            }} />
          </button>
        </div>

        <SaveButton section="I" saving={!!saving.I} saved={!!saved.I}
          onSave={() => saveSection('I', { session_modality: sessionModality, is_live: profileCompleteness >= 70 ? isLive : undefined })} />
      </motion.div>
    </motion.div>
  )
}
