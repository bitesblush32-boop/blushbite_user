'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  ChevronUp,
  Check,
  MapPin,
  User,
  Sparkles,
  Languages,
  Heart,
  Layers,
  Link,
  Shield,
  ToggleRight,
  AlertCircle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

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
    gender: string | null
    skin_color: string | null
    session_modality: string
    instagram_handle: string | null
    website_url: string | null
    whatsapp_number: string | null
    profile_completeness: number
    is_visible_to_users: boolean
  }
  photos: { id: string; url: string; is_primary: boolean }[]
  verification: {
    provider_status: string
    liveness_check_passed: boolean
    verified_at: string | null
  } | null
  selected_fantasy_tag_ids: number[]
  selected_vibe_tag_ids: number[]
  selected_languages: { language_id: number; fluency: string }[]
  available_fantasy_tags: { id: number; name: string; category_id?: number }[]
  available_vibe_tags: { id: number; name: string }[]
  available_languages: { id: number; code: string; name: string }[]
  session_cards: {
    id: string
    title: string
    price: string | null
    currency: string
    duration_minutes: number | null
    session_type: string | null
    description: string | null
  }[]
}

type SectionId =
  'identity' | 'location' | 'look' | 'languages' | 'vibe' | 'sessions' | 'connect' | 'verified'

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({ pct }: { pct: number }) {
  const r = 48
  const circ = 2 * Math.PI * r
  const dash = circ * (pct / 100)
  return (
    <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
      <svg width={120} height={120} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={60} cy={60} r={r} fill="none" stroke="#1c2333" strokeWidth={6} />
        <motion.circle
          cx={60}
          cy={60}
          r={r}
          fill="none"
          stroke="#c9a96e"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ fontSize: 26, fontWeight: 700, color: '#c9a96e', lineHeight: 1 }}>
          {pct}
        </span>
        <span style={{ fontSize: 10, color: '#6b7280', letterSpacing: '0.06em' }}>%</span>
      </div>
    </div>
  )
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  id,
  icon,
  title,
  summary,
  isComplete,
  isExpanded,
  onToggle,
  children,
}: {
  id: SectionId
  icon: React.ReactNode
  title: string
  summary: string
  isComplete: boolean
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className="relative rounded-[14px] overflow-hidden transition-all duration-300"
      style={{
        background: '#111620',
        border: `1px solid ${isExpanded ? 'rgba(232,96,122,0.35)' : '#1c2333'}`,
        boxShadow: isExpanded ? '0 8px 32px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      {/* Left accent line */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: isComplete ? '#c9a96e' : '#e8607a', opacity: isComplete ? 1 : 0.6 }}
      />

      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between pl-5 pr-4 py-4 text-left"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <div className="flex items-center gap-3">
          <span style={{ color: isComplete ? '#c9a96e' : '#e8607a', opacity: 0.9 }}>{icon}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#eeeef0' }}>{title}</div>
            <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 1 }}>{summary}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isComplete && (
            <span
              className="flex items-center justify-center w-[18px] h-[18px] rounded-full"
              style={{ background: 'rgba(201,169,110,0.18)' }}
            >
              <Check size={10} color="#c9a96e" />
            </span>
          )}
          {isExpanded ? (
            <ChevronUp size={16} color="#6b7280" />
          ) : (
            <ChevronDown size={16} color="#6b7280" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ borderTop: '1px solid #1c2333', padding: '16px 20px 20px 20px' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: '#6b7280',
        marginBottom: 6,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  )
}

function TextInput({
  value,
  onChange,
  onBlur,
  placeholder,
  multiline = false,
  maxLength,
}: {
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  placeholder?: string
  multiline?: boolean
  maxLength?: number
}) {
  const base: React.CSSProperties = {
    width: '100%',
    background: '#161d2a',
    border: '1px solid #1c2333',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 13.5,
    color: '#eeeef0',
    outline: 'none',
    resize: 'none' as const,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  }
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={3}
        style={base}
        onFocus={(e) => {
          ;(e.target as HTMLTextAreaElement).style.borderColor = 'rgba(232,96,122,0.5)'
        }}
      />
    )
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      maxLength={maxLength}
      style={base}
      onFocus={(e) => {
        ;(e.target as HTMLInputElement).style.borderColor = 'rgba(232,96,122,0.5)'
      }}
    />
  )
}

