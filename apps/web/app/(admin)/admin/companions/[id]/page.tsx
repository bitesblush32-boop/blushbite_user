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
  ShieldCheck,
  FileText,
  Globe,
  Clock,
  User,
  AlertTriangle,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface CompanionDossier {
  companion: {
    id: string
    email: string
    alias: string | null
    full_name: string | null
    date_of_birth: string | null
    country: string | null
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
    approved_at: string | null
  } | null
  verification: {
    id: string
    provider: string | null
    provider_status: string | null
    liveness_check_passed: boolean | null
    verified_at: string | null
    id_document_front_url: string | null
    id_document_back_url: string | null
    selfie_url: string | null
    expires_at: string | null
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

// ── Verification cross-check types ────────────────────────────────────────

interface VerificationCrossCheck {
  manually_entered: {
    full_name: string | null
    date_of_birth: string | null
    country: string | null
    whatsapp_number: string | null
  }
  didit_extracted: {
    id: string
    extracted_first_name: string | null
    extracted_last_name: string | null
    extracted_dob: string | null
    document_type: string | null
    document_number: string | null
    issuing_state: string | null
    liveness_score: string | null
    face_match_score: string | null
    overall_status: string | null
  } | null
  verification_status: {
    provider: string | null
    liveness_check_passed: boolean | null
    verified_at: string | null
  } | null
  is_verified: boolean
}

function matchStatus(a: string | null, b: string | null): 'match' | 'mismatch' | 'missing' {
  if (!a || !b) return 'missing'
  return a.toLowerCase().trim() === b.toLowerCase().trim() ? 'match' : 'mismatch'
}

function maskDocNumber(n: string | null): string {
  if (!n) return '—'
  if (n.length <= 5) return n
  return n.slice(0, 3) + '•'.repeat(n.length - 5) + n.slice(-2)
}

function ScoreBar({ score, label }: { score: string | null; label: string }) {
  const pct = score ? Math.min(100, Math.max(0, parseFloat(score))) : 0
  const color = pct >= 80 ? '#34d399' : pct >= 50 ? '#c9a96e' : '#e8607a'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#6b7280' }}>{label}</span>
        <span style={{ fontSize: 11, color, fontWeight: 600 }}>
          {score ? `${parseFloat(score).toFixed(0)}%` : '—'}
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: '#1c2333', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: 2,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  )
}

// ── Onboarding stages ──────────────────────────────────────────────────────

const STAGES = [
  { n: 1, label: 'Identity' },
  { n: 2, label: 'Verify' },
  { n: 3, label: 'Review' },
  { n: 4, label: 'Legal' },
  { n: 5, label: 'Profile' },
  { n: 6, label: 'Content' },
  { n: 7, label: 'Complete' },
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

  const [modal, setModal] = useState<'approve' | 'reject' | 'changes' | 'force_verify' | null>(null)

  const { data, isLoading, error } = useQuery<CompanionDossier>({
    queryKey: ['admin', 'companion', id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/companions/${id}`)
      if (!res.ok) throw new Error('Not found')
      return res.json()
    },
    staleTime: 60_000,
  })

  const { data: verificationData } = useQuery<VerificationCrossCheck>({
    queryKey: ['admin', 'companion', id, 'verification'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/companions/${id}/verification`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    staleTime: 60_000,
    enabled: !!id,
  })

  const forceVerifyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/companions/${id}/approve`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed')
    },
    onSuccess: () => {
      invalidate()
      setModal(null)
    },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'companion', id] })

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/companions/${id}/approve`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed')
    },
    onSuccess: () => {
      invalidate()
      setModal(null)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async (reason?: string) => {
      const res = await fetch(`/api/admin/companions/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
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
    verification,
    legal_docs,
    onboarding_progress,
    photos,
    videos,
    fantasy_tags,
    vibe_tags,
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
                {(companion.full_name ?? companion.alias ?? '?')[0].toUpperCase()}
              </div>
              <div>
                <h1
                  style={{ fontFamily: "'Playfair Display', serif" }}
                  className="text-[24px] text-[#eeeef0] mb-[2px]"
                >
                  {companion.full_name ?? companion.alias ?? companion.email}
                </h1>
                <div className="text-[12px] text-[#6b7280]">{companion.email}</div>
                {companion.alias && (
                  <div className="text-[11px] text-[#6b7280]">{companion.alias}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isLive && (
                <span
                  className="text-[11px] px-[10px] py-1 rounded-full text-[#e8607a]"
                  style={{
                    background: 'rgba(232,96,122,0.1)',
                    border: '1px solid rgba(232,96,122,0.3)',
                  }}
                >
                  ● Live
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
              {isPending && (
                <span
                  className="text-[11px] px-[10px] py-1 rounded-full text-[#eeeef0]"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid #1c2333' }}
                >
                  Awaiting Review
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
                {[
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
                    'Stage',
                    companion.companion_stage != null ? `${companion.companion_stage}` : '—',
                  ],
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

            {/* Verification */}
            <div className="bg-[#111620] border border-[#1c2333] rounded-[14px] p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={14} color="#e8607a" />
                <span className="text-[13px] font-medium text-[#eeeef0]">
                  Identity Verification
                </span>
              </div>
              {!verification ? (
                <p className="text-[12px] text-[#6b7280]">No verification submitted.</p>
              ) : (
                <dl className="flex flex-col gap-3">
                  {[
                    ['Provider', verification.provider ?? '—'],
                    ['Status', verification.provider_status ?? '—'],
                    [
                      'Liveness',
                      verification.liveness_check_passed === true
                        ? '✓ Passed'
                        : verification.liveness_check_passed === false
                          ? '✗ Failed'
                          : '—',
                    ],
                    [
                      'Verified at',
                      verification.verified_at
                        ? new Date(verification.verified_at).toLocaleDateString('en-GB')
                        : '—',
                    ],
                    [
                      'Expires',
                      verification.expires_at
                        ? new Date(verification.expires_at).toLocaleDateString('en-GB')
                        : '—',
                    ],
                  ].map(([label, val]) => (
                    <div key={label} className="flex items-start justify-between gap-3">
                      <dt className="text-[12px] text-[#6b7280] flex-shrink-0">{label}</dt>
                      <dd className="text-[13px] text-[#eeeef0] text-right">{val}</dd>
                    </div>
                  ))}
                  {/* Doc thumbnails */}
                  {(verification.id_document_front_url ||
                    verification.id_document_back_url ||
                    verification.selfie_url) && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {[
                        { label: 'ID Front', url: verification.id_document_front_url },
                        { label: 'ID Back', url: verification.id_document_back_url },
                        { label: 'Selfie', url: verification.selfie_url },
                      ]
                        .filter((d) => d.url)
                        .map((d) => (
                          <a
                            key={d.label}
                            href={d.url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-[#e8607a] px-[10px] py-1 rounded-full transition-all hover:opacity-80"
                            style={{
                              background: 'rgba(232,96,122,0.08)',
                              border: '1px solid rgba(232,96,122,0.25)',
                            }}
                          >
                            {d.label} ↗
                          </a>
                        ))}
                    </div>
                  )}
                </dl>
              )}
            </div>

            {/* ── Didit Cross-Verification ──────────────────────────── */}
            <div className="bg-[#0d1117] border border-[#1c2333] rounded-[16px] p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} color="#e8607a" />
                  <span className="text-[13px] font-medium text-[#eeeef0]">
                    ID Document Cross-Check
                  </span>
                </div>
                {verificationData && (
                  <span
                    className="text-[11px] px-[10px] py-1 rounded-full"
                    style={
                      verificationData.is_verified
                        ? {
                            background: 'rgba(52,211,153,0.1)',
                            border: '1px solid rgba(52,211,153,0.3)',
                            color: '#34d399',
                          }
                        : verificationData.didit_extracted
                          ? {
                              background: 'rgba(201,169,110,0.1)',
                              border: '1px solid rgba(201,169,110,0.3)',
                              color: '#c9a96e',
                            }
                          : {
                              background: 'rgba(107,114,128,0.1)',
                              border: '1px solid #1c2333',
                              color: '#6b7280',
                            }
                    }
                  >
                    {verificationData.is_verified
                      ? 'Verified'
                      : verificationData.didit_extracted
                        ? 'Pending'
                        : 'Not Verified'}
                  </span>
                )}
              </div>

              {!verificationData ? (
                <div className="text-[12px] text-[#6b7280]">Loading…</div>
              ) : !verificationData.didit_extracted ? (
                <div
                  className="flex items-center gap-3 rounded-[10px] p-4"
                  style={{
                    background: 'rgba(201,169,110,0.06)',
                    border: '1px solid rgba(201,169,110,0.2)',
                  }}
                >
                  <AlertTriangle size={14} color="#c9a96e" />
                  <span className="text-[12px] text-[#c9a96e]">
                    Companion has not completed Didit verification yet.
                  </span>
                </div>
              ) : (
                (() => {
                  const ext = verificationData.didit_extracted
                  const ent = verificationData.manually_entered
                  const enteredFullName = [ent.full_name].filter(Boolean).join(' ')
                  const extractedFullName = [ext.extracted_first_name, ext.extracted_last_name]
                    .filter(Boolean)
                    .join(' ')
                  const rows: Array<{
                    label: string
                    entered: string | null
                    extracted: string | null
                  }> = [
                    {
                      label: 'First Name',
                      entered: ent.full_name?.split(' ')[0] ?? null,
                      extracted: ext.extracted_first_name,
                    },
                    {
                      label: 'Last Name',
                      entered: ent.full_name?.split(' ').slice(1).join(' ') || null,
                      extracted: ext.extracted_last_name,
                    },
                    {
                      label: 'Date of Birth',
                      entered: ent.date_of_birth,
                      extracted: ext.extracted_dob,
                    },
                    {
                      label: 'Country / Issuing State',
                      entered: ent.country,
                      extracted: ext.issuing_state,
                    },
                  ]
                  return (
                    <div className="flex flex-col gap-4">
                      {/* Comparison table */}
                      <div>
                        {/* Header */}
                        <div className="grid grid-cols-3 gap-2 mb-2 px-1">
                          <span className="text-[10px] uppercase tracking-[0.06em] text-[#6b7280]">
                            Field
                          </span>
                          <span className="text-[10px] uppercase tracking-[0.06em] text-[#6b7280]">
                            Entered by companion
                          </span>
                          <span className="text-[10px] uppercase tracking-[0.06em] text-[#6b7280]">
                            Extracted from ID
                          </span>
                        </div>
                        <div className="flex flex-col gap-[6px]">
                          {rows.map((row) => {
                            const status = matchStatus(row.entered, row.extracted)
                            return (
                              <div
                                key={row.label}
                                className="grid grid-cols-3 gap-2 items-center px-3 py-[10px] rounded-[10px]"
                                style={{
                                  background:
                                    status === 'mismatch' ? 'rgba(232,96,122,0.05)' : '#111620',
                                  border: `1px solid ${status === 'mismatch' ? 'rgba(232,96,122,0.25)' : '#1c2333'}`,
                                }}
                              >
                                <span className="text-[11px] text-[#6b7280]">{row.label}</span>
                                <span
                                  className="text-[12px]"
                                  style={{ color: status === 'mismatch' ? '#e8607a' : '#eeeef0' }}
                                >
                                  {row.entered ?? '—'}
                                </span>
                                <span
                                  className="flex items-center gap-[6px] text-[12px]"
                                  style={{
                                    color:
                                      status === 'mismatch'
                                        ? '#e8607a'
                                        : status === 'match'
                                          ? '#34d399'
                                          : '#eeeef0',
                                  }}
                                >
                                  {row.extracted ?? '—'}
                                  {status === 'match' && <Check size={11} color="#34d399" />}
                                  {status === 'mismatch' && (
                                    <AlertTriangle size={11} color="#e8607a" />
                                  )}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="flex flex-col gap-3">
                        <ScoreBar score={ext.liveness_score} label="Liveness score" />
                        <ScoreBar score={ext.face_match_score} label="Face match score" />
                      </div>

                      {/* Extra chips */}
                      <div className="flex flex-wrap gap-2">
                        {ext.document_type && (
                          <span className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">
                            {ext.document_type}
                          </span>
                        )}
                        {ext.document_number && (
                          <span className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03] font-mono">
                            {maskDocNumber(ext.document_number)}
                          </span>
                        )}
                        {ext.issuing_state && (
                          <span className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">
                            {ext.issuing_state}
                          </span>
                        )}
                      </div>

                      {/* Force verify */}
                      {!verificationData.is_verified && (
                        <button
                          onClick={() => setModal('force_verify')}
                          className="text-[12px] self-start px-4 py-[8px] rounded-[10px] cursor-pointer transition-all"
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(232,96,122,0.35)',
                            color: '#e8607a',
                          }}
                          onMouseEnter={(e) => {
                            ;(e.currentTarget as HTMLElement).style.background =
                              'rgba(232,96,122,0.08)'
                          }}
                          onMouseLeave={(e) => {
                            ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                          }}
                        >
                          Force Verify
                        </button>
                      )}
                    </div>
                  )
                })()
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
                      "{profile.tagline}"
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
                    ].map(([label, val]) => (
                      <div key={label} className="flex items-start justify-between gap-3">
                        <dt className="text-[12px] text-[#6b7280] flex-shrink-0">{label}</dt>
                        <dd className="text-[13px] text-[#eeeef0] text-right">{val}</dd>
                      </div>
                    ))}
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
                  {/* placeholder — real photos in phase 2 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon size={24} color="#1c2333" />
                  </div>
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
                  className="bg-[#161d2a] border border-[#1c2333] rounded-[10px] px-4 py-3 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-[13px] text-[#eeeef0]">Video</div>
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
                      onClick={() => videoMutation.mutate({ video_id: video.id, action: 'reject' })}
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
          {companion.full_name ?? companion.alias ?? companion.email}
          {isLive && <span className="ml-2 text-[#e8607a]">● Live</span>}
          {isPending && <span className="ml-2 text-[#eeeef0]">— Awaiting review</span>}
        </div>
        <div className="flex gap-3 ml-auto">
          <button
            onClick={() => setModal('reject')}
            className="text-[13px] px-5 py-[10px] rounded-[10px] cursor-pointer transition-all"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444',
            }}
          >
            Reject
          </button>
          {!isLive && (
            <button
              onClick={() => setModal('approve')}
              className="bg-[#e8607a] hover:bg-[#c4485e] text-white border-none px-5 py-[10px] rounded-[10px] text-[13px] font-medium cursor-pointer transition-all hover:-translate-y-px"
            >
              Approve & Go Live
            </button>
          )}
          {isLive && (
            <button
              onClick={
                () => photoMutation.mutate({ photo_id: '', action: '' }) /* no-op placeholder */
              }
              className="bg-[#e8607a] hover:bg-[#c4485e] text-white border-none px-5 py-[10px] rounded-[10px] text-[13px] font-medium cursor-pointer transition-all opacity-50 cursor-not-allowed"
              disabled
            >
              Already Live
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal === 'approve' && (
          <ConfirmModal
            key="approve"
            title="Approve companion"
            body="This will set the companion as live and verified. They will appear in the discovery feed immediately."
            confirmLabel="Approve & Go Live"
            confirmColor="#e8607a"
            onConfirm={() => approveMutation.mutate()}
            onCancel={() => setModal(null)}
          />
        )}
        {modal === 'reject' && (
          <ConfirmModal
            key="reject"
            title="Reject application"
            body="The companion will be marked as rejected. You can provide an optional reason."
            confirmLabel="Reject"
            confirmColor="#ef4444"
            showReason
            onConfirm={(reason) => rejectMutation.mutate(reason)}
            onCancel={() => setModal(null)}
          />
        )}
        {modal === 'force_verify' && (
          <ConfirmModal
            key="force_verify"
            title="Force verify companion"
            body="This will manually mark the companion as verified regardless of Didit status. Only do this if you have independently confirmed their identity."
            confirmLabel="Force Verify"
            confirmColor="#e8607a"
            onConfirm={() => forceVerifyMutation.mutate()}
            onCancel={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
