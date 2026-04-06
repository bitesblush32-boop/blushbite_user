'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, X, Star, Phone, Video, MessageCircle, Users2, Sparkles, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { useUploadToR2 } from '@/hooks/useUploadToR2'

const DiditVerify = dynamic(() => import('@/components/ui/DiditVerify'), { ssr: false })

// ─── Constants ────────────────────────────────────────────────────────────────

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
  { value: 'in_person',   label: 'In-Person',   Icon: Users2       },
  { value: 'audio_call',  label: 'Audio Call',   Icon: Phone        },
  { value: 'video_call',  label: 'Video Call',   Icon: Video        },
  { value: 'chat',        label: 'Chat',         Icon: MessageCircle },
  { value: 'custom',      label: 'Custom',       Icon: Sparkles      },
]

const DURATION_OPTIONS = [
  { value: '30min',   label: '30 min',   minutes: 30  },
  { value: '1h',      label: '1 hour',   minutes: 60  },
  { value: '2h',      label: '2 hours',  minutes: 120 },
  { value: 'halfday', label: 'Half day', minutes: 240 },
  { value: 'fullday', label: 'Full day', minutes: 480 },
  { value: 'custom',  label: 'Custom',   minutes: null },
]

const DRAFT_KEY = 'bb_companion_profile_draft'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PhotoItem {
  id: string
  url: string | null
  s3Key: string | null
  previewUrl: string
  uploading: boolean
  error: string | null
}