function PillSelect({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            fontSize: 12,
            padding: '6px 14px',
            borderRadius: 20,
            border: 'none',
            cursor: 'pointer',
            background: value === o.value ? 'rgba(232,96,122,0.15)' : 'rgba(255,255,255,0.04)',
            color: value === o.value ? '#e8607a' : '#6b7280',
            outline: value === o.value ? '1px solid rgba(232,96,122,0.4)' : '1px solid #1c2333',
            transition: 'all 0.15s',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function SaveIndicator({ saving }: { saving: boolean }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: saving ? '#c9a96e' : '#4b5563',
        marginTop: 8,
        height: 16,
        transition: 'color 0.3s',
      }}
    >
      {saving ? 'Saving…' : 'Saved'}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfileBuilderPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState<SectionId | null>('identity')
  const [saving, setSaving] = useState<Partial<Record<SectionId, boolean>>>({})
  const saveTimers = useRef<Partial<Record<SectionId, ReturnType<typeof setTimeout>>>>({})

  // Local field state
  const [fields, setFields] = useState({
    name: '',
    bio: '',
    tagline: '',
    city: '',
    availability_status: 'offline',
    session_modality: 'in_person',
    is_live: false,
    height_cm: '',
    body_type: '',
    ethnicity: '',
    eye_color: '',
    hair_color: '',
    gender: '',
    skin_color: '',
    instagram_handle: '',
    website_url: '',
    whatsapp_number: '',
    selected_vibe_tag_ids: [] as number[],
    selected_fantasy_tag_ids: [] as number[],
    selected_languages: [] as { language_id: number; fluency: string }[],
    session_cards: [] as {
      title: string
      description: string
      price: string
      currency: string
      duration_minutes: string
      session_type: string
    }[],
  })

  const { data, isLoading } = useQuery<ProfileData>({
    queryKey: ['companion', 'profile', 'full'],
    queryFn: () => fetch('/api/companions/profile/full').then((r) => r.json()),
  })

  useEffect(() => {
    if (!data) return
    const d = data
    setFields((prev) => ({
      ...prev,
      name: d.companion.name ?? '',
      bio: d.profile.bio ?? '',
      tagline: d.profile.tagline ?? '',
      city: d.profile.city ?? '',
      availability_status: d.profile.availability_status,
      session_modality: d.profile.session_modality ?? 'in_person',
      is_live: d.profile.is_live,
      height_cm: d.profile.height_cm?.toString() ?? '',
      body_type: d.profile.body_type ?? '',
      ethnicity: d.profile.ethnicity ?? '',
      eye_color: d.profile.eye_color ?? '',
      hair_color: d.profile.hair_color ?? '',
      gender: d.profile.gender ?? '',
      skin_color: d.profile.skin_color ?? '',
      instagram_handle: d.profile.instagram_handle ?? '',
      website_url: d.profile.website_url ?? '',
      whatsapp_number: d.profile.whatsapp_number ?? '',
      selected_vibe_tag_ids: d.selected_vibe_tag_ids,
      selected_fantasy_tag_ids: d.selected_fantasy_tag_ids,
      selected_languages: d.selected_languages,
      session_cards: d.session_cards.map((c) => ({
        title: c.title,
        description: c.description ?? '',
        price: c.price ?? '',
        currency: c.currency,
        duration_minutes: c.duration_minutes?.toString() ?? '',
        session_type: c.session_type ?? 'in_person',
      })),
    }))
  }, [data])

  const patch = useCallback(
    async (section: string, body: Record<string, unknown>) => {
      await fetch('/api/companions/profile/full', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, ...body }),
      })
      qc.invalidateQueries({ queryKey: ['companion', 'profile', 'full'] })
    },
    [qc]
  )

  const debouncedSave = useCallback(
    (sectionId: SectionId, section: string, body: Record<string, unknown>, delay = 800) => {
      setSaving((s) => ({ ...s, [sectionId]: true }))
      clearTimeout(saveTimers.current[sectionId])
      saveTimers.current[sectionId] = setTimeout(async () => {
        await patch(section, body)
        setSaving((s) => ({ ...s, [sectionId]: false }))
      }, delay)
    },
    [patch]
  )

  const toggleSection = (id: SectionId) => setExpanded((prev) => (prev === id ? null : id))

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-4 max-w-[640px] mx-auto px-5 pt-[95px] pb-[100px]">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-[68px] rounded-[14px] animate-pulse"
            style={{ background: '#111620' }}
          />
        ))}
      </div>
    )
  }

  const pct = data.profile.profile_completeness
  const isLiveGated = pct < 70

  // Completeness checks per section
  const sectionComplete: Record<SectionId, boolean> = {
    identity: !!(fields.name && fields.bio && fields.tagline),
    location: !!(fields.city && fields.session_modality),
    look: !!(fields.gender && fields.height_cm && fields.body_type),
    languages: fields.selected_languages.length > 0,
    vibe: fields.selected_vibe_tag_ids.length > 0 && fields.selected_fantasy_tag_ids.length > 0,
    sessions: fields.session_cards.length > 0,
    connect: !!fields.whatsapp_number,
    verified: data.verification?.provider_status === 'approved',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-[640px] mx-auto px-5 pt-[95px] pb-[100px]"
    >
      {/* Header */}
      <div className="flex flex-col items-center mb-8">
        <ProgressRing pct={pct} />
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22,
            color: '#eeeef0',
            marginTop: 16,
            marginBottom: 4,
            textAlign: 'center',
          }}
        >
          Your world is <em style={{ fontStyle: 'italic', color: '#c9a96e' }}>{pct}% revealed</em>
        </h1>
        {pct < 100 && (
          <p style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
            {Object.values(sectionComplete).filter((v) => !v).length} section
            {Object.values(sectionComplete).filter((v) => !v).length !== 1 ? 's' : ''} left to
            complete
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {/* ── Identity ── */}
        <SectionCard
          id="identity"
          icon={<User size={16} />}
          title="Identity"
          summary={fields.name || 'Name, tagline, bio'}
          isComplete={sectionComplete.identity}
          isExpanded={expanded === 'identity'}
          onToggle={() => toggleSection('identity')}
        >
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel>Display name</FieldLabel>
              <TextInput
                value={fields.name}
                onChange={(v) => setFields((f) => ({ ...f, name: v }))}
                placeholder="How dreamers will know you"
                onBlur={() => debouncedSave('identity', 'basics', { name: fields.name })}
              />
            </div>
            <div>
              <FieldLabel>Vibe headline</FieldLabel>
              <TextInput
                value={fields.tagline}
                onChange={(v) => setFields((f) => ({ ...f, tagline: v }))}
                placeholder="One line that captures your essence"
                maxLength={300}
                onBlur={() => debouncedSave('identity', 'basics', { tagline: fields.tagline })}
              />
            </div>
            <div>
              <FieldLabel>About you</FieldLabel>
              <TextInput
                value={fields.bio}
                onChange={(v) => setFields((f) => ({ ...f, bio: v }))}
                placeholder="Write as if you're whispering it…"
                multiline
                maxLength={2000}
                onBlur={() => debouncedSave('identity', 'basics', { bio: fields.bio })}
              />
            </div>
            <SaveIndicator saving={!!saving.identity} />
          </div>
        </SectionCard>

        {/* ── Location ── */}
        <SectionCard
          id="location"
          icon={<MapPin size={16} />}
          title="Location & Availability"
          summary={fields.city || 'City, modality, go-live'}
          isComplete={sectionComplete.location}
          isExpanded={expanded === 'location'}
          onToggle={() => toggleSection('location')}
        >
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel>City</FieldLabel>
              <TextInput
                value={fields.city}
                onChange={(v) => setFields((f) => ({ ...f, city: v }))}
                placeholder="Amsterdam, Paris, London…"
                onBlur={() => debouncedSave('location', 'basics', { city: fields.city })}
              />
            </div>
            <div>
              <FieldLabel>Session type</FieldLabel>
              <PillSelect
                value={fields.session_modality}
                onChange={(v) => {
                  setFields((f) => ({ ...f, session_modality: v }))
                  debouncedSave('location', 'modality', { session_modality: v }, 0)
                }}
                options={[
                  { value: 'in_person', label: 'In person' },
                  { value: 'online', label: 'Online' },
                  { value: 'both', label: 'Both' },
                ]}
              />
            </div>
            <div>
              <FieldLabel>Status</FieldLabel>
              <PillSelect
                value={fields.availability_status}
                onChange={(v) => {
                  setFields((f) => ({ ...f, availability_status: v }))
                  debouncedSave('location', 'availability', { availability_status: v }, 0)
                }}
                options={[
                  { value: 'available', label: 'Available' },
                  { value: 'busy', label: 'Busy' },
                  { value: 'offline', label: 'Offline' },
                ]}
              />
            </div>
            <div>
              <FieldLabel>Go live</FieldLabel>
              <div
                className="flex items-center justify-between"
                style={{
                  background: '#161d2a',
                  borderRadius: 10,
                  padding: '10px 14px',
                  border: '1px solid #1c2333',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, color: '#eeeef0' }}>Appear to dreamers</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                    {isLiveGated
                      ? `Complete ${70 - pct}% more to unlock`
                      : 'Toggle your public visibility'}
                  </div>
                </div>
                <button
                  disabled={isLiveGated}
                  onClick={async () => {
                    if (isLiveGated) return
                    const next = !fields.is_live
                    setFields((f) => ({ ...f, is_live: next }))
                    await patch('live', { is_live: next })
                  }}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    border: 'none',
                    cursor: isLiveGated ? 'not-allowed' : 'pointer',
                    background: fields.is_live ? '#e8607a' : '#1c2333',
                    position: 'relative',
                    transition: 'background 0.2s',
                    opacity: isLiveGated ? 0.4 : 1,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 3,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#fff',
                      left: fields.is_live ? 23 : 3,
                      transition: 'left 0.2s',
                    }}
                  />
                </button>
              </div>
              {isLiveGated && (
                <div
                  className="flex items-center gap-2 mt-2"
                  style={{ fontSize: 11, color: '#6b7280' }}
                >
                  <AlertCircle size={11} /> Complete 70% of your profile to go live
                </div>
              )}
            </div>
            <SaveIndicator saving={!!saving.location} />
          </div>
        </SectionCard>

        {/* ── Your Look ── */}
        <SectionCard
          id="look"
          icon={<Sparkles size={16} />}
          title="Your Look"
          summary={
            [fields.gender, fields.body_type, fields.ethnicity].filter(Boolean).join(' · ') ||
            'Gender, body, features'
          }
          isComplete={sectionComplete.look}
          isExpanded={expanded === 'look'}
          onToggle={() => toggleSection('look')}
        >
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel>Gender</FieldLabel>
              <PillSelect
                value={fields.gender}
                onChange={(v) => {
                  setFields((f) => ({ ...f, gender: v }))
                  debouncedSave('look', 'physical', { gender: v || null }, 0)
                }}
                options={[
                  { value: 'woman', label: 'Woman' },
                  { value: 'man', label: 'Man' },
                  { value: 'non_binary', label: 'Non-binary' },
                  { value: 'trans_woman', label: 'Trans woman' },
                  { value: 'trans_man', label: 'Trans man' },
                  { value: 'other', label: 'Other' },
                  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
                ]}
              />
            </div>
            <div>
              <FieldLabel>Height (cm)</FieldLabel>
              <TextInput
                value={fields.height_cm}
                onChange={(v) => setFields((f) => ({ ...f, height_cm: v }))}
                placeholder="e.g. 168"
                onBlur={() => {
                  const h = parseInt(fields.height_cm)
                  if (!isNaN(h) && h >= 140 && h <= 220)
                    debouncedSave('look', 'physical', { height_cm: h })
                }}
              />
            </div>
            <div>
              <FieldLabel>Body type</FieldLabel>
              <PillSelect
                value={fields.body_type}
                onChange={(v) => {
                  setFields((f) => ({ ...f, body_type: v }))
                  debouncedSave('look', 'physical', { body_type: v || null }, 0)
                }}
                options={[
                  { value: 'slim', label: 'Slim' },
                  { value: 'athletic', label: 'Athletic' },
                  { value: 'average', label: 'Average' },
                  { value: 'curvy', label: 'Curvy' },
                  { value: 'plus_size', label: 'Plus size' },
                  { value: 'prefer_not_to_say', label: 'Prefer not' },
                ]}
              />
            </div>
            <div>
              <FieldLabel>Ethnicity</FieldLabel>
              <TextInput
                value={fields.ethnicity}
                onChange={(v) => setFields((f) => ({ ...f, ethnicity: v }))}
                placeholder="e.g. Latina, East Asian, South Asian…"
                maxLength={50}
                onBlur={() =>
                  debouncedSave('look', 'physical', { ethnicity: fields.ethnicity || null })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Eye color</FieldLabel>
                <TextInput
                  value={fields.eye_color}
                  onChange={(v) => setFields((f) => ({ ...f, eye_color: v }))}
                  placeholder="Brown, hazel…"
                  maxLength={30}
                  onBlur={() =>
                    debouncedSave('look', 'physical', { eye_color: fields.eye_color || null })
                  }
                />
              </div>
              <div>
                <FieldLabel>Hair color</FieldLabel>
                <TextInput
                  value={fields.hair_color}
                  onChange={(v) => setFields((f) => ({ ...f, hair_color: v }))}
                  placeholder="Dark, auburn…"
                  maxLength={30}
                  onBlur={() =>
                    debouncedSave('look', 'physical', { hair_color: fields.hair_color || null })
                  }
                />
              </div>
            </div>
            <div>
              <FieldLabel>Skin tone</FieldLabel>
              <PillSelect
                value={fields.skin_color}
                onChange={(v) => {
                  setFields((f) => ({ ...f, skin_color: v }))
                  debouncedSave('look', 'physical', { skin_color: v || null }, 0)
                }}
                options={[
                  { value: 'fair', label: 'Fair' },
                  { value: 'light', label: 'Light' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'olive', label: 'Olive' },
                  { value: 'brown', label: 'Brown' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'ebony', label: 'Ebony' },
                  { value: 'prefer_not_to_say', label: 'Prefer not' },
                ]}
              />
            </div>
            <SaveIndicator saving={!!saving.look} />
          </div>
        </SectionCard>

        {/* ── Languages ── */}
        <SectionCard
          id="languages"
          icon={<Languages size={16} />}
          title="Languages"
          summary={
            fields.selected_languages.length > 0
              ? fields.selected_languages
                  .map((l) => data.available_languages.find((a) => a.id === l.language_id)?.name)
                  .filter(Boolean)
                  .join(', ')
              : 'Which languages do you speak?'
          }
          isComplete={sectionComplete.languages}
          isExpanded={expanded === 'languages'}
          onToggle={() => toggleSection('languages')}
        >
          <LanguagesEditor
            selected={fields.selected_languages}
            available={data.available_languages}
            onChange={(langs) => {
              setFields((f) => ({ ...f, selected_languages: langs }))
              debouncedSave('languages', 'tags', { languages: langs }, 600)
            }}
          />
          <SaveIndicator saving={!!saving.languages} />
        </SectionCard>

        {/* ── Your Vibe ── */}
        <SectionCard
          id="vibe"
          icon={<Heart size={16} />}
          title="Your Vibe"
          summary={
            fields.selected_vibe_tag_ids.length > 0
              ? `${fields.selected_vibe_tag_ids.length} vibe · ${fields.selected_fantasy_tag_ids.length} fantasy tags`
              : 'Vibe + fantasy tags'
          }
          isComplete={sectionComplete.vibe}
          isExpanded={expanded === 'vibe'}
          onToggle={() => toggleSection('vibe')}
        >
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel>Vibe tags</FieldLabel>
              <TagPicker
                available={data.available_vibe_tags}
                selected={fields.selected_vibe_tag_ids}
                onChange={(ids) => {
                  setFields((f) => ({ ...f, selected_vibe_tag_ids: ids }))
                  debouncedSave('vibe', 'tags', { vibe_tag_ids: ids })
                }}
              />
            </div>
            <div>
              <FieldLabel>Fantasy tags</FieldLabel>
              <TagPicker
                available={data.available_fantasy_tags}
                selected={fields.selected_fantasy_tag_ids}
                onChange={(ids) => {
                  setFields((f) => ({ ...f, selected_fantasy_tag_ids: ids }))
                  debouncedSave('vibe', 'tags', { fantasy_tag_ids: ids })
                }}
              />
            </div>
            <SaveIndicator saving={!!saving.vibe} />
          </div>
        </SectionCard>

        {/* ── Sessions ── */}
        <SectionCard
          id="sessions"
          icon={<Layers size={16} />}
          title="Sessions"
          summary={
            fields.session_cards.length > 0
              ? `${fields.session_cards.length} session type${fields.session_cards.length > 1 ? 's' : ''}`
              : 'Define your offerings'
          }
          isComplete={sectionComplete.sessions}
          isExpanded={expanded === 'sessions'}
          onToggle={() => toggleSection('sessions')}
        >
          <SessionCardsEditor
            cards={fields.session_cards}
            onChange={(cards) => {
              setFields((f) => ({ ...f, session_cards: cards }))
              debouncedSave('sessions', 'services', {
                session_cards: cards.map((c) => ({
                  title: c.title,
                  description: c.description || undefined,
                  duration_minutes: c.duration_minutes ? parseInt(c.duration_minutes) : undefined,
                  price: c.price || undefined,
                  currency: c.currency || 'EUR',
                  session_type: c.session_type || undefined,
                })),
              })
            }}
          />
          <SaveIndicator saving={!!saving.sessions} />
        </SectionCard>

        {/* ── Connect ── */}
        <SectionCard
          id="connect"
          icon={<Link size={16} />}
          title="Connect"
          summary={fields.whatsapp_number || 'WhatsApp, Instagram, website'}
          isComplete={sectionComplete.connect}
          isExpanded={expanded === 'connect'}
          onToggle={() => toggleSection('connect')}
        >
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel>WhatsApp (E.164 format)</FieldLabel>
              <TextInput
                value={fields.whatsapp_number}
                onChange={(v) => setFields((f) => ({ ...f, whatsapp_number: v }))}
                placeholder="+31612345678"
                onBlur={() => {
                  if (
                    /^\+[1-9]\d{6,14}$/.test(fields.whatsapp_number) ||
                    fields.whatsapp_number === ''
                  )
                    debouncedSave('connect', 'whatsapp', {
                      whatsapp_number: fields.whatsapp_number || null,
                    })
                }}
              />
            </div>
            <div>
              <FieldLabel>Instagram handle (optional)</FieldLabel>
              <TextInput
                value={fields.instagram_handle}
                onChange={(v) => setFields((f) => ({ ...f, instagram_handle: v }))}
                placeholder="@yourhandle"
                onBlur={() =>
                  debouncedSave('connect', 'social', {
                    instagram_handle: fields.instagram_handle || null,
                  })
                }
              />
            </div>
            <div>
              <FieldLabel>Website (optional)</FieldLabel>
              <TextInput
                value={fields.website_url}
                onChange={(v) => setFields((f) => ({ ...f, website_url: v }))}
                placeholder="https://…"
                onBlur={() =>
                  debouncedSave('connect', 'social', { website_url: fields.website_url || null })
                }
              />
            </div>
            <SaveIndicator saving={!!saving.connect} />
          </div>
        </SectionCard>

        {/* ── Verified ── */}
        <SectionCard
          id="verified"
          icon={<Shield size={16} />}
          title="Verified"
          summary={
            data.verification?.provider_status === 'approved'
              ? '✦ Identity verified'
              : 'Complete ID verification'
          }
          isComplete={sectionComplete.verified}
          isExpanded={expanded === 'verified'}
          onToggle={() => toggleSection('verified')}
        >
          <VerificationDisplay
            verification={data.verification}
            onRetrigger={() => router.push('/companion/onboarding/verify')}
          />
        </SectionCard>
      </div>

      {/* Back link */}
      <button
        onClick={() => router.back()}
        className="w-full mt-6 py-3 rounded-[10px] border border-[#1c2333] text-[13px] bg-transparent cursor-pointer transition-colors hover:border-white/20 hover:text-[#eeeef0]"
        style={{ color: '#6b7280' }}
      >
        ← Back to profile
      </button>
    </motion.div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TagPicker({
  available,
  selected,
  onChange,
}: {
  available: { id: number; name: string }[]
  selected: number[]
  onChange: (ids: number[]) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {available.map((t) => {
        const active = selected.includes(t.id)
        return (
          <button
            key={t.id}
            onClick={() =>
              onChange(active ? selected.filter((id) => id !== t.id) : [...selected, t.id])
            }
            style={{
              fontSize: 11.5,
              padding: '5px 12px',
              borderRadius: 20,
              border: 'none',
              cursor: 'pointer',
              background: active ? 'rgba(232,96,122,0.12)' : 'rgba(255,255,255,0.03)',
              color: active ? '#e8607a' : '#6b7280',
              outline: active ? '1px solid rgba(232,96,122,0.35)' : '1px solid #1c2333',
              transition: 'all 0.15s',
            }}
          >
            {t.name}
          </button>
        )
      })}
    </div>
  )
}

const FLUENCY_OPTS = [
  { value: 'native', label: 'Native' },
  { value: 'fluent', label: 'Fluent' },
  { value: 'conversational', label: 'Conversational' },
]

function LanguagesEditor({
  selected,
  available,
  onChange,
}: {
  selected: { language_id: number; fluency: string }[]
  available: { id: number; code: string; name: string }[]
  onChange: (langs: { language_id: number; fluency: string }[]) => void
}) {
  const [search, setSearch] = useState('')
  const filtered = available
    .filter(
      (l) =>
        l.name.toLowerCase().includes(search.toLowerCase()) &&
        !selected.some((s) => s.language_id === l.id)
    )
    .slice(0, 8)

  const add = (id: number) => onChange([...selected, { language_id: id, fluency: 'fluent' }])
  const remove = (id: number) => onChange(selected.filter((s) => s.language_id !== id))
  const setFluency = (id: number, fluency: string) =>
    onChange(selected.map((s) => (s.language_id === id ? { ...s, fluency } : s)))

  return (
    <div className="flex flex-col gap-3">
      {/* Selected */}
      {selected.map((s) => {
        const lang = available.find((l) => l.id === s.language_id)
        if (!lang) return null
        return (
          <div
            key={s.language_id}
            className="flex items-center justify-between gap-2"
            style={{
              background: '#161d2a',
              borderRadius: 10,
              padding: '8px 12px',
              border: '1px solid #1c2333',
            }}
          >
            <span style={{ fontSize: 13, color: '#eeeef0', minWidth: 80 }}>{lang.name}</span>
            <div className="flex items-center gap-1 flex-1 justify-center">
              {FLUENCY_OPTS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFluency(s.language_id, f.value)}
                  style={{
                    fontSize: 10.5,
                    padding: '3px 9px',
                    borderRadius: 12,
                    border: 'none',
                    cursor: 'pointer',
                    background: s.fluency === f.value ? 'rgba(201,169,110,0.15)' : 'transparent',
                    color: s.fluency === f.value ? '#c9a96e' : '#6b7280',
                    outline:
                      s.fluency === f.value
                        ? '1px solid rgba(201,169,110,0.35)'
                        : '1px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => remove(s.language_id)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#4b5563',
                fontSize: 12,
                padding: 4,
              }}
            >
              ✕
            </button>
          </div>
        )
      })}

      {/* Search */}
      <input
        placeholder="Add a language…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          background: '#161d2a',
          border: '1px solid #1c2333',
          borderRadius: 10,
          padding: '8px 12px',
          fontSize: 13,
          color: '#eeeef0',
          outline: 'none',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
      />
      {search.length > 0 && filtered.length > 0 && (
        <div
          style={{
            background: '#161d2a',
            border: '1px solid #1c2333',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          {filtered.map((l) => (
            <button
              key={l.id}
              onClick={() => {
                add(l.id)
                setSearch('')
              }}
              style={{
                width: '100%',
                padding: '8px 14px',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                color: '#eeeef0',
                borderBottom: '1px solid #1c2333',
              }}
            >
              {l.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SessionCardsEditor({
  cards,
  onChange,
}: {
  cards: {
    title: string
    description: string
    price: string
    currency: string
    duration_minutes: string
    session_type: string
  }[]
  onChange: (c: typeof cards) => void
}) {
  const add = () =>
    onChange([
      ...cards,
      {
        title: '',
        description: '',
        price: '',
        currency: 'EUR',
        duration_minutes: '',
        session_type: 'in_person',
      },
    ])
  const remove = (i: number) => onChange(cards.filter((_, idx) => idx !== i))
  const update = (i: number, field: string, val: string) =>
    onChange(cards.map((c, idx) => (idx === i ? { ...c, [field]: val } : c)))

  return (
    <div className="flex flex-col gap-3">
      {cards.map((c, i) => (
        <div
          key={i}
          style={{
            background: '#161d2a',
            border: '1px solid #1c2333',
            borderRadius: 12,
            padding: '14px 14px 10px',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              style={{
                fontSize: 11,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Session {i + 1}
            </span>
            <button
              onClick={() => remove(i)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#4b5563',
                fontSize: 12,
              }}
            >
              Remove
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <input
              placeholder="Session title"
              value={c.title}
              onChange={(e) => update(i, 'title', e.target.value)}
              style={{
                background: '#111620',
                border: '1px solid #1c2333',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 13,
                color: '#eeeef0',
                outline: 'none',
                fontFamily: 'inherit',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Price (e.g. 280)"
                value={c.price}
                onChange={(e) => update(i, 'price', e.target.value)}
                style={{
                  background: '#111620',
                  border: '1px solid #1c2333',
                  borderRadius: 8,
                  padding: '8px 10px',
                  fontSize: 13,
                  color: '#eeeef0',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
              <input
                placeholder="Duration (min)"
                value={c.duration_minutes}
                onChange={(e) => update(i, 'duration_minutes', e.target.value)}
                style={{
                  background: '#111620',
                  border: '1px solid #1c2333',
                  borderRadius: 8,
                  padding: '8px 10px',
                  fontSize: 13,
                  color: '#eeeef0',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={add}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: 10,
          cursor: 'pointer',
          background: 'transparent',
          border: '1px dashed #1c2333',
          fontSize: 13,
          color: '#6b7280',
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => {
          ;(e.target as HTMLElement).style.borderColor = 'rgba(232,96,122,0.4)'
          ;(e.target as HTMLElement).style.color = '#e8607a'
        }}
        onMouseLeave={(e) => {
          ;(e.target as HTMLElement).style.borderColor = '#1c2333'
          ;(e.target as HTMLElement).style.color = '#6b7280'
        }}
      >
        + Add session type
      </button>
    </div>
  )
}

function VerificationDisplay({
  verification,
  onRetrigger,
}: {
  verification: ProfileData['verification']
  onRetrigger: () => void
}) {
  if (verification?.provider_status === 'approved') {
    return (
      <div
        className="flex items-center gap-3 p-4 rounded-[10px]"
        style={{ background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)' }}
      >
        <Check size={18} color="#c9a96e" />
        <div>
          <div style={{ fontSize: 13, color: '#c9a96e', fontWeight: 500 }}>Identity verified</div>
          {verification.verified_at && (
            <div style={{ fontSize: 11, color: '#6b7280' }}>
              Verified {new Date(verification.verified_at).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    )
  }

  const isPending = verification?.provider_status === 'pending'
  return (
    <div className="flex flex-col gap-3">
      <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
        {isPending
          ? 'Your verification is being reviewed. This usually takes a few hours.'
          : 'Complete a quick liveness check to get verified. Dreamers trust verified companions.'}
      </div>
      {!isPending && (
        <button
          onClick={onRetrigger}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            background: 'rgba(232,96,122,0.12)',
            color: '#e8607a',
            fontSize: 13,
            outline: '1px solid rgba(232,96,122,0.3)',
            transition: 'all 0.15s',
          }}
        >
          Start verification →
        </button>
      )}
    </div>
  )
}
