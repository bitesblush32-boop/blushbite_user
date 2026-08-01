'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Check,
  X,
  Star,
  Video,
  Image as ImageIcon,
  FileText,
  Globe,
  Clock,
  User,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface CompanionDossier {
  companion: {
    id: string
    email: string
    name: string | null
    full_name: string | null
    date_of_birth: string | null
    country: string | null
    whatsapp_number: string | null
    gender_community: string | null
    companion_stage: number | null
    onboarding_complete: boolean
    created_at: string
  }
  profile: {
    id: string
    bio: string | null
    tagline: string | null
    city: string | null
    hourly_rate: string | null
    currency: string | null
    availability_status: string | null
    is_verified: boolean | null
    verified_at: string | null
    is_live: boolean | null
    is_visible_to_users: boolean | null
    approved_at: string | null
    profile_completeness: number | null
    whatsapp_number: string | null
    telegram_handle: string | null
    height_cm: number | null
    body_type: string | null
    hair_color: string | null
    eye_color: string | null
    ethnicity: string | null
    session_modality: string | null
    instagram_handle: string | null
    website_url: string | null
  } | null
  legal_docs: Array<{
    id: string
    document_type: string
    signed_at: string | null
    ip_address: string | null
    document_version: string | null
  }>
  onboarding_progress: Array<{
    id: string
    stage: number
    status: string
    completed_at: string | null
    notes: string | null
  }>
  photos: Array<{
    id: string
    url: string
    alt_text: string | null
    sort_order: number | null
    is_primary: boolean | null
    is_approved: boolean | null
    created_at: string
  }>
  videos: Array<{
    id: string
    url: string
    thumbnail_url: string | null
    duration_seconds: number | null
    is_approved: boolean | null
    created_at: string
  }>
  fantasy_tags: Array<{ id: number; name: string; slug: string }>
  vibe_tags: Array<{ id: number; name: string; slug: string; emoji: string | null }>
  languages: Array<{ id: number; name: string }>
  session_cards: Array<{
    id: string
    title: string
    description: string | null
    duration_minutes: number | null
    price: string | null
    currency: string | null
    session_type: string | null
    is_active: boolean | null
    sort_order: number | null
  }>
}

// ── Onboarding stages ──────────────────────────────────────────────────────

const STAGES = [
  { n: 1, label: 'Registered' },
  { n: 2, label: 'Approved' },
  { n: 3, label: 'Onboarding' },
  { n: 4, label: 'Legal' },
  { n: 5, label: 'Profile' },
  { n: 6, label: 'Content' },
  { n: 7, label: 'Active' },
]