interface VideoItem {
  url: string
  s3Key: string
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

// ─── Zod schema (fields A + B only — rest validated manually) ─────────────────

function isAdult(dob: string) {
  if (!dob) return false
  const diff = (Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  return diff >= 18
}

const formSchema = z.object({
  fullName:     z.string().min(2, 'Required'),
  dateOfBirth:  z.string().refine(isAdult, 'Must be 18 or older'),
  country:      z.string().min(1, 'Select a country'),
  displayName:  z.string().min(1, 'Required'),
  tagline:      z.string().max(80).optional(),
  bio:          z.string().max(500).optional(),
  city:         z.string().min(1, 'Required'),
  availability: z.enum(['available', 'busy', 'offline']),
})
type ProfileForm = z.infer<typeof formSchema>

// ─── Shared input styles ──────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%', background: '#161d2a', border: '1px solid #1c2333',
  borderRadius: 10, padding: '11px 14px', color: '#eeeef0',
  fontSize: 14, outline: 'none', transition: 'border-color 0.15s',
}

const inputError: React.CSSProperties = { ...inputBase, borderColor: 'rgba(232,96,122,0.6)' }

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function FieldWrap({ label, error, helper, children }: {
  label: string; error?: string; helper?: string; children: React.ReactNode
}) {
  return (
    <div className="mb-5">
      <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>{label}</label>
      {children}
      {helper && !error && <p style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic', marginTop: 5 }}>{helper}</p>}
      {error && <p style={{ fontSize: 11, color: '#e8607a', marginTop: 5 }}>{error}</p>}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CompanionProfilePage() {
  const router = useRouter()

  // ── section refs ──
  const secRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ]

  // ── form ──
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { availability: 'available' },
  })
  const watched = watch()

  // ── section C state ──
  const [fantasyTags, setFantasyTags]         = useState<{ id: number; name: string }[]>([])
  const [selectedFantasy, setSelectedFantasy] = useState<number[]>([])
  const [selectedVibes, setSelectedVibes]     = useState<string[]>([])
  const [selectedLangs, setSelectedLangs]     = useState<string[]>([])

  // ── section D state ──
  const [cards, setCards] = useState<SessionCardData[]>([emptyCard()])

  // ── section E state ──
  const [photos, setPhotos]               = useState<PhotoItem[]>([])
  const [video, setVideo]                 = useState<VideoItem | null>(null)
  const [videoError, setVideoError]       = useState<string | null>(null)
  const [videoDragging, setVideoDragging] = useState(false)
  const [photoDragging, setPhotoDragging] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const { uploadFile: uploadPhoto }       = useUploadToR2({ contentFor: 'companion_photo' })
  const { uploadFile: uploadVideoFile }   = useUploadToR2({ contentFor: 'companion_video' })

  // ── section F state ──
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'running' | 'pending' | 'approved' | 'declined' | 'skipped'>('idle')
  const [verifyUrl, setVerifyUrl]       = useState<string | null>(null)

  // ── misc state ──
  const [draftBanner, setDraftBanner]       = useState<{ data: unknown } | null>(null)
  const [submitting, setSubmitting]         = useState(false)
  const [submitError, setSubmitError]       = useState<string | null>(null)
  const debounceRef                         = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── fetch tags + verify status on mount ──
  useEffect(() => {
    fetch('/api/tags').then(r => r.json()).then(d => {
      if (d.fantasyTags) setFantasyTags(d.fantasyTags)
    }).catch(() => {})

    fetch('/api/companions/onboarding/verify/status').then(r => r.json()).then(d => {
      if (d.status && d.status !== 'idle') setVerifyStatus(d.status)
    }).catch(() => {})

    // Check DB draft
    fetch('/api/companions/onboarding/profile').then(r => r.json()).then(({ draft }) => {
      if (!draft) return
      const localDraft = localStorage.getItem(DRAFT_KEY)
      if (localDraft) {
        try { setDraftBanner({ data: JSON.parse(localDraft) }) } catch {}
      } else {
        applyDraft(draft)
      }
    }).catch(() => {
      const localDraft = localStorage.getItem(DRAFT_KEY)
      if (localDraft) {
        try { setDraftBanner({ data: JSON.parse(localDraft) }) } catch {}
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── auto-save to localStorage ──
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const snapshot = {
        ...watched,
        selectedFantasy, selectedVibes, selectedLangs,
        cards, photos: photos.filter(p => p.url).map(p => ({ url: p.url, s3Key: p.s3Key })),
        video: video ? { url: video.url, s3Key: video.s3Key, durationSeconds: video.durationSeconds } : null,
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(snapshot))
    }, 1000)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [watched, selectedFantasy, selectedVibes, selectedLangs, cards, photos, video]) // eslint-disable-line react-hooks/exhaustive-deps

  function applyDraft(draft: any) {
    if (draft.fullName)     setValue('fullName',     draft.fullName)
    if (draft.dateOfBirth)  setValue('dateOfBirth',  draft.dateOfBirth)
    if (draft.country)      setValue('country',      draft.country)
    if (draft.displayName)  setValue('displayName',  draft.displayName)
    if (draft.tagline)      setValue('tagline',      draft.tagline)
    if (draft.bio)          setValue('bio',          draft.bio)
    if (draft.city)         setValue('city',         draft.city)
    if (draft.availability) setValue('availability', draft.availability)
    if (draft.selectedFantasy?.length) setSelectedFantasy(draft.selectedFantasy)
    if (draft.fantasyTagIds?.length)   setSelectedFantasy(draft.fantasyTagIds)
    if (draft.selectedVibes?.length)   setSelectedVibes(draft.selectedVibes)
    if (draft.vibeTagNames?.length)    setSelectedVibes(draft.vibeTagNames)
    if (draft.selectedLangs?.length)   setSelectedLangs(draft.selectedLangs)
    if (draft.languageCodes?.length)   setSelectedLangs(draft.languageCodes)
    if (draft.cards?.length)           setCards(draft.cards.map((c: any) => ({ ...emptyCard(), ...c })))
    if (draft.sessionCards?.length)    setCards(draft.sessionCards.map((c: any) => ({ ...emptyCard(), ...c })))
    if (draft.photos?.length) {
      setPhotos(draft.photos.map((p: any) => ({
        id: crypto.randomUUID(), url: p.url, s3Key: p.s3Key,
        previewUrl: p.url, uploading: false, error: null,
      })))
    }
    if (draft.video) {
      setVideo({ ...draft.video, previewUrl: draft.video.url })
    }
  }

  // ── completion ──
  const sectionADone = !!(
    watched.fullName?.trim() && watched.dateOfBirth && isAdult(watched.dateOfBirth) &&
    watched.country && !RESTRICTED_COUNTRIES.includes(watched.country) && watched.displayName?.trim()
  )
  const sectionBDone = !!(watched.city?.trim() && watched.availability)
  const sectionCDone = selectedFantasy.length >= 3 && selectedVibes.length >= 3 && selectedLangs.length >= 1
  const completedCards = cards.filter(c => c.title.trim() && c.sessionType && c.price)
  const sectionDDone  = completedCards.length >= 2
  const uploadedPhotos = photos.filter(p => p.url)
  const sectionEDone  = uploadedPhotos.length >= 3
  const sectionFDone  = verifyStatus === 'approved' || verifyStatus === 'pending' || verifyStatus === 'skipped'
  const completedCount = [sectionADone, sectionBDone, sectionCDone, sectionDDone, sectionEDone, sectionFDone].filter(Boolean).length
  const canSubmit     = sectionADone && sectionBDone && sectionCDone && sectionDDone && sectionEDone

  // ── photo upload ──
  const processPhotoFiles = useCallback(async (files: File[]) => {
    const allowed = files.filter(f => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type))
    const current = photos.length
    const toAdd   = allowed.slice(0, 20 - current)
    if (!toAdd.length) return

    const newItems: PhotoItem[] = toAdd.map(f => ({
      id: crypto.randomUUID(), url: null, s3Key: null,
      previewUrl: URL.createObjectURL(f), uploading: true, error: null,
    }))
    setPhotos(prev => [...prev, ...newItems])

    for (let i = 0; i < toAdd.length; i++) {
      const item = newItems[i]
      const result = await uploadPhoto(toAdd[i])
      setPhotos(prev => prev.map(p =>
        p.id === item.id
          ? result
            ? { ...p, url: result.cdnUrl, s3Key: result.s3Key, uploading: false }
            : { ...p, uploading: false, error: 'Upload failed' }
          : p
      ))
    }
  }, [photos.length, uploadPhoto])

  // ── video upload ──
  async function processVideoFile(file: File) {
    setVideoError(null)
    const duration = await new Promise<number>((resolve, reject) => {
      const el = document.createElement('video')
      el.preload = 'metadata'
      el.onloadedmetadata = () => { URL.revokeObjectURL(el.src); resolve(el.duration) }
      el.onerror = reject
      el.src = URL.createObjectURL(file)
    })
    if (duration > 10) { setVideoError('Video must be 10 seconds or under.'); return }
    if (file.size > 50 * 1024 * 1024) { setVideoError('Max file size is 50MB.'); return }

    const previewUrl = URL.createObjectURL(file)
    setVideo({ url: '', s3Key: '', durationSeconds: Math.round(duration), previewUrl })

    const result = await uploadVideoFile(file)
    if (result) {
      setVideo({ url: result.cdnUrl, s3Key: result.s3Key, durationSeconds: Math.round(duration), previewUrl })
    } else {
      setVideo(null)
      setVideoError('Upload failed. Try again.')
    }
  }

  // ── verify ──
  async function startVerification() {
    setVerifyStatus('running')
    try {
      const res = await fetch('/api/companions/onboarding/verify/start', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setVerifyUrl(data.verification_url)
    } catch (err) {
      setVerifyStatus('idle')
    }
  }

  // ── submit ──
  const onSubmit = handleSubmit(async (formData) => {
    if (!canSubmit) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/companions/onboarding/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          fantasyTagIds:   selectedFantasy,
          vibeTagNames:    selectedVibes,
          languageCodes:   selectedLangs,
          sessionCards:    cards.map(c => ({
            title:       c.title,
            sessionType: c.sessionType,
            durationKey: c.durationKey,
            price:       c.price ? Number(c.price) : null,
            currency:    c.currency,
            description: c.description,
          })),
          photos:          uploadedPhotos.map(p => ({ url: p.url!, s3Key: p.s3Key! })),
          video:           video?.url ? { url: video.url, s3Key: video.s3Key, durationSeconds: video.durationSeconds } : null,
          defaultCurrency: cards[0]?.currency ?? 'EUR',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      localStorage.removeItem(DRAFT_KEY)
      router.push('/companion/onboarding/legal')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  })

  const scrollTo = (i: number) => {
    secRefs[i].current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: '#07090f', minHeight: '100vh', paddingTop: 56, paddingBottom: 88 }}>
      {/* Noise */}
      <div className="fixed inset-0 pointer-events-none z-[1000] opacity-60" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }} />

