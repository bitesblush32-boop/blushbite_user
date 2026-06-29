'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUploadToCloudinary } from '@/hooks/useUploadToCloudinary'
import Image from 'next/image'
import {
  Camera,
  Edit2,
  CheckCircle2,
  X,
  Plus,
  Loader2,
  Star,
  Phone,
  BookOpen,
  Film,
  PenLine,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  User,
  Sparkles,
  LayoutGrid,
  ShieldCheck,
  Palette,
} from 'lucide-react'

const DiditVerify = dynamic(() => import('@/components/ui/DiditVerify'), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────────────────

interface PhotoRow {
  id: string
  url: string
  storage_key: string
  is_primary: boolean
  is_approved: boolean
  sort_order: number
}
interface VideoRow {
  id: string
  url: string
  storage_key: string
  duration_seconds: number | null
  thumbnail_url: string | null
  is_approved: boolean
}
interface StoryRow {
  id: string
  title: string | null
  moderation_status: string
  like_count: number
  created_at: string
}
interface CardRow {
  id: string
  title: string
  description: string | null
  duration_minutes: number | null
  price: string | null
  currency: string
  session_type: string | null
}
interface TagItem {
  id: number
  name: string
  category_id?: number
}

interface ProfileData {
  companion: {
    id: string
    name: string | null
    email: string
    alias: string | null
    full_name: string | null
    date_of_birth: string | null
    country: string | null
    whatsapp_number: string | null
    companion_stage: number
  }
  profile: {
    id: string
    bio: string | null
    tagline: string | null
    city: string | null
    availability_status: string
    is_live: boolean
    is_verified: boolean
    height_cm: number | null
    body_type: string | null
    ethnicity: string | null
    eye_color: string | null
    hair_color: string | null
    whatsapp_number: string | null
    profile_completeness: number
    is_visible_to_users: boolean
  }
  photos: PhotoRow[]
  videos: VideoRow[]
  stories: StoryRow[]
  verification: { provider_status: string | null; verified_at: string | null } | null
  selected_fantasy_tag_ids: number[]
  selected_vibe_tag_ids: number[]
  available_fantasy_tags: TagItem[]
  available_vibe_tags: TagItem[]
  session_cards: CardRow[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BODY_TYPES = [
  { value: 'slim', label: 'Slim' },
  { value: 'athletic', label: 'Athletic' },
  { value: 'average', label: 'Average' },
  { value: 'curvy', label: 'Curvy' },
  { value: 'plus_size', label: 'Plus Size' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]
const ETHNICITIES = [
  'Asian',
  'Black',
  'Hispanic/Latino',
  'Middle Eastern',
  'South Asian',
  'White/Caucasian',
  'Mixed',
  'Other',
]
const EYE_COLORS = ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber']
const HAIR_COLORS = ['Black', 'Brown', 'Blonde', 'Red', 'Auburn', 'Other']
const AVAILABILITY = [
  { value: 'available', label: 'Available', dot: '#34d399' },
  { value: 'busy', label: 'By Appointment', dot: '#c9a96e' },
  { value: 'offline', label: 'Offline', dot: '#6b7280' },
]

function cmToFeet(cm: number) {
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return `${feet}'${inches}"`
}

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const basicsSchema = z.object({
  name: z.string().min(1, 'Required').max(255),
  bio: z.string().max(500, 'Max 500 characters').optional(),
  tagline: z.string().max(80, 'Max 80 characters').optional(),
  city: z.string().max(100).optional(),
})

const whatsappSchema = z.object({
  whatsapp_number: z.string().regex(/^\+[1-9]\d{6,14}$/, 'Include country code e.g. +31612345678'),
})

const legalSchema = z.object({
  full_name: z.string().min(2, 'Required').max(255),
  date_of_birth: z.string().min(1, 'Required'),
  country: z.string().min(1, 'Required').max(100),
})

const serviceCardSchema = z.object({
  title: z.string().min(1, 'Required').max(200),
  description: z.string().optional(),
  duration_minutes: z.coerce.number().int().positive().optional(),
  price: z.string().optional(),
  session_type: z.enum(['in_person', 'audio_call', 'video_call', 'chat', 'custom']).optional(),
})

// ─── Section entrance animation ───────────────────────────────────────────────

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

// ─── Chip component ───────────────────────────────────────────────────────────

function Chip({
  label,
  active,
  onClick,
  gold,
}: {
  label: string
  active: boolean
  onClick: () => void
  gold?: boolean
}) {
  const color = gold ? '#c9a96e' : '#e8607a'
  const border = active ? (gold ? 'rgba(201,169,110,0.4)' : 'rgba(232,96,122,0.4)') : '#1c2333'
  const bg = active ? (gold ? 'rgba(201,169,110,0.08)' : 'rgba(232,96,122,0.08)') : 'transparent'
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: 12,
        padding: '10px 14px',
        borderRadius: 999,
        border: `1px solid ${border}`,
        color: active ? color : '#6b7280',
        background: bg,
        cursor: 'pointer',
        minHeight: 44,
        lineHeight: 1,
        transition: 'border-color 0.15s, color 0.15s, background 0.15s, transform 0.15s',
        transform: active ? 'scale(1)' : 'scale(0.97)',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.borderColor =
          border === '#1c2333' ? 'rgba(232,96,122,0.2)' : border
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = border
      }}
    >
      {label}
    </button>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; border: string; label: string }> = {
    approved: {
      color: '#34d399',
      bg: 'rgba(52,211,153,0.08)',
      border: 'rgba(52,211,153,0.25)',
      label: 'Approved',
    },
    pending: {
      color: '#c9a96e',
      bg: 'rgba(201,169,110,0.08)',
      border: 'rgba(201,169,110,0.25)',
      label: 'Pending',
    },
    rejected: {
      color: '#e8607a',
      bg: 'rgba(232,96,122,0.08)',
      border: 'rgba(232,96,122,0.25)',
      label: 'Rejected',
    },
  }
  const s = map[status] ?? map.pending
  return (
    <span
      style={{
        fontSize: 10,
        padding: '3px 8px',
        borderRadius: 999,
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  )
}

// ─── Input style ──────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#161d2a',
  border: '1px solid #1c2333',
  borderRadius: 10,
  padding: '12px 14px',
  color: '#eeeef0',
  fontSize: 16,
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 6,
  display: 'block',
}

// ─── PATCH helper ─────────────────────────────────────────────────────────────

async function patchSection(section: string, body: Record<string, unknown>) {
  const res = await fetch('/api/companions/profile/full', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ section, ...body }),
    credentials: 'include',
  })
  if (!res.ok) {
    const j = await res.json().catch(() => ({}))
    throw new Error(j.error ?? 'Save failed')
  }
  return res.json()
}