function OnboardingTracker({ progress }: { progress: CompanionDossier['onboarding_progress'] }) {
  const byStage: Record<number, string> = {}
  progress.forEach((p) => {
    byStage[p.stage] = p.status
  })

  return (
    <div className="flex items-center gap-0 w-full overflow-x-auto pb-1">
      {STAGES.map((s, i) => {
        const status = byStage[s.n]
        const isDone = status === 'completed'
        const isRejected = status === 'rejected'
        const isActive = status === 'in_progress'

        return (
          <div key={s.n} className="flex items-center" style={{ flexShrink: 0 }}>
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium transition-all"
                style={{
                  background: isDone
                    ? 'rgba(232,96,122,0.15)'
                    : isRejected
                      ? 'rgba(239,68,68,0.12)'
                      : isActive
                        ? 'rgba(232,96,122,0.08)'
                        : '#111620',
                  border: isDone
                    ? '1px solid rgba(232,96,122,0.5)'
                    : isRejected
                      ? '1px solid rgba(239,68,68,0.4)'
                      : isActive
                        ? '1px solid rgba(232,96,122,0.3)'
                        : '1px solid #1c2333',
                  color: isDone
                    ? '#e8607a'
                    : isRejected
                      ? '#ef4444'
                      : isActive
                        ? '#e8607a'
                        : '#6b7280',
                }}
              >
                {isDone ? <Check size={12} /> : isRejected ? <X size={12} /> : s.n}
              </div>
              <span className="text-[10px] text-[#6b7280] whitespace-nowrap">{s.label}</span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                className="h-[1px] w-6 mx-1 mb-4"
                style={{ background: isDone ? 'rgba(232,96,122,0.4)' : '#1c2333' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Confirm modal ──────────────────────────────────────────────────────────

function ConfirmModal({
  title,
  body,
  confirmLabel,
  confirmColor,
  onConfirm,
  onCancel,
  showReason,
}: {
  title: string
  body: string
  confirmLabel: string
  confirmColor: string
  onConfirm: (reason?: string) => void
  onCancel: () => void
  showReason?: boolean
}) {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-[6px] z-[900] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[#0d1117] border border-[#1c2333] rounded-[20px] w-full max-w-[440px] overflow-hidden"
      >
        <div
          className="h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${confirmColor}, transparent)`,
          }}
        />
        <div className="p-6">
          <h3
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-[20px] text-[#eeeef0] mb-2"
          >
            {title}
          </h3>
          <p className="text-[13px] text-[#6b7280] leading-[1.6] mb-4">{body}</p>
          {showReason && (
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for rejection (optional)…"
              rows={3}
              className="w-full bg-[#161d2a] border border-[#1c2333] rounded-[10px] px-4 py-3 text-[13px] text-[#eeeef0] placeholder-[#6b7280] outline-none resize-none mb-4 focus:border-[rgba(232,96,122,0.5)] transition-colors"
            />
          )}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-transparent text-[#6b7280] border border-[#1c2333] px-4 py-[10px] rounded-[10px] text-[13px] cursor-pointer transition-all hover:border-white/20 hover:text-[#eeeef0]"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(showReason ? reason : undefined)}
              className="flex-1 text-white border-none px-4 py-[10px] rounded-[10px] text-[13px] font-medium cursor-pointer transition-all hover:-translate-y-px"
              style={{ background: confirmColor }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function AdminCompanionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [modal, setModal] = useState<'takedown' | 'restore' | 'changes' | null>(null)

  const { data, isLoading, error } = useQuery<CompanionDossier>({
    queryKey: ['admin', 'companion', id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/companions/${id}`)
      if (!res.ok) throw new Error('Not found')
      return res.json()
    },
    staleTime: 60_000,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'companion', id] })

  const takeDownMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/companions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_live: false }),
      })
      if (!res.ok) throw new Error('Failed')
    },
    onSuccess: () => {
      invalidate()
      setModal(null)
    },
  })

  const restoreMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/companions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_live: true }),
      })
      if (!res.ok) throw new Error('Failed')
    },
    onSuccess: () => {
      invalidate()
      setModal(null)
    },
  })

  const photoMutation = useMutation({
    mutationFn: async ({ photo_id, action }: { photo_id: string; action: string }) => {
      const res = await fetch(`/api/admin/companions/${id}/photos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_id, action }),
      })
      if (!res.ok) throw new Error('Failed')
    },
    onSuccess: invalidate,
  })

  const videoMutation = useMutation({
    mutationFn: async ({ video_id, action }: { video_id: string; action: string }) => {
      const res = await fetch(`/api/admin/companions/${id}/videos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id, action }),
      })
      if (!res.ok) throw new Error('Failed')
    },
    onSuccess: invalidate,
  })

  if (isLoading) {
    return (
      <div
        className="min-h-screen p-6 md:p-10 flex items-center justify-center"
        style={{ background: '#07090f' }}
      >
        <div className="text-[#6b7280] text-[13px]">Loading dossier…</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div
        className="min-h-screen p-6 md:p-10 flex items-center justify-center"
        style={{ background: '#07090f' }}
      >
        <div className="text-center">
          <div className="text-[#eeeef0] text-[16px] mb-2">Companion not found</div>
          <button onClick={() => router.back()} className="text-[#e8607a] text-[13px]">
            ← Go back
          </button>
        </div>
      </div>
    )
  }

  const {
    companion,
    profile,
    legal_docs,
    onboarding_progress,
    photos,
    videos,
    fantasy_tags,
    vibe_tags,
    languages,
    session_cards,
  } = data
  const isLive = profile?.is_live === true
  const isPending = companion.companion_stage === 3 && !isLive

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen pb-32"
      style={{ background: '#07090f' }}
    >
      {/* Back + top card */}
      <div className="px-6 md:px-10 pt-6 md:pt-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[13px] text-[#6b7280] hover:text-[#eeeef0] transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Back to companions
        </button>

        {/* Identity card */}
        <div className="bg-[#111620] border border-[#1c2333] rounded-[20px] p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-[18px] flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#e8607a,#9b5fe0)' }}
              >
                {(companion.full_name ?? companion.name ?? '?')[0].toUpperCase()}
              </div>
              <div>
                <h1
                  style={{ fontFamily: "'Playfair Display', serif" }}
                  className="text-[24px] text-[#eeeef0] mb-[2px]"
                >
                  {companion.full_name ?? companion.name ?? companion.email}
                </h1>
                <div className="text-[12px] text-[#6b7280]">{companion.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isLive ? (
                <span
                  className="text-[11px] px-[10px] py-1 rounded-full text-[#4ade80]"
                  style={{
                    background: 'rgba(74,222,128,0.1)',
                    border: '1px solid rgba(74,222,128,0.3)',
                  }}
                >
                  ● Live
                </span>
              ) : (
                <span
                  className="text-[11px] px-[10px] py-1 rounded-full text-[#f87171]"
                  style={{
                    background: 'rgba(248,113,113,0.1)',
                    border: '1px solid rgba(248,113,113,0.3)',
                  }}
                >
                  ○ Offline
                </span>
              )}
              {profile?.is_visible_to_users ? (
                <span
                  className="text-[11px] px-[10px] py-1 rounded-full text-[#e8607a]"
                  style={{
                    background: 'rgba(232,96,122,0.1)',
                    border: '1px solid rgba(232,96,122,0.3)',
                  }}
                >
                  ◎ Visible
                </span>
              ) : (
                <span
                  className="text-[11px] px-[10px] py-1 rounded-full text-[#6b7280]"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1c2333' }}
                >
                  ◎ Hidden
                </span>
              )}
              {profile?.is_verified && (
                <span
                  className="text-[11px] px-[10px] py-1 rounded-full text-[#c9a96e]"
                  style={{
                    background: 'rgba(201,169,110,0.12)',
                    border: '1px solid rgba(201,169,110,0.3)',
                  }}
                >
                  ✦ Verified
                </span>
              )}
              {profile?.profile_completeness != null && (
                <span
                  className="text-[11px] px-[10px] py-1 rounded-full"
                  style={{
                    background:
                      profile.profile_completeness >= 80
                        ? 'rgba(74,222,128,0.1)'
                        : profile.profile_completeness >= 50
                          ? 'rgba(201,169,110,0.1)'
                          : 'rgba(255,255,255,0.04)',
                    border:
                      profile.profile_completeness >= 80
                        ? '1px solid rgba(74,222,128,0.3)'
                        : profile.profile_completeness >= 50
                          ? '1px solid rgba(201,169,110,0.3)'
                          : '1px solid #1c2333',
                    color:
                      profile.profile_completeness >= 80
                        ? '#4ade80'
                        : profile.profile_completeness >= 50
                          ? '#c9a96e'
                          : '#6b7280',
                  }}
                >
                  {profile.profile_completeness}% complete
                </span>
              )}
            </div>
          </div>

          {/* Onboarding tracker */}
          <div className="mt-6 pt-5 border-t border-[#1c2333]">
            <div className="text-[11px] text-[#6b7280] uppercase tracking-[0.06em] mb-3">
              Onboarding Progress
            </div>
            <OnboardingTracker progress={onboarding_progress} />
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* LEFT: Identity + Legal + Verification */}
          <div className="flex flex-col gap-4">
            {/* Identity */}
            <div className="bg-[#111620] border border-[#1c2333] rounded-[14px] p-5">
              <div className="flex items-center gap-2 mb-4">
                <User size={14} color="#e8607a" />
                <span className="text-[13px] font-medium text-[#eeeef0]">Identity</span>
              </div>
              <dl className="flex flex-col gap-3">
                {/* Community badge */}
                {companion.gender_community && (
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-[12px] text-[#6b7280] flex-shrink-0">Community</dt>
                    <dd>
                      <span
                        className="text-[11px] px-[10px] py-[3px] rounded-full font-medium"
                        style={
                          companion.gender_community === 'female'
                            ? { background: 'rgba(232,96,122,0.12)', border: '1px solid rgba(232,96,122,0.35)', color: '#e8607a' }
                            : companion.gender_community === 'male'
                              ? { background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.35)', color: '#60a5fa' }
                              : { background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.35)', color: '#c9a96e' }
                        }
                      >
                        {companion.gender_community === 'female' ? 'Female' : companion.gender_community === 'male' ? 'Male' : 'TS / Shemale'}
                      </span>
                    </dd>
                  </div>
                )}
                {[
                  ['Display name', companion.name ?? '—'],
                  ['Full name', companion.full_name ?? '—'],
                  [
                    'Date of birth',
                    companion.date_of_birth
                      ? new Date(companion.date_of_birth).toLocaleDateString('en-GB')
                      : '—',
                  ],
                  ['Country', companion.country ?? '—'],
                  ['City', profile?.city ?? '—'],
                  [
                    'Joined',
                    new Date(companion.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    }),
                  ],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-start justify-between gap-3">
                    <dt className="text-[12px] text-[#6b7280] flex-shrink-0">{label}</dt>
                    <dd className="text-[13px] text-[#eeeef0] text-right">{val}</dd>
                  </div>
                ))}
                {/* WhatsApp */}
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[12px] text-[#6b7280] flex-shrink-0">WhatsApp</dt>
                  <dd className="text-[13px] text-right">
                    {companion.whatsapp_number || profile?.whatsapp_number ? (
                      <a
                        href={`tel:${companion.whatsapp_number ?? profile?.whatsapp_number}`}
                        className="text-[#4ade80] hover:underline"
                      >
                        {companion.whatsapp_number ?? profile?.whatsapp_number}
                      </a>
                    ) : (
                      <span className="text-[#6b7280]">—</span>
                    )}
                  </dd>
                </div>
                {/* Telegram */}
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[12px] text-[#6b7280] flex-shrink-0">Telegram</dt>
                  <dd className="text-[13px] text-[#eeeef0] text-right">
                    {profile?.telegram_handle ? `@${profile.telegram_handle}` : <span className="text-[#6b7280]">—</span>}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Legal docs */}
            <div className="bg-[#111620] border border-[#1c2333] rounded-[14px] p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={14} color="#e8607a" />
                <span className="text-[13px] font-medium text-[#eeeef0]">Legal Documents</span>
              </div>
              {legal_docs.length === 0 ? (
                <p className="text-[12px] text-[#6b7280]">No legal documents on file.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {legal_docs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between">
                      <div>
                        <div className="text-[13px] text-[#eeeef0] capitalize">
                          {doc.document_type.replace(/_/g, ' ')}
                        </div>
                        {doc.signed_at && (
                          <div className="text-[11px] text-[#6b7280]">
                            Signed {new Date(doc.signed_at).toLocaleDateString('en-GB')}
                          </div>
                        )}
                        {doc.document_version && (
                          <div className="text-[10px] text-[#6b7280]">v{doc.document_version}</div>
                        )}
                      </div>
                      <span
                        className="inline-flex items-center gap-[5px] text-[11px] px-[10px] py-1 rounded-full text-[#c9a96e]"
                        style={{
                          background: 'rgba(201,169,110,0.12)',
                          border: '1px solid rgba(201,169,110,0.3)',
                        }}
                      >
                        <Check size={10} /> Signed
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT: Profile + Tags + Sessions */}
          <div className="flex flex-col gap-4">
            {/* Profile */}
            <div className="bg-[#111620] border border-[#1c2333] rounded-[14px] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Globe size={14} color="#e8607a" />
                <span className="text-[13px] font-medium text-[#eeeef0]">Profile</span>
              </div>
              {!profile ? (
                <p className="text-[12px] text-[#6b7280]">No profile created yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {profile.tagline && (
                    <p
                      className="text-[13px] text-[#eeeef0] italic"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      &ldquo;{profile.tagline}&rdquo;
                    </p>
                  )}
                  {profile.bio && (
                    <p className="text-[12.5px] text-[#6b7280] leading-[1.6]">{profile.bio}</p>
                  )}
                  <dl className="flex flex-col gap-2 mt-1">
                    {[
                      ['City', profile.city ?? '—'],
                      [
                        'Rate',
                        profile.hourly_rate
                          ? `${profile.currency ?? ''} ${profile.hourly_rate}/hr`
                          : '—',
                      ],
                      ['Availability', profile.availability_status ?? '—'],
                      [
                        'Modality',
                        profile.session_modality === 'in_person'
                          ? 'In Person'
                          : profile.session_modality === 'online'
                            ? 'Online'
                            : profile.session_modality === 'both'
                              ? 'In Person + Online'
                              : '—',
                      ],
                    ].map(([label, val]) => (
                      <div key={label} className="flex items-start justify-between gap-3">
                        <dt className="text-[12px] text-[#6b7280] flex-shrink-0">{label}</dt>
                        <dd className="text-[13px] text-[#eeeef0] text-right">{val}</dd>
                      </div>
                    ))}
                    {/* Instagram */}
                    {profile.instagram_handle && (
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-[12px] text-[#6b7280] flex-shrink-0">Instagram</dt>
                        <dd className="text-[13px] text-right">
                          <a
                            href={`https://instagram.com/${profile.instagram_handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#e8607a] hover:underline"
                          >
                            @{profile.instagram_handle}
                          </a>
                        </dd>
                      </div>
                    )}
                    {/* Website */}
                    {profile.website_url && (
                      <div className="flex items-start justify-between gap-3">
                        <dt className="text-[12px] text-[#6b7280] flex-shrink-0">Website</dt>
                        <dd className="text-[13px] text-right">
                          <a
                            href={profile.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#e8607a] hover:underline"
                          >
                            {profile.website_url.length > 35
                              ? profile.website_url.slice(0, 35) + '…'
                              : profile.website_url}
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </div>

            {/* Tags */}
            {(fantasy_tags.length > 0 || vibe_tags.length > 0) && (
              <div className="bg-[#111620] border border-[#1c2333] rounded-[14px] p-5">
                <div className="text-[13px] font-medium text-[#eeeef0] mb-3">Tags</div>
                {vibe_tags.length > 0 && (
                  <div className="mb-3">
                    <div className="text-[11px] text-[#6b7280] uppercase tracking-[0.05em] mb-2">
                      Vibe
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {vibe_tags.map((t) => (
                        <span
                          key={t.id}
                          className="text-[11px] px-[10px] py-1 rounded-full text-[#e8607a]"
                          style={{
                            background: 'rgba(232,96,122,0.08)',
                            border: '1px solid rgba(232,96,122,0.25)',
                          }}
                        >
                          {t.emoji} {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {fantasy_tags.length > 0 && (
                  <div>
                    <div className="text-[11px] text-[#6b7280] uppercase tracking-[0.05em] mb-2">
                      Fantasy
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {fantasy_tags.map((t) => (
                        <span
                          key={t.id}
                          className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]"
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Physical attributes */}
            {profile && (profile.height_cm || profile.body_type || profile.hair_color || profile.eye_color || profile.ethnicity) && (
              <div className="bg-[#111620] border border-[#1c2333] rounded-[14px] p-5">
                <div className="text-[13px] font-medium text-[#eeeef0] mb-3">Physical</div>
                <dl className="flex flex-col gap-2">
                  {[
                    ['Height', profile.height_cm ? `${profile.height_cm} cm` : '—'],
                    ['Body type', profile.body_type ? profile.body_type.replace(/_/g, ' ') : '—'],
                    ['Hair', profile.hair_color ?? '—'],
                    ['Eyes', profile.eye_color ?? '—'],
                    ['Ethnicity', profile.ethnicity ?? '—'],
                  ].map(([label, val]) => (
                    <div key={label} className="flex items-start justify-between gap-3">
                      <dt className="text-[12px] text-[#6b7280] flex-shrink-0">{label}</dt>
                      <dd className="text-[13px] text-[#eeeef0] text-right capitalize">{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <div className="bg-[#111620] border border-[#1c2333] rounded-[14px] p-5">
                <div className="text-[13px] font-medium text-[#eeeef0] mb-3">Languages</div>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang) => (
                    <span
                      key={lang.id}
                      className="text-[11px] px-[10px] py-1 rounded-full text-[#e8607a]"
                      style={{
                        background: 'rgba(232,96,122,0.08)',
                        border: '1px solid rgba(232,96,122,0.25)',
                      }}
                    >
                      {lang.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Session cards */}
            {session_cards.length > 0 && (
              <div className="bg-[#111620] border border-[#1c2333] rounded-[14px] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={14} color="#e8607a" />
                  <span className="text-[13px] font-medium text-[#eeeef0]">
                    Sessions ({session_cards.length})
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {session_cards.map((sc) => (
                    <div
                      key={sc.id}
                      className="bg-[#161d2a] border border-[#1c2333] rounded-[10px] px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div
                            style={{ fontFamily: "'Playfair Display', serif" }}
                            className="text-[14px] text-[#eeeef0]"
                          >
                            {sc.title}
                          </div>
                          {sc.description && (
                            <div className="text-[11.5px] text-[#6b7280] mt-1 leading-[1.5]">
                              {sc.description}
                            </div>
                          )}
                        </div>
                        <div className="text-[14px] text-[#e8607a] font-medium flex-shrink-0">
                          {sc.price ? `${sc.currency ?? ''} ${sc.price}` : '—'}
                        </div>
                      </div>
                      {sc.duration_minutes && (
                        <div className="text-[11px] text-[#6b7280] mt-2">
                          {sc.duration_minutes} min · {sc.session_type ?? 'session'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Photos grid */}
        {photos.length > 0 && (
          <div className="bg-[#111620] border border-[#1c2333] rounded-[14px] p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon size={14} color="#e8607a" />
              <span className="text-[13px] font-medium text-[#eeeef0]">
                Photos ({photos.length})
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group rounded-[10px] overflow-hidden bg-[#161d2a] border border-[#1c2333]"
                  style={{ aspectRatio: '3/4' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.alt_text ?? ''}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                    {photo.is_primary && (
                      <span
                        className="text-[10px] text-[#c9a96e] px-2 py-[2px] rounded-full"
                        style={{
                          background: 'rgba(201,169,110,0.15)',
                          border: '1px solid rgba(201,169,110,0.3)',
                        }}
                      >
                        Primary
                      </span>
                    )}
                    <div className="flex gap-2">
                      {!photo.is_approved && (
                        <button
                          onClick={() =>
                            photoMutation.mutate({ photo_id: photo.id, action: 'approve' })
                          }
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-all hover:scale-105"
                          style={{ background: 'rgba(34,197,94,0.85)' }}
                          title="Approve"
                        >
                          <Check size={13} />
                        </button>
                      )}
                      <button
                        onClick={() =>
                          photoMutation.mutate({ photo_id: photo.id, action: 'reject' })
                        }
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-all hover:scale-105"
                        style={{ background: 'rgba(239,68,68,0.85)' }}
                        title="Reject"
                      >
                        <X size={13} />
                      </button>
                      {!photo.is_primary && (
                        <button
                          onClick={() =>
                            photoMutation.mutate({ photo_id: photo.id, action: 'set_primary' })
                          }
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-all hover:scale-105"
                          style={{ background: 'rgba(201,169,110,0.85)' }}
                          title="Set as primary"
                        >
                          <Star size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Approved indicator */}
                  {photo.is_approved && (
                    <div
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(34,197,94,0.85)' }}
                    >
                      <Check size={10} color="white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Videos */}
        {videos.length > 0 && (
          <div className="bg-[#111620] border border-[#1c2333] rounded-[14px] p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Video size={14} color="#e8607a" />
              <span className="text-[13px] font-medium text-[#eeeef0]">
                Videos ({videos.length})
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="bg-[#161d2a] border border-[#1c2333] rounded-[10px] overflow-hidden flex items-stretch gap-0"
                >
                  {/* Thumbnail */}
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative flex-shrink-0 w-[100px] bg-[#111620] flex items-center justify-center group"
                    style={{ minHeight: 72 }}
                  >
                    {video.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={video.thumbnail_url}
                        alt=""
                        className="w-full h-full object-cover absolute inset-0"
                      />
                    ) : null}
                    <div className="relative z-10 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-black/80 transition-colors">
                      <Video size={14} color="white" />
                    </div>
                  </a>
                  {/* Info */}
                  <div className="flex items-center justify-between gap-4 flex-1 px-4 py-3">
                    <div>
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] text-[#e8607a] hover:underline"
                      >
                        Watch video ↗
                      </a>
                      {video.duration_seconds && (
                        <div className="text-[11px] text-[#6b7280] mt-[2px]">
                          {video.duration_seconds}s
                        </div>
                      )}
                      <div className="text-[11px] text-[#6b7280]">
                        {new Date(video.created_at).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {video.is_approved ? (
                        <span
                          className="text-[11px] px-[10px] py-1 rounded-full text-[#c9a96e]"
                          style={{
                            background: 'rgba(201,169,110,0.12)',
                            border: '1px solid rgba(201,169,110,0.3)',
                          }}
                        >
                          ✦ Approved
                        </span>
                      ) : (
                        <button
                          onClick={() =>
                            videoMutation.mutate({ video_id: video.id, action: 'approve' })
                          }
                          className="text-[11px] px-[10px] py-1 rounded-full text-white transition-all hover:opacity-80"
                          style={{
                            background: 'rgba(34,197,94,0.2)',
                            border: '1px solid rgba(34,197,94,0.4)',
                            color: '#22c55e',
                          }}
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() =>
                          videoMutation.mutate({ video_id: video.id, action: 'reject' })
                        }
                        className="text-[11px] px-[10px] py-1 rounded-full transition-all hover:opacity-80"
                        style={{
                          background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.3)',
                          color: '#ef4444',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky approval bar */}
      <div
        className="fixed bottom-0 left-0 right-0 md:left-[240px] z-[600] border-t border-[#1c2333] px-6 py-4 flex items-center justify-between gap-4"
        style={{ background: 'rgba(13,17,23,0.96)', backdropFilter: 'blur(20px)' }}
      >
        <div className="text-[12px] text-[#6b7280] hidden sm:block">
          {companion.full_name ?? companion.name ?? companion.email}
          {isLive && <span className="ml-2 text-[#e8607a]">● Live</span>}
          {isPending && <span className="ml-2 text-[#eeeef0]">— Awaiting review</span>}
        </div>
        <div className="flex gap-3 ml-auto">
          {isLive && (
            <button
              onClick={() => setModal('takedown')}
              className="text-[13px] px-5 py-[10px] rounded-[10px] cursor-pointer transition-all"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444',
              }}
            >
              Take Down
            </button>
          )}
          {!isLive && (
            <button
              onClick={() => setModal('restore')}
              className="text-[13px] px-5 py-[10px] rounded-[10px] font-medium cursor-pointer transition-all hover:-translate-y-px"
              style={{
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.35)',
                color: '#22c55e',
              }}
            >
              Restore
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal === 'takedown' && (
          <ConfirmModal
            key="takedown"
            title="Take down companion"
            body="This will remove the companion from the discovery feed immediately. They will still be able to log in and see their profile is paused."
            confirmLabel="Take Down"
            confirmColor="#ef4444"
            onConfirm={() => takeDownMutation.mutate()}
            onCancel={() => setModal(null)}
          />
        )}
        {modal === 'restore' && (
          <ConfirmModal
            key="restore"
            title="Restore companion"
            body="This will make the companion visible in the discovery feed again."
            confirmLabel="Restore"
            confirmColor="#22c55e"
            onConfirm={() => restoreMutation.mutate()}
            onCancel={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