      {/* ── Sticky top bar ── */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 border-b border-[#1c2333]"
        style={{ height: 56, background: 'rgba(7,9,15,0.9)', backdropFilter: 'blur(12px)' }}>
        <Image src="/logo_light.png" alt="BlushBite" width={70} height={22} style={{ objectFit: 'contain' }} />
        <div className="flex flex-col items-center gap-1">
          <div className="w-[200px] h-[3px] rounded-full overflow-hidden" style={{ background: '#1c2333' }}>
            <div style={{ width: `${(completedCount / 6) * 100}%`, height: '100%', background: '#e8607a', borderRadius: 999, transition: 'width 0.4s ease' }} />
          </div>
        </div>
        <span style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap' }}>Step 1 of 3</span>
      </div>

      {/* ── Draft banner ── */}
      {draftBanner && (
        <div style={{ background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.3)', borderRadius: 10, padding: '12px 16px', margin: '16px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, maxWidth: 860, marginLeft: 'auto', marginRight: 'auto' }}>
          <span style={{ fontSize: 13, color: '#c9a96e' }}>You have a saved draft — resume where you left off</span>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => { applyDraft(draftBanner.data); setDraftBanner(null) }}
              style={{ fontSize: 12, color: '#c9a96e', background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.3)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}>
              Continue
            </button>
            <button onClick={() => { localStorage.removeItem(DRAFT_KEY); setDraftBanner(null) }}
              style={{ fontSize: 12, color: '#6b7280', background: 'transparent', border: '1px solid #1c2333', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}>
              Start fresh
            </button>
          </div>
        </div>
      )}

      {/* ── Main form ── */}
      <form onSubmit={onSubmit}>
        <div className="max-w-[860px] mx-auto px-5 py-8">

          {/* ── SECTION A ── */}
          <div ref={secRefs[0]} id="section-a" className="mb-16">
            <SectionHeader letter="A" title="Private Identity" subtitle="For verification only. Never shown on your public profile." />

            <FieldWrap label="Legal full name" error={errors.fullName?.message} helper="Never shown on your profile. For verification only.">
              <input {...register('fullName')} placeholder="As it appears on your government ID"
                style={errors.fullName ? inputError : inputBase} />
            </FieldWrap>

            <FieldWrap label="Date of birth" error={errors.dateOfBirth?.message} helper="You must be 18 or older to join BlushBite.">
              <input {...register('dateOfBirth')} type="date" max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split('T')[0]}
                style={errors.dateOfBirth ? { ...inputError, colorScheme: 'dark' } : { ...inputBase, colorScheme: 'dark' }} />
            </FieldWrap>