// ─── Wizard steps definition ──────────────────────────────────────────────────

const WIZARD_STEPS = [
  { label: 'Profile', icon: User, desc: 'Name, bio, city' },
  { label: 'Appearance', icon: Palette, desc: 'Photos, looks, videos' },
  { label: 'Services', icon: LayoutGrid, desc: 'Session cards & contact' },
  { label: 'Vibe', icon: Sparkles, desc: 'Tags & fantasy style' },
  { label: 'Verify', icon: ShieldCheck, desc: 'Identity & content' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompanionProfilePage() {
  const router = useRouter()
  const [data, setData] = useState<ProfileData | null>(null)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(0)
  const [pendingSave, setPendingSave] = useState<(() => Promise<void>) | null>(null)

  // Shared query key with companion/profile/page.tsx — cache hit on second visit
  const { data: queryData, isLoading: loading } = useQuery<ProfileData | null>({
    queryKey: ['companion', 'profile', 'full'],
    queryFn: () =>
      fetch('/api/companions/profile/full', { credentials: 'include' })
        .then((r) => r.json())
        .then((d) => (d.error ? null : d)),
    staleTime: 2 * 60 * 1000,
  })

  // Sync fetched data into local mutable state (wizard edits live in local state)
  useEffect(() => {
    if (queryData) setData(queryData)
  }, [queryData])

  const updateData = useCallback((patch: Partial<ProfileData>) => {
    setData((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

  const flushSave = async () => {
    if (!pendingSave || saving) return
    setSaving(true)
    try {
      await pendingSave()
      setPendingSave(null)
    } finally {
      setSaving(false)
    }
  }

  const goNext = async () => {
    await flushSave()
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = async () => {
    await flushSave()
    setStep((s) => Math.max(s - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goToStep = async (idx: number) => {
    await flushSave()
    setStep(idx)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}
      >
        <Loader2 size={24} color="#e8607a" className="animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280', fontSize: 14 }}>
        Could not load your profile. Refresh to try again.
      </div>
    )
  }

  const isLast = step === WIZARD_STEPS.length - 1

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', paddingTop: 95, paddingBottom: 120 }}>
      {/* ── Sticky wizard header ─────────────────────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          top: 75,
          zIndex: 50,
          background: 'rgba(10,12,20,0.97)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid #1c2333',
          paddingBottom: 0,
        }}
      >
        {/* Title row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 0 10px',
          }}
        >
          <div>
            <span
              style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#eeeef0' }}
            >
              {WIZARD_STEPS[step].label}
            </span>
            <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 10 }}>
              {WIZARD_STEPS[step].desc}
            </span>
          </div>
          {pendingSave && (
            <button
              onClick={flushSave}
              disabled={saving}
              style={{
                fontSize: 12,
                fontWeight: 500,
                padding: '6px 16px',
                borderRadius: 20,
                background: '#e8607a',
                color: '#fff',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                opacity: saving ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              {saving && <Loader2 size={12} className="animate-spin" />}
              Save
            </button>
          )}
        </div>

        {/* Step progress bar */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {WIZARD_STEPS.map((s, i) => {
            const Icon = s.icon
            const isActive = i === step
            const isCompleted = i < step
            return (
              <button
                key={i}
                onClick={() => goToStep(i)}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '10px 14px',
                  fontSize: 12,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? '#e8607a' : isCompleted ? '#eeeef0' : '#6b7280',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #e8607a' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'color 0.15s, border-color 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {isCompleted ? (
                  <CheckCircle2 size={12} style={{ color: '#34d399', flexShrink: 0 }} />
                ) : (
                  <Icon size={12} style={{ flexShrink: 0 }} />
                )}
                {s.label}
              </button>
            )
          })}
        </div>

        {/* Thin progress fill bar */}
        <div style={{ height: 2, background: '#1c2333' }}>
          <div
            style={{
              height: '100%',
              width: `${((step + 1) / WIZARD_STEPS.length) * 100}%`,
              background: 'linear-gradient(90deg, #e8607a, rgba(232,96,122,0.4))',
              transition: 'width 0.35s ease',
            }}
          />
        </div>
      </div>

      {/* ── Step content ─────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          style={{ paddingTop: 24 }}
        >
          {/* Step 0 — Profile */}
          {step === 0 && (
            <>
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                animate="show"
                style={{ marginBottom: 20 }}
              >
                <ProfileHeaderSection
                  data={data}
                  onAvatarUpload={(url) =>
                    updateData({
                      photos: [
                        {
                          id: 'temp',
                          url,
                          storage_key: '',
                          is_primary: true,
                          is_approved: false,
                          sort_order: 0,
                        },
                        ...data.photos,
                      ],
                    })
                  }
                  onAvailabilityChange={async (status) => {
                    updateData({ profile: { ...data.profile, availability_status: status } })
                    await patchSection('availability', { availability_status: status })
                  }}
                />
              </motion.div>
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                animate="show"
                style={{ marginBottom: 16 }}
              >
                <BasicInfoSection
                  data={data}
                  onRegisterSave={(fn) => setPendingSave(() => fn)}
                  onSaved={(updates) => {
                    updateData({
                      companion: { ...data.companion, name: updates.name ?? data.companion.name },
                      profile: {
                        ...data.profile,
                        bio: updates.bio ?? data.profile.bio,
                        tagline: updates.tagline ?? data.profile.tagline,
                        city: updates.city ?? data.profile.city,
                      },
                    })
                    setPendingSave(null)
                  }}
                />
              </motion.div>
            </>
          )}

          {/* Step 1 — Appearance */}
          {step === 1 && (
            <>
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                animate="show"
                style={{ marginBottom: 16 }}
              >
                <PhysicalSection
                  data={data}
                  onChange={(patch) => updateData({ profile: { ...data.profile, ...patch } })}
                />
              </motion.div>
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                animate="show"
                style={{ marginBottom: 16 }}
              >
                <PhotosSection
                  photos={data.photos}
                  onAdd={(photo) => updateData({ photos: [...data.photos, photo] })}
                  onDelete={(id) => updateData({ photos: data.photos.filter((p) => p.id !== id) })}
                  onSetPrimary={(id) =>
                    updateData({
                      photos: data.photos.map((p) => ({ ...p, is_primary: p.id === id })),
                    })
                  }
                />
              </motion.div>
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                animate="show"
                style={{ marginBottom: 16 }}
              >
                <VideosSection
                  videos={data.videos}
                  onAdd={(video) => updateData({ videos: [...data.videos, video] })}
                  onDelete={(id) => updateData({ videos: data.videos.filter((v) => v.id !== id) })}
                />
              </motion.div>
            </>
          )}

          {/* Step 2 — Services */}
          {step === 2 && (
            <>
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                animate="show"
                style={{ marginBottom: 16 }}
              >
                <ServicesSection
                  data={data}
                  onRegisterSave={(fn) => setPendingSave(() => fn)}
                  onSaved={(cards) => {
                    updateData({ session_cards: cards })
                    setPendingSave(null)
                  }}
                />
              </motion.div>
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                animate="show"
                style={{ marginBottom: 16 }}
              >
                <WhatsAppSection
                  data={data}
                  onRegisterSave={(fn) => setPendingSave(() => fn)}
                  onSaved={(num) => {
                    updateData({
                      companion: { ...data.companion, whatsapp_number: num },
                      profile: { ...data.profile, whatsapp_number: num },
                    })
                    setPendingSave(null)
                  }}
                />
              </motion.div>
            </>
          )}

          {/* Step 3 — Vibe */}
          {step === 3 && (
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="show"
              style={{ marginBottom: 16 }}
            >
              <TagsSection data={data} onChange={(patch) => updateData(patch)} />
            </motion.div>
          )}

          {/* Step 4 — Verify */}
          {step === 4 && (
            <>
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                animate="show"
                style={{ marginBottom: 16 }}
              >
                <VerificationSection
                  verification={data.verification}
                  onVerified={() =>
                    updateData({
                      verification: {
                        ...data.verification,
                        provider_status: 'approved',
                        verified_at: new Date().toISOString(),
                      },
                    })
                  }
                />
              </motion.div>
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                animate="show"
                style={{ marginBottom: 16 }}
              >
                <PostsSection
                  title="Confessions"
                  stories={data.stories}
                  onWrite={() => router.push('/create')}
                  icon={PenLine}
                />
              </motion.div>
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                animate="show"
                style={{ marginBottom: 16 }}
              >
                <PostsSection
                  title="Stories"
                  stories={data.stories}
                  onWrite={() => router.push('/create?type=story')}
                  icon={BookOpen}
                />
              </motion.div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Wizard navigation ────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          background: 'rgba(10,12,20,0.97)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid #1c2333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 24px',
          paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Back */}
        <button
          onClick={goBack}
          disabled={step === 0 || saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: step === 0 ? '#2a3040' : '#6b7280',
            background: 'none',
            border: 'none',
            cursor: step === 0 ? 'default' : 'pointer',
            transition: 'color 0.15s',
          }}
        >
          <ChevronLeft size={16} />
          Back
        </button>

        {/* Step counter */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {WIZARD_STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 20 : 6,
                height: 6,
                borderRadius: 999,
                background: i === step ? '#e8607a' : i < step ? '#34d399' : '#1c2333',
                transition: 'width 0.2s ease, background 0.2s ease',
              }}
            />
          ))}
        </div>

        {/* Next / Finish */}
        <button
          onClick={isLast ? flushSave : goNext}
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 500,
            padding: '10px 22px',
            borderRadius: 24,
            background: '#e8607a',
            color: '#fff',
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {saving && <Loader2 size={13} className="animate-spin" />}
          {isLast ? (saving ? 'Saving…' : 'Done') : 'Continue'}
          {!isLast && <ChevronRight size={15} />}
        </button>
      </div>
    </div>
  )
}

// ─── Profile Header Section ───────────────────────────────────────────────────

function ProfileHeaderSection({
  data,
  onAvatarUpload,
  onAvailabilityChange,
}: {
  data: ProfileData
  onAvatarUpload: (url: string) => void
  onAvailabilityChange: (status: string) => void
}) {
  const { uploadFile, uploading } = useUploadToCloudinary({
    contentFor: 'companion_photo',
    onSuccess: async ({ cdnUrl, s3Key }) => {
      await patchSection('add_photo', { url: cdnUrl, storage_key: s3Key, is_primary: true })
      onAvatarUpload(cdnUrl)
    },
  })

  const primaryPhoto = data.photos.find((p) => p.is_primary) ?? data.photos[0]
  const gradient = 'linear-gradient(135deg,#1a1228,#2a1535,#1a2240)'
  const availDot =
    AVAILABILITY.find((a) => a.value === data.profile.availability_status)?.dot ?? '#6b7280'

  return (
    <div
      style={{ background: '#111620', border: '1px solid #1c2333', borderRadius: 16, padding: 24 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              overflow: 'hidden',
              background: gradient,
              position: 'relative',
              border: '2px solid #1c2333',
            }}
          >
            {primaryPhoto ? (
              <Image
                fill
                src={primaryPhoto.url}
                alt=""
                style={{ objectFit: 'cover' }}
                sizes="96px"
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="40" height="80" viewBox="0 0 70 140" fill="rgba(255,255,255,0.15)">
                  <ellipse cx="35" cy="22" rx="16" ry="18" />
                  <path d="M12 68 Q18 45 35 43 Q52 45 58 68 L60 130 Q50 138 35 140 Q20 138 10 130Z" />
                </svg>
              </div>
            )}
          </div>
          <label
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#e8607a',
              border: '2px solid #0a0c14',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {uploading ? (
              <Loader2 size={12} color="white" className="animate-spin" />
            ) : (
              <Camera size={12} color="white" />
            )}
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) uploadFile(f)
              }}
            />
          </label>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 22,
              color: '#eeeef0',
              marginBottom: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {data.companion.name || 'Your name'}
          </div>
          {data.companion.alias && (
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
              @{data.companion.alias}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: availDot,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              {data.profile.city ? `${data.profile.city} · ` : ''}
              {AVAILABILITY.find((a) => a.value === data.profile.availability_status)?.label ??
                'Offline'}
            </span>
          </div>
          {/* Availability pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {AVAILABILITY.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onAvailabilityChange(opt.value)}
                style={{
                  fontSize: 11,
                  padding: '6px 12px',
                  borderRadius: 999,
                  cursor: 'pointer',
                  minHeight: 32,
                  border: `1px solid ${data.profile.availability_status === opt.value ? opt.dot : '#1c2333'}`,
                  color: data.profile.availability_status === opt.value ? opt.dot : '#6b7280',
                  background:
                    data.profile.availability_status === opt.value ? `${opt.dot}15` : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Basic Info Section ───────────────────────────────────────────────────────

function BasicInfoSection({
  data,
  onRegisterSave,
  onSaved,
}: {
  data: ProfileData
  onRegisterSave: (fn: () => Promise<void>) => void
  onSaved: (updates: { name?: string; bio?: string; tagline?: string; city?: string }) => void
}) {
  const [editing, setEditing] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(basicsSchema),
    defaultValues: {
      name: data.companion.name ?? '',
      bio: data.profile.bio ?? '',
      tagline: data.profile.tagline ?? '',
      city: data.profile.city ?? '',
    },
  })

  useEffect(() => {
    if (editing && isDirty) {
      onRegisterSave(
        handleSubmit(async (values) => {
          await patchSection('basics', values)
          onSaved(values)
          setEditing(false)
        })
      )
    }
  }, [editing, isDirty]) // eslint-disable-line react-hooks/exhaustive-deps

  const enterEdit = () => {
    reset({
      name: data.companion.name ?? '',
      bio: data.profile.bio ?? '',
      tagline: data.profile.tagline ?? '',
      city: data.profile.city ?? '',
    })
    setEditing(true)
  }

  return (
    <SectionCard
      title="Basic Information"
      action={
        !editing ? (
          <button
            onClick={enterEdit}
            style={{
              fontSize: 11,
              color: '#e8607a',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Edit2 size={11} /> Edit
          </button>
        ) : null
      }
    >
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Display Name</label>
            <input {...register('name')} style={inputStyle} placeholder="Your name" />
            {errors.name && (
              <p style={{ fontSize: 11, color: '#e8607a', marginTop: 4 }}>{errors.name.message}</p>
            )}
          </div>
          <div>
            <label style={labelStyle}>
              Tagline <span style={{ color: '#6b7280' }}>(max 80 chars)</span>
            </label>
            <input
              {...register('tagline')}
              style={inputStyle}
              placeholder="A short phrase that captures your vibe"
            />
            {errors.tagline && (
              <p style={{ fontSize: 11, color: '#e8607a', marginTop: 4 }}>
                {errors.tagline.message}
              </p>
            )}
          </div>
          <div>
            <label style={labelStyle}>
              Bio <span style={{ color: '#6b7280' }}>(max 500 chars)</span>
            </label>
            <textarea
              {...register('bio')}
              rows={5}
              style={{
                ...inputStyle,
                resize: 'vertical',
                fontFamily: "'Playfair Display', serif",
                lineHeight: 1.8,
              }}
              placeholder="Tell dreamers who you are…"
            />
            {errors.bio && (
              <p style={{ fontSize: 11, color: '#e8607a', marginTop: 4 }}>{errors.bio.message}</p>
            )}
          </div>
          <div>
            <label style={labelStyle}>City</label>
            <input {...register('city')} style={inputStyle} placeholder="Amsterdam" />
          </div>
          <button
            onClick={() => setEditing(false)}
            style={{
              fontSize: 12,
              color: '#6b7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              alignSelf: 'flex-start',
              padding: 0,
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Row label="Name" value={data.companion.name || '—'} />
          <Row label="Tagline" value={data.profile.tagline || '—'} />
          <Row label="City" value={data.profile.city || '—'} />
          {data.profile.bio && (
            <p
              style={{
                fontSize: 14,
                color: '#c4c8d0',
                lineHeight: 1.9,
                fontFamily: "'Playfair Display', serif",
                marginTop: 4,
              }}
            >
              {data.profile.bio}
            </p>
          )}
        </div>
      )}
    </SectionCard>
  )
}

// ─── WhatsApp Section ─────────────────────────────────────────────────────────

function WhatsAppSection({
  data,
  onRegisterSave,
  onSaved,
}: {
  data: ProfileData
  onRegisterSave: (fn: () => Promise<void>) => void
  onSaved: (num: string | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const existing = data.companion.whatsapp_number ?? data.profile.whatsapp_number

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(whatsappSchema),
    defaultValues: { whatsapp_number: existing ?? '' },
  })

  useEffect(() => {
    if (editing && isDirty) {
      onRegisterSave(
        handleSubmit(async (values) => {
          await patchSection('whatsapp', { whatsapp_number: values.whatsapp_number })
          onSaved(values.whatsapp_number)
          setEditing(false)
        })
      )
    }
  }, [editing, isDirty]) // eslint-disable-line react-hooks/exhaustive-deps

  const masked = existing ? `+${'•'.repeat(existing.length - 3)}${existing.slice(-2)}` : null

  return (
    <SectionCard
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          WhatsApp Contact {existing && <CheckCircle2 size={13} color="#34d399" />}
        </span>
      }
      action={
        !editing ? (
          <button
            onClick={() => {
              reset({ whatsapp_number: existing ?? '' })
              setEditing(true)
            }}
            style={{
              fontSize: 11,
              color: '#e8607a',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Edit2 size={11} /> {existing ? 'Edit' : 'Add'}
          </button>
        ) : null
      }
    >
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>Phone Number</label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 18,
                }}
              >
                🌐
              </span>
              <input
                {...register('whatsapp_number')}
                style={{ ...inputStyle, paddingLeft: 40 }}
                placeholder="+31612345678"
                type="tel"
              />
            </div>
            {errors.whatsapp_number && (
              <p style={{ fontSize: 11, color: '#e8607a', marginTop: 4 }}>
                {errors.whatsapp_number.message}
              </p>
            )}
          </div>
          <button
            onClick={() => setEditing(false)}
            style={{
              fontSize: 12,
              color: '#6b7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              alignSelf: 'flex-start',
              padding: 0,
            }}
          >
            Cancel
          </button>
        </div>
      ) : existing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Phone size={14} color="#6b7280" />
            <span style={{ fontSize: 14, color: '#eeeef0', fontFamily: 'monospace' }}>
              {masked}
            </span>
          </div>
          <div
            style={{
              padding: '10px 16px',
              background: 'rgba(37,211,102,0.08)',
              border: '1px solid rgba(37,211,102,0.25)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>💬</span>
            <span style={{ fontSize: 12.5, color: '#25d366', fontWeight: 500 }}>
              Message on WhatsApp
            </span>
            <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 4 }}>
              — preview of what dreamers see
            </span>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
          Add your WhatsApp number so dreamers can reach you directly. Shown only after booking
          confirmation.
        </p>
      )}
    </SectionCard>
  )
}

// ─── Physical Section ─────────────────────────────────────────────────────────

function PhysicalSection({
  data,
  onChange,
}: {
  data: ProfileData
  onChange: (patch: Partial<ProfileData['profile']>) => void
}) {
  const [height, setHeight] = useState(data.profile.height_cm ?? 170)
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debounce = (field: string, value: unknown) => {
    if (debRef.current) clearTimeout(debRef.current)
    debRef.current = setTimeout(() => {
      patchSection('physical', { [field]: value }).catch(() => {})
    }, 800)
  }

  const handleHeight = (cm: number) => {
    setHeight(cm)
    onChange({ height_cm: cm })
    debounce('height_cm', cm)
  }

  const handleChip = (field: string, value: string) => {
    const current = (data.profile as Record<string, unknown>)[field]
    const next = current === value ? null : value
    onChange({ [field]: next } as Partial<ProfileData['profile']>)
    debounce(field, next)
  }

  return (
    <SectionCard title="About Your Body" subtitle="Shown on your profile">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Height slider */}
        <div>
          <label style={labelStyle}>Height</label>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <span
              style={{ fontSize: 28, fontWeight: 600, color: '#e8607a', transition: 'color 0.15s' }}
            >
              {height}
            </span>
            <span style={{ fontSize: 14, color: '#6b7280', marginLeft: 4 }}>cm</span>
            <span style={{ fontSize: 12, color: '#6b7280', display: 'block', marginTop: 2 }}>
              {cmToFeet(height)}
            </span>
          </div>
          <input
            type="range"
            min={140}
            max={220}
            step={1}
            value={height}
            onChange={(e) => handleHeight(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#e8607a', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: '#6b7280' }}>140 cm</span>
            <span style={{ fontSize: 10, color: '#6b7280' }}>220 cm</span>
          </div>
        </div>

        {/* Body type */}
        <ChipGroup
          label="Body Type"
          options={BODY_TYPES.map((b) => b.label)}
          active={BODY_TYPES.find((b) => b.value === data.profile.body_type)?.label ?? null}
          onSelect={(label) => {
            const found = BODY_TYPES.find((b) => b.label === label)
            if (found) handleChip('body_type', found.value)
          }}
        />

        {/* Ethnicity */}
        <ChipGroup
          label="Ethnicity"
          options={ETHNICITIES}
          active={data.profile.ethnicity}
          onSelect={(label) => handleChip('ethnicity', label)}
        />

        {/* Eye color */}
        <ChipGroup
          label="Eye Color"
          options={EYE_COLORS}
          active={data.profile.eye_color}
          onSelect={(label) => handleChip('eye_color', label)}
        />

        {/* Hair color */}
        <ChipGroup
          label="Hair Color"
          options={HAIR_COLORS}
          active={data.profile.hair_color}
          onSelect={(label) => handleChip('hair_color', label)}
        />
      </div>
    </SectionCard>
  )
}

function ChipGroup({
  label,
  options,
  active,
  onSelect,
}: {
  label: string
  options: string[]
  active: string | null
  onSelect: (v: string) => void
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map((opt) => (
          <Chip key={opt} label={opt} active={active === opt} onClick={() => onSelect(opt)} />
        ))}
      </div>
    </div>
  )
}

// ─── Tags Section ─────────────────────────────────────────────────────────────

function TagsSection({
  data,
  onChange,
}: {
  data: ProfileData
  onChange: (patch: Partial<ProfileData>) => void
}) {
  const [selectedFantasy, setSelectedFantasy] = useState<number[]>(data.selected_fantasy_tag_ids)
  const [selectedVibe, setSelectedVibe] = useState<number[]>(data.selected_vibe_tag_ids)
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debounce = (fantasyIds: number[], vibeIds: number[]) => {
    if (debRef.current) clearTimeout(debRef.current)
    debRef.current = setTimeout(() => {
      patchSection('tags', { fantasy_tag_ids: fantasyIds, vibe_tag_ids: vibeIds }).catch(() => {})
    }, 800)
  }

  const toggleFantasy = (id: number) => {
    const next = selectedFantasy.includes(id)
      ? selectedFantasy.filter((x) => x !== id)
      : [...selectedFantasy, id]
    setSelectedFantasy(next)
    onChange({ selected_fantasy_tag_ids: next })
    debounce(next, selectedVibe)
  }

  const toggleVibe = (id: number) => {
    const next = selectedVibe.includes(id)
      ? selectedVibe.filter((x) => x !== id)
      : [...selectedVibe, id]
    setSelectedVibe(next)
    onChange({ selected_vibe_tag_ids: next })
    debounce(selectedFantasy, next)
  }

  return (
    <SectionCard title="Fantasy & Vibe Tags">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={labelStyle}>
            Fantasy Tags <span style={{ color: '#6b7280' }}>(select at least 3)</span>
          </label>
          {selectedFantasy.length > 0 && selectedFantasy.length < 3 && (
            <p style={{ fontSize: 11, color: '#e8607a', marginBottom: 8 }}>
              Select {3 - selectedFantasy.length} more to meet the minimum
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.available_fantasy_tags.map((tag) => (
              <Chip
                key={tag.id}
                label={tag.name}
                active={selectedFantasy.includes(tag.id)}
                onClick={() => toggleFantasy(tag.id)}
              />
            ))}
          </div>
        </div>
        <div>
          <label style={labelStyle}>
            Vibe Tags <span style={{ color: '#6b7280' }}>(select at least 3)</span>
          </label>
          {selectedVibe.length > 0 && selectedVibe.length < 3 && (
            <p style={{ fontSize: 11, color: '#e8607a', marginBottom: 8 }}>
              Select {3 - selectedVibe.length} more to meet the minimum
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.available_vibe_tags.map((tag) => (
              <Chip
                key={tag.id}
                label={tag.name}
                active={selectedVibe.includes(tag.id)}
                onClick={() => toggleVibe(tag.id)}
                gold
              />
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

// ─── Services & Rates Section ─────────────────────────────────────────────────

function ServicesSection({
  data,
  onRegisterSave,
  onSaved,
}: {
  data: ProfileData
  onRegisterSave: (fn: () => Promise<void>) => void
  onSaved: (cards: CardRow[]) => void
}) {
  const [editing, setEditing] = useState(false)
  const [cards, setCards] = useState<Partial<CardRow>[]>(data.session_cards)

  const enterEdit = () => {
    setCards(data.session_cards)
    setEditing(true)
  }

  useEffect(() => {
    if (editing) {
      onRegisterSave(async () => {
        const validCards = cards.filter((c) => c.title?.trim())
        await patchSection('services', {
          session_cards: validCards.map((c) => ({
            title: c.title!,
            description: c.description,
            duration_minutes: c.duration_minutes,
            price: c.price,
            currency: c.currency ?? 'EUR',
            session_type: c.session_type,
          })),
        })
        onSaved(validCards as CardRow[])
        setEditing(false)
      })
    }
  }, [editing, cards]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SectionCard
      title="Services & Rates"
      action={
        !editing ? (
          <button
            onClick={enterEdit}
            style={{
              fontSize: 11,
              color: '#e8607a',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Edit2 size={11} /> Edit
          </button>
        ) : null
      }
    >
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cards.map((card, i) => (
            <div
              key={i}
              style={{
                background: '#0d1117',
                border: '1px solid #1c2333',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: '#e8607a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Service {i + 1}
                </span>
                <button
                  onClick={() => setCards((prev) => prev.filter((_, idx) => idx !== i))}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: 0,
                  }}
                >
                  <X size={14} />
                </button>
              </div>
              <input
                value={card.title ?? ''}
                placeholder="Session name"
                onChange={(e) =>
                  setCards((prev) =>
                    prev.map((c, idx) => (idx === i ? { ...c, title: e.target.value } : c))
                  )
                }
                style={{ ...inputStyle, fontSize: 14 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={card.price ?? ''}
                  placeholder="€ Price"
                  onChange={(e) =>
                    setCards((prev) =>
                      prev.map((c, idx) => (idx === i ? { ...c, price: e.target.value } : c))
                    )
                  }
                  style={{ ...inputStyle, flex: 1 }}
                />
                <input
                  type="number"
                  value={card.duration_minutes ?? ''}
                  placeholder="Min"
                  onChange={(e) =>
                    setCards((prev) =>
                      prev.map((c, idx) =>
                        idx === i
                          ? { ...c, duration_minutes: Number(e.target.value) || undefined }
                          : c
                      )
                    )
                  }
                  style={{ ...inputStyle, width: 80, flex: 'none' }}
                />
              </div>
              <textarea
                value={card.description ?? ''}
                placeholder="Short description"
                rows={2}
                onChange={(e) =>
                  setCards((prev) =>
                    prev.map((c, idx) => (idx === i ? { ...c, description: e.target.value } : c))
                  )
                }
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          ))}
          <button
            onClick={() => setCards((prev) => [...prev, { title: '', currency: 'EUR' }])}
            style={{
              fontSize: 12.5,
              color: '#e8607a',
              background: 'rgba(232,96,122,0.08)',
              border: '1px solid rgba(232,96,122,0.25)',
              borderRadius: 10,
              padding: '10px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Plus size={13} /> Add service
          </button>
          <button
            onClick={() => setEditing(false)}
            style={{
              fontSize: 12,
              color: '#6b7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              alignSelf: 'flex-start',
              padding: 0,
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.session_cards.length === 0 ? (
            <p style={{ fontSize: 13, color: '#6b7280' }}>
              No services added yet. Add what dreamers can book with you.
            </p>
          ) : (
            data.session_cards.map((card) => (
              <div
                key={card.id}
                style={{
                  background: '#0d1117',
                  border: '1px solid #1c2333',
                  borderRadius: 12,
                  padding: '14px 16px',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 16,
                    color: '#eeeef0',
                    marginBottom: 4,
                  }}
                >
                  {card.title}
                </div>
                {card.description && (
                  <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, marginBottom: 8 }}>
                    {card.description}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {card.price && (
                    <span style={{ fontSize: 17, color: '#e8607a', fontWeight: 500 }}>
                      {card.currency} {card.price}
                    </span>
                  )}
                  {card.duration_minutes && (
                    <span style={{ fontSize: 11, color: '#6b7280' }}>
                      {card.duration_minutes} min
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </SectionCard>
  )
}

// ─── Identity Verification Section ───────────────────────────────────────────

function VerificationSection({
  verification,
  onVerified,
}: {
  verification: ProfileData['verification']
  onVerified: () => void
}) {
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  const startVerification = async () => {
    setStarting(true)
    setError('')
    try {
      const res = await fetch('/api/companions/onboarding/verify/start', {
        method: 'POST',
        credentials: 'include',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      setVerificationUrl(json.verification_url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start verification')
    } finally {
      setStarting(false)
    }
  }

  const status = verification?.provider_status

  const badge =
    status === 'approved'
      ? {
          label: 'Verified ✓',
          color: '#34d399',
          bg: 'rgba(52,211,153,0.1)',
          border: 'rgba(52,211,153,0.25)',
        }
      : status === 'created' || status === 'pending'
        ? {
            label: 'In Progress',
            color: '#c9a96e',
            bg: 'rgba(201,169,110,0.1)',
            border: 'rgba(201,169,110,0.25)',
          }
        : status === 'declined' || status === 'requires_action'
          ? {
              label: 'Declined',
              color: '#e8607a',
              bg: 'rgba(232,96,122,0.1)',
              border: 'rgba(232,96,122,0.25)',
            }
          : null

  return (
    <SectionCard
      title="Identity Verification"
      action={
        badge ? (
          <span
            style={{
              fontSize: 10,
              padding: '3px 10px',
              borderRadius: 999,
              color: badge.color,
              background: badge.bg,
              border: `1px solid ${badge.border}`,
            }}
          >
            {badge.label}
          </span>
        ) : null
      }
    >
      {status === 'approved' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} color="#34d399" />
          <span style={{ fontSize: 13, color: '#34d399' }}>
            Verified
            {verification?.verified_at
              ? ` on ${new Date(verification.verified_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
              : ''}
          </span>
        </div>
      ) : verificationUrl ? (
        <DiditVerify
          verificationUrl={verificationUrl}
          onComplete={(result) => {
            setVerificationUrl(null)
            if (result.type === 'completed') onVerified()
          }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
            {status === 'declined' || status === 'requires_action'
              ? 'Your previous verification was declined. You can try again below.'
              : 'Verify your identity to unlock your profile for dreamers. Uses Didit — takes 2 minutes.'}
          </p>
          {error && <p style={{ fontSize: 12, color: '#e8607a' }}>{error}</p>}
          <button
            onClick={startVerification}
            disabled={starting}
            style={{
              fontSize: 13.5,
              color: '#fff',
              background: '#e8607a',
              border: 'none',
              borderRadius: 10,
              padding: '12px 20px',
              cursor: starting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              alignSelf: 'flex-start',
              opacity: starting ? 0.7 : 1,
            }}
          >
            {starting && <Loader2 size={14} className="animate-spin" />}
            {status === 'declined' || status === 'requires_action'
              ? 'Retry verification'
              : 'Start verification →'}
          </button>
        </div>
      )}
    </SectionCard>
  )
}

// ─── Photos Section ───────────────────────────────────────────────────────────

function PhotosSection({
  photos,
  onAdd,
  onDelete,
  onSetPrimary,
}: {
  photos: PhotoRow[]
  onAdd: (p: PhotoRow) => void
  onDelete: (id: string) => void
  onSetPrimary: (id: string) => void
}) {
  const { uploadFile, uploading } = useUploadToCloudinary({
    contentFor: 'companion_photo',
    onSuccess: async ({ cdnUrl, s3Key }) => {
      await patchSection('add_photo', { url: cdnUrl, storage_key: s3Key })
      onAdd({
        id: crypto.randomUUID(),
        url: cdnUrl,
        storage_key: s3Key,
        is_primary: false,
        is_approved: false,
        sort_order: photos.length,
      })
    },
  })

  return (
    <SectionCard title="Photos">
      {/* Upload zone */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 8,
          padding: '20px 16px',
          border: '1px dashed #1c2333',
          borderRadius: 12,
          cursor: 'pointer',
          marginBottom: 16,
          minHeight: 80,
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLLabelElement).style.borderColor = 'rgba(232,96,122,0.4)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLLabelElement).style.borderColor = '#1c2333'
        }}
      >
        {uploading ? (
          <Loader2 size={20} color="#e8607a" className="animate-spin" />
        ) : (
          <Camera size={20} color="#6b7280" />
        )}
        <span style={{ fontSize: 12, color: '#6b7280' }}>
          {uploading ? 'Uploading…' : 'Tap to add photo'}
        </span>
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) uploadFile(f)
          }}
        />
      </label>

      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {photos.map((photo) => (
            <div
              key={photo.id}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: 12,
                overflow: 'hidden',
                background: '#161d2a',
              }}
              className="group"
            >
              <Image
                fill
                src={photo.url}
                alt=""
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 33vw, 200px"
              />
              {/* Primary star */}
              <button
                onClick={() => {
                  patchSection('set_primary_photo', { photo_id: photo.id })
                  onSetPrimary(photo.id)
                }}
                style={{
                  position: 'absolute',
                  top: 6,
                  left: 6,
                  background: photo.is_primary ? '#c9a96e' : 'rgba(0,0,0,0.5)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <Star size={12} color="white" fill={photo.is_primary ? 'white' : 'none'} />
              </button>
              {/* Approval overlay */}
              <div style={{ position: 'absolute', bottom: 6, right: 6 }}>
                {photo.is_approved ? (
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#34d399',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 size={10} color="white" />
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 9,
                      padding: '2px 6px',
                      background: 'rgba(0,0,0,0.7)',
                      color: '#c9a96e',
                      borderRadius: 4,
                    }}
                  >
                    Pending
                  </span>
                )}
              </div>
              {/* Remove */}
              <button
                onClick={() => {
                  patchSection('delete_photo', { photo_id: photo.id })
                  onDelete(photo.id)
                }}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  background: 'rgba(0,0,0,0.6)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={11} color="white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

// ─── Videos Section ───────────────────────────────────────────────────────────

function VideosSection({
  videos,
  onAdd,
  onDelete,
}: {
  videos: VideoRow[]
  onAdd: (v: VideoRow) => void
  onDelete: (id: string) => void
}) {
  const [durationError, setDurationError] = useState('')
  const { uploadFile, uploading } = useUploadToCloudinary({
    contentFor: 'companion_video',
    onSuccess: async ({ cdnUrl, s3Key }) => {
      await patchSection('add_video', { url: cdnUrl, storage_key: s3Key })
      onAdd({
        id: crypto.randomUUID(),
        url: cdnUrl,
        storage_key: s3Key,
        duration_seconds: null,
        thumbnail_url: null,
        is_approved: false,
      })
    },
  })

  const handleVideoFile = (file: File) => {
    setDurationError('')
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      if (video.duration > 10) {
        setDurationError('Videos must be 10 seconds or less.')
        return
      }
      uploadFile(file)
    }
    video.src = URL.createObjectURL(file)
  }

  return (
    <SectionCard title="Videos" subtitle="Up to 3 short clips (max 10 seconds)">
      {durationError && (
        <p style={{ fontSize: 12, color: '#e8607a', marginBottom: 12 }}>{durationError}</p>
      )}
      {videos.length < 3 && (
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 8,
            padding: '20px 16px',
            border: '1px dashed #1c2333',
            borderRadius: 12,
            cursor: 'pointer',
            marginBottom: 16,
            minHeight: 80,
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLLabelElement).style.borderColor = 'rgba(232,96,122,0.4)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLLabelElement).style.borderColor = '#1c2333'
          }}
        >
          {uploading ? (
            <Loader2 size={20} color="#e8607a" className="animate-spin" />
          ) : (
            <Film size={20} color="#6b7280" />
          )}
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            {uploading ? 'Uploading…' : 'Tap to add video'}
          </span>
          <input
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleVideoFile(f)
            }}
          />
        </label>
      )}
      {videos.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {videos.map((v) => (
            <div
              key={v.id}
              style={{
                position: 'relative',
                width: 120,
                borderRadius: 12,
                overflow: 'hidden',
                background: '#161d2a',
                flexShrink: 0,
              }}
            >
              <video
                src={v.url}
                style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover' }}
                muted
                playsInline
              />
              {v.duration_seconds && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 6,
                    left: 6,
                    fontSize: 10,
                    background: 'rgba(0,0,0,0.7)',
                    color: '#eeeef0',
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  {v.duration_seconds}s
                </span>
              )}
              <div style={{ position: 'absolute', bottom: 6, right: 6 }}>
                {v.is_approved ? (
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#34d399',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 size={10} color="white" />
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 9,
                      padding: '2px 6px',
                      background: 'rgba(0,0,0,0.7)',
                      color: '#c9a96e',
                      borderRadius: 4,
                    }}
                  >
                    Pending
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  patchSection('delete_video', { video_id: v.id })
                  onDelete(v.id)
                }}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  background: 'rgba(0,0,0,0.6)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={11} color="white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

// ─── Posts Section (Confessions & Stories) ────────────────────────────────────

function PostsSection({
  title,
  stories,
  onWrite,
  icon: Icon,
}: {
  title: string
  stories: StoryRow[]
  onWrite: () => void
  icon: React.ElementType
}) {
  return (
    <SectionCard title={title}>
      <button
        onClick={onWrite}
        style={{
          fontSize: 12.5,
          color: '#e8607a',
          background: 'rgba(232,96,122,0.08)',
          border: '1px solid rgba(232,96,122,0.25)',
          borderRadius: 10,
          padding: '10px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 14,
        }}
      >
        <Icon size={13} /> Write {title.toLowerCase().slice(0, -1)}
      </button>
      {stories.length === 0 ? (
        <p style={{ fontSize: 13, color: '#6b7280' }}>
          Nothing here yet. Share your first {title === 'Confessions' ? 'confession' : 'story'}.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {stories.map((s) => (
            <div
              key={s.id}
              style={{
                background: '#0d1117',
                border: '1px solid #1c2333',
                borderRadius: 12,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    color: '#eeeef0',
                    fontFamily: "'Playfair Display', serif",
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.title ?? 'Untitled'}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>
                  {s.like_count} likes ·{' '}
                  {new Date(s.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </div>
              </div>
              <StatusBadge status={s.moderation_status ?? 'pending'} />
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

// ─── Utility sub-components ───────────────────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: React.ReactNode
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: '#111620',
        border: '1px solid #1c2333',
        borderRadius: 16,
        padding: '20px 20px 24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: subtitle ? 2 : 16,
          gap: 8,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: '#eeeef0' }}>{title}</span>
        {action}
      </div>
      {subtitle && <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 16 }}>{subtitle}</p>}
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#eeeef0', textAlign: 'right' }}>{value}</span>
    </div>
  )
}