            <FieldWrap label="Country" error={errors.country?.message} helper="We operate in most countries. A few regions are currently unavailable.">
              <select {...register('country')} style={errors.country ? { ...inputError, appearance: 'none' } : { ...inputBase, appearance: 'none' }}>
                <option value="">Select your country</option>
                {COUNTRIES.map(c => (
                  <option key={c} value={c} disabled={RESTRICTED_COUNTRIES.includes(c)}
                    title={RESTRICTED_COUNTRIES.includes(c) ? 'Not available in your region' : undefined}>
                    {c}{RESTRICTED_COUNTRIES.includes(c) ? ' (unavailable)' : ''}
                  </option>
                ))}
              </select>
            </FieldWrap>

            <FieldWrap label="Display name" error={errors.displayName?.message} helper="The name your clients will know you by. Can be different from your legal name.">
              <input {...register('displayName')} placeholder="The name your clients will know you by"
                style={errors.displayName ? inputError : inputBase} />
            </FieldWrap>
          </div>

          {/* ── SECTION B ── */}
          <div ref={secRefs[1]} id="section-b" className="mb-16">
            <SectionHeader letter="B" title="Your Public Profile" subtitle="This is what dreamers see when they discover you." />

            <FieldWrap label={`Tagline ${(watched.tagline?.length ?? 0)}/80`} helper="A single line. Make it linger.">
              <input {...register('tagline')} maxLength={80}
                placeholder="What would you whisper to someone who just found you?"
                style={inputBase} />
            </FieldWrap>

            <FieldWrap label={`Bio ${(watched.bio?.length ?? 0)}/500`} helper="Your story. Write in first person. Be specific — it converts.">
              <textarea {...register('bio')} maxLength={500} rows={5}
                placeholder="Your story. Your energy. What makes an evening with you unforgettable."
                style={{ ...inputBase, resize: 'vertical', fontFamily: "'Playfair Display', serif", lineHeight: 1.7, fontSize: 13.5 } as React.CSSProperties} />
            </FieldWrap>

            <FieldWrap label="City" error={errors.city?.message} helper="City only — we never show your exact location.">
              <input {...register('city')} placeholder="City only — we never show your exact location"
                style={errors.city ? inputError : inputBase} />
            </FieldWrap>

            <FieldWrap label="Availability" error={errors.availability?.message}>
              <select {...register('availability')} style={{ ...inputBase, appearance: 'none' } as React.CSSProperties}>
                <option value="available">Available Now</option>
                <option value="busy">By Appointment</option>
                <option value="offline">Paused</option>
              </select>
            </FieldWrap>
          </div>

          {/* ── SECTION C ── */}
          <div ref={secRefs[2]} id="section-c" className="mb-16">
            <SectionHeader letter="C" title="Your Identity on BlushBite" subtitle="Help dreamers find you. Be honest — mismatched tags lead to wrong-fit bookings." />

            {/* Fantasy tags */}
            <div className="mb-8">
              <p style={{ fontSize: 13, color: '#eeeef0', marginBottom: 6, fontWeight: 500 }}>Fantasy interest tags</p>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, lineHeight: 1.5 }}>
                What do you genuinely enjoy? These link your profile to dreamers who crave the same. Select 3–7.
              </p>
              {fantasyTags.length === 0 && (
                <p style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>Loading tags…</p>
              )}
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
                        border: active ? '1px solid rgba(232,96,122,0.5)' : '1px solid #1c2333',
                        color: active ? '#e8607a' : '#6b7280',
                        background: active ? 'rgba(232,96,122,0.1)' : 'transparent',
                        transition: 'all 0.15s',
                      }}>
                      {tag.name}
                    </button>
                  )
                })}
              </div>
              {selectedFantasy.length > 0 && selectedFantasy.length < 3 && (
                <p style={{ fontSize: 11, color: '#e8607a', marginTop: 8 }}>Select at least 3</p>
              )}
            </div>

            {/* Vibe tags */}
            <div className="mb-8">
              <p style={{ fontSize: 13, color: '#eeeef0', marginBottom: 6, fontWeight: 500 }}>Vibe tags</p>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>How companions describe your energy. Select 3–5.</p>
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
                        border: active ? '1px solid rgba(201,169,110,0.4)' : '1px solid #1c2333',
                        color: active ? '#c9a96e' : '#6b7280',
                        background: active ? 'rgba(201,169,110,0.1)' : 'transparent',
                        transition: 'all 0.15s',
                      }}>
                      {vibe}
                    </button>
                  )
                })}
              </div>
              {selectedVibes.length > 0 && selectedVibes.length < 3 && (
                <p style={{ fontSize: 11, color: '#e8607a', marginTop: 8 }}>Select at least 3</p>
              )}
            </div>

            {/* Languages */}
            <div>
              <p style={{ fontSize: 13, color: '#eeeef0', marginBottom: 6, fontWeight: 500 }}>Languages</p>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>Languages you can host sessions in. Select at least 1.</p>
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
                        border: active ? '1px solid #1c2333' : '1px solid #1c2333',
                        color: active ? '#eeeef0' : '#6b7280',
                        background: active ? '#161d2a' : 'transparent',
                        transition: 'all 0.15s',
                      }}>
                      {lang.name}
                    </button>
                  )
                })}
              </div>
              {selectedLangs.length === 0 && (
                <p style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic', marginTop: 8 }}>Select at least 1 language</p>
              )}
            </div>
          </div>

          {/* ── SECTION D ── */}
          <div ref={secRefs[3]} id="section-d" className="mb-16">
            <SectionHeader letter="D" title="Services & Rate Chart" subtitle="How dreamers can book you. Be specific — it drives more bookings." />

            <div className="lg:grid lg:gap-6" style={{ gridTemplateColumns: '1fr 340px' }}>
              {/* Builder */}
              <div>
                {cards.map((card, idx) => (
                  <div key={card.id} style={{ background: '#111620', border: '1px solid #1c2333', borderRadius: 16, padding: 20, marginBottom: 16, position: 'relative' }}>
                    {cards.length > 1 && (
                      <button type="button" onClick={() => setCards(p => p.filter(c => c.id !== card.id))}
                        style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                        <X size={12} />
                      </button>
                    )}

                    <div className="mb-4">
                      <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 5 }}>Service title</label>
                      <input value={card.title} onChange={e => setCards(p => p.map(c => c.id === card.id ? { ...c, title: e.target.value } : c))}
                        placeholder="Evening Companion" style={inputBase} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 5 }}>Session type</label>
                        <select value={card.sessionType} onChange={e => setCards(p => p.map(c => c.id === card.id ? { ...c, sessionType: e.target.value } : c))}
                          style={{ ...inputBase, appearance: 'none' } as React.CSSProperties}>
                          {SESSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 5 }}>Duration</label>
                        <select value={card.durationKey} onChange={e => setCards(p => p.map(c => c.id === card.id ? { ...c, durationKey: e.target.value } : c))}
                          style={{ ...inputBase, appearance: 'none' } as React.CSSProperties}>
                          {DURATION_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 5 }}>Starting price</label>
                        <input type="number" min={0} value={card.price} onChange={e => setCards(p => p.map(c => c.id === card.id ? { ...c, price: e.target.value } : c))}
                          placeholder="280" style={inputBase} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 5 }}>Currency</label>
                        <select value={card.currency} onChange={e => setCards(p => p.map(c => c.id === card.id ? { ...c, currency: e.target.value as 'EUR' | 'USD' | 'GBP' } : c))}
                          style={{ ...inputBase, appearance: 'none' } as React.CSSProperties}>
                          <option value="EUR">EUR €</option>
                          <option value="USD">USD $</option>
                          <option value="GBP">GBP £</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 5 }}>Description ({card.description.length}/200)</label>
                      <textarea value={card.description} maxLength={200}
                        onChange={e => setCards(p => p.map(c => c.id === card.id ? { ...c, description: e.target.value } : c))}
                        placeholder="What does this experience feel like?" rows={2}
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

                {!sectionDDone && cards.length > 0 && (
                  <p style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic', marginTop: 8 }}>Add at least 2 complete services to continue</p>
                )}
              </div>

              {/* Rate chart preview */}
              <div className="mt-6 lg:mt-0">
                <div style={{ background: '#111620', border: '1px solid #1c2333', borderRadius: 14, padding: 20, position: 'sticky', top: 72 }}>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#eeeef0', marginBottom: 4 }}>Rate preview</p>
                  <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 16 }}>Live — updates as you type</p>
                  {cards.filter(c => c.title).length === 0
                    ? <p style={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>Your services will appear here…</p>
                    : cards.filter(c => c.title).map(c => {
                      const TypeIcon = SESSION_TYPES.find(t => t.value === c.sessionType)?.Icon ?? Users2
                      const durLabel = DURATION_OPTIONS.find(d => d.value === c.durationKey)?.label ?? c.durationKey
                      const sym = { EUR: '€', USD: '$', GBP: '£' }[c.currency] ?? ''
                      return (
                        <div key={c.id} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid #1c2333' }}>
                          <div className="flex items-center gap-2 mb-1">
                            <TypeIcon size={12} color="#6b7280" />
                            <span style={{ fontSize: 13, color: '#eeeef0', fontWeight: 500 }}>{c.title}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span style={{ fontSize: 11, color: '#6b7280' }}>{durLabel}</span>
                            {c.price && <span style={{ fontSize: 14, color: '#e8607a', fontWeight: 500 }}>{sym}{c.price}</span>}
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION E ── */}
          <div ref={secRefs[4]} id="section-e" className="mb-16">
            <SectionHeader letter="E" title="Your Media" subtitle="Your visual presence. This is the first thing a dreamer sees." />

            {/* Photos */}
            <div className="mb-8">
              <p style={{ fontSize: 13, color: '#eeeef0', marginBottom: 6, fontWeight: 500 }}>
                Photos ({uploadedPhotos.length}/20) <span style={{ color: '#6b7280', fontWeight: 400 }}>— min 3 required</span>
              </p>

              {/* Drop zone */}
              <div
                onClick={() => photoInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setPhotoDragging(true) }}
                onDragLeave={() => setPhotoDragging(false)}
                onDrop={e => { e.preventDefault(); setPhotoDragging(false); processPhotoFiles(Array.from(e.dataTransfer.files)) }}
                style={{
                  border: `2px dashed ${photoDragging ? 'rgba(232,96,122,0.6)' : '#1c2333'}`,
                  borderRadius: 12, padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
                  background: photoDragging ? 'rgba(232,96,122,0.04)' : 'transparent',
                  transition: 'all 0.15s', marginBottom: 12,
                }}>
                <p style={{ fontSize: 13, color: '#6b7280' }}>Drop photos here or <span style={{ color: '#e8607a' }}>click to select</span></p>
                <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>JPG, PNG, WebP · Max 20 files</p>
              </div>
              <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                onChange={e => { processPhotoFiles(Array.from(e.target.files ?? [])); e.target.value = '' }} />

              <p style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic', marginBottom: 12 }}>
                Semi-nude allowed (lingerie, suggestive). No full nudity. No explicit acts. No watermarks.
              </p>

              {/* Thumbnails */}
              {photos.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {photos.map((photo, i) => (
                    <div key={photo.id} style={{ position: 'relative', width: 100, height: 130, borderRadius: 10, overflow: 'hidden', border: '1px solid #1c2333', flexShrink: 0 }}>
                      <img src={photo.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {photo.uploading && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(7,9,15,0.7)' }}>
                          <div className="animate-spin" style={{ width: 22, height: 22, border: '2px solid #1c2333', borderTop: '2px solid #e8607a', borderRadius: '50%' }} />
                        </div>
                      )}
                      {photo.error && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(7,9,15,0.8)' }}>
                          <span style={{ fontSize: 10, color: '#e8607a', textAlign: 'center', padding: '0 6px' }}>Failed</span>
                        </div>
                      )}
                      {i === 0 && photo.url && (
                        <div style={{ position: 'absolute', top: 5, left: 5 }}>
                          <Star size={12} color="#c9a96e" fill="#c9a96e" />
                        </div>
                      )}
                      {!photo.uploading && (
                        <button type="button"
                          onClick={() => setPhotos(p => p.filter(ph => ph.id !== photo.id))}
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
                      borderRadius: 12, padding: '24px 20px', textAlign: 'center', cursor: 'pointer',
                      background: videoDragging ? 'rgba(232,96,122,0.04)' : 'transparent',
                      transition: 'all 0.15s', marginBottom: 8,
                    }}>
                    <p style={{ fontSize: 13, color: '#6b7280' }}>Drop video here or <span style={{ color: '#e8607a' }}>click to select</span></p>
                    <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>MP4 or MOV · Max 10 seconds · Max 50MB</p>
                  </div>
                  <input ref={videoInputRef} type="file" accept="video/mp4,video/quicktime" className="hidden"
                    onChange={async e => { const f = e.target.files?.[0]; if (f) { await processVideoFile(f); e.target.value = '' } }} />
                  {videoError && <p style={{ fontSize: 11, color: '#e8607a', marginTop: 4 }}>{videoError}</p>}
                  <p style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic', marginTop: 6 }}>
                    10 seconds. Your face, your energy, speaking to camera. Non-nude.
                  </p>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#111620', border: '1px solid #1c2333', borderRadius: 12, padding: 14 }}>
                  <video src={video.previewUrl} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8 }} muted />
                  <div style={{ flex: 1 }}>
                    {video.url
                      ? <p style={{ fontSize: 12, color: '#eeeef0' }}>Video uploaded · {video.durationSeconds}s</p>
                      : <div className="flex items-center gap-2"><div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid #1c2333', borderTop: '2px solid #e8607a', borderRadius: '50%' }} /><span style={{ fontSize: 12, color: '#6b7280' }}>Uploading…</span></div>
                    }
                  </div>
                  {video.url && (
                    <button type="button" onClick={() => setVideo(null)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── SECTION F ── */}
          <div ref={secRefs[5]} id="section-f" className="mb-16">
            <SectionHeader letter="F" title="Identity Verification" subtitle="Government ID + selfie. Takes 2 minutes. Verified companions are approved first." />

            {verifyStatus === 'idle' && (
              <div>
                <button type="button" onClick={startVerification}
                  style={{ display: 'block', background: '#e8607a', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', marginBottom: 12 }}>
                  Start verification →
                </button>
                <button type="button" onClick={() => setVerifyStatus('skipped')}
                  style={{ background: 'transparent', border: 'none', fontSize: 12, color: '#6b7280', cursor: 'pointer', padding: 0 }}>
                  I'll do this later from my dashboard
                </button>
              </div>
            )}

            {verifyStatus === 'running' && verifyUrl && (
              <DiditVerify verificationUrl={verifyUrl} onComplete={result => {
                setVerifyStatus(result.type === 'completed' ? 'pending' : 'declined')
                setVerifyUrl(null)
              }} />
            )}

            {verifyStatus === 'running' && !verifyUrl && (
              <div className="flex items-center gap-2">
                <div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid #1c2333', borderTop: '2px solid #e8607a', borderRadius: '50%' }} />
                <span style={{ fontSize: 13, color: '#6b7280' }}>Starting verification…</span>
              </div>
            )}

            {verifyStatus === 'pending' && (
              <div className="flex items-center gap-3" style={{ background: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.25)', borderRadius: 10, padding: '12px 16px' }}>
                <CheckCircle2 size={16} color="#c9a96e" />
                <span style={{ fontSize: 13, color: '#c9a96e' }}>Verification submitted — we'll confirm within a few minutes.</span>
              </div>
            )}

            {verifyStatus === 'approved' && (
              <div className="flex items-center gap-3" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 10, padding: '12px 16px' }}>
                <CheckCircle2 size={16} color="#34d399" />
                <span style={{ fontSize: 13, color: '#34d399' }}>Identity verified ✓</span>
              </div>
            )}

            {verifyStatus === 'declined' && (
              <div className="flex items-center gap-3" style={{ background: 'rgba(232,96,122,0.06)', border: '1px solid rgba(232,96,122,0.25)', borderRadius: 10, padding: '12px 16px' }}>
                <AlertCircle size={16} color="#e8607a" />
                <span style={{ fontSize: 13, color: '#e8607a' }}>Verification was not completed. You can retry from your dashboard.</span>
              </div>
            )}

            {verifyStatus === 'skipped' && (
              <div className="flex items-center gap-3" style={{ background: 'rgba(107,114,128,0.06)', border: '1px solid #1c2333', borderRadius: 10, padding: '12px 16px' }}>
                <Clock size={16} color="#6b7280" />
                <span style={{ fontSize: 13, color: '#6b7280' }}>Verification pending — complete this from your dashboard to speed up approval.</span>
              </div>
            )}
          </div>

        </div>

        {/* ── Sticky bottom bar ── */}
        <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 border-t border-[#1c2333]"
          style={{ background: 'rgba(7,9,15,0.9)', backdropFilter: 'blur(12px)' }}>

          {/* Completion dots */}
          <div className="flex items-center gap-2">
            {[sectionADone, sectionBDone, sectionCDone, sectionDDone, sectionEDone, sectionFDone].map((done, i) => (
              <button key={i} type="button" onClick={() => scrollTo(i)}
                style={{
                  width: 8, height: 8, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
                  background: done ? '#e8607a' : '#1c2333',
                  transition: 'background 0.2s',
                }} />
            ))}
          </div>

          {/* Error */}
          {submitError && (
            <p style={{ fontSize: 11, color: '#e8607a', flex: 1, textAlign: 'center', marginInline: 12 }}>{submitError}</p>
          )}

          {/* Submit */}
          <button type="submit" disabled={!canSubmit || submitting}
            style={{
              background: '#e8607a', color: '#fff', border: 'none', borderRadius: 10,
              padding: '10px 22px', fontSize: 13.5, fontWeight: 500, cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed',
              opacity: !canSubmit || submitting ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 8,
              transition: 'opacity 0.2s',
            }}>
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Save & continue →
          </button>
        </div>
      </form>
    </div>
  )
}
