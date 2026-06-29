'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, X, Check, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface AudioItem {
  id: string
  title: string | null
  description: string | null
  author_type: string
  is_original_voice: boolean
  is_anonymous: boolean
  moderation_status: string
  url: string
  duration_seconds: number | null
  listen_count: number
  like_count: number
  save_count: number
  created_at: string
  user_alias: string | null
  companion_alias: string | null
  companion_name: string | null
}

interface Meta {
  total: number
  pending_count: number
  page: number
  limit: number
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

function formatDur(secs: number | null) {
  if (!secs) return '0:00'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Inline audio player ────────────────────────────────────────────────────

function InlinePlayer({ url, duration }: { url: string; duration: number | null }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0) // 0-1
  const [current, setCurrent] = useState(0) // seconds
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const audio = new Audio(url)
    audioRef.current = audio
    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration)
        setCurrent(Math.floor(audio.currentTime))
      }
    })
    audio.addEventListener('ended', () => {
      setPlaying(false)
      setProgress(0)
      setCurrent(0)
    })
    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [url])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().catch(() => {})
      setPlaying(true)
    }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !barRef.current) return
    const rect = barRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audio.currentTime = pct * (audio.duration || 0)
    setProgress(pct)
  }

  const totalSecs = duration ?? 0

  return (
    <div className="bg-[#0d1117] border border-[#1c2333] rounded-[12px] px-4 py-3 flex items-center gap-3 my-3">
      <button
        onClick={toggle}
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-105"
        style={{ background: playing ? '#e8607a' : '#161d2a', border: '1px solid #1c2333' }}
      >
        {playing ? (
          <Pause size={14} color="white" fill="white" />
        ) : (
          <Play size={14} color={playing ? 'white' : '#e8607a'} fill="#e8607a" />
        )}
      </button>

      <div
        ref={barRef}
        onClick={seek}
        className="flex-1 h-[3px] rounded-full cursor-pointer relative"
        style={{ background: '#1c2333' }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[#e8607a]"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <span className="text-[11px] text-[#6b7280] flex-shrink-0 tabular-nums">
        {formatDur(current)} / {formatDur(totalSecs)}
      </span>
    </div>
  )
}

// ── Audio card ─────────────────────────────────────────────────────────────

const cardItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
}

function AudioCard({
  item,
  onAction,
}: {
  item: AudioItem
  onAction: (id: string, action: string) => void
}) {
  const isPending = item.moderation_status === 'pending'
  const isApproved = item.moderation_status === 'approved'

  const authorLabel = item.is_anonymous
    ? 'Anonymous'
    : item.author_type === 'companion'
      ? (item.companion_name ?? item.companion_alias ?? 'Companion')
      : (item.user_alias ?? 'User')

  const voiceLabel = item.is_original_voice ? 'Companion Voice' : 'User Upload'

  return (
    <motion.div
      variants={cardItem}
      className="bg-[#111620] border border-[#1c2333] rounded-[16px] p-5"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Moderation badge */}
          {isPending && (
            <span
              className="text-[11px] px-[10px] py-1 rounded-full text-[#c9a96e]"
              style={{
                background: 'rgba(201,169,110,0.10)',
                border: '1px solid rgba(201,169,110,0.30)',
              }}
            >
              Pending
            </span>
          )}
          {item.moderation_status === 'approved' && (
            <span
              className="text-[11px] px-[10px] py-1 rounded-full text-[#4ade80]"
              style={{
                background: 'rgba(74,222,128,0.08)',
                border: '1px solid rgba(74,222,128,0.30)',
              }}
            >
              Approved
            </span>
          )}
          {item.moderation_status === 'rejected' && (
            <span
              className="text-[11px] px-[10px] py-1 rounded-full text-[#ef4444]"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.30)',
              }}
            >
              Rejected
            </span>
          )}
          <span className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">
            {voiceLabel}
          </span>
          {item.duration_seconds != null && (
            <span className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">
              {formatDur(item.duration_seconds)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isPending && (
            <button
              onClick={() => onAction(item.id, 'approve')}
              className="inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full cursor-pointer transition-all hover:opacity-80"
              style={{
                color: '#4ade80',
                background: 'rgba(74,222,128,0.08)',
                border: '1px solid rgba(74,222,128,0.30)',
              }}
            >
              <Check size={10} /> Approve
            </button>
          )}
          {(isPending || isApproved) && (
            <button
              onClick={() => onAction(item.id, 'reject')}
              className="inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full cursor-pointer transition-all hover:opacity-80"
              style={{
                color: '#ef4444',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.30)',
              }}
            >
              <X size={10} /> Reject
            </button>
          )}
          <button
            onClick={() => onAction(item.id, 'delete')}
            className="inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full cursor-pointer transition-all hover:opacity-80"
            style={{
              color: '#ef4444',
              background: 'rgba(239,68,68,0.04)',
              border: '1px solid rgba(239,68,68,0.20)',
            }}
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>

      {/* Title */}
      <div
        style={{ fontFamily: "'Playfair Display', serif" }}
        className="text-[15px] text-[#eeeef0] mt-3 leading-[1.3]"
      >
        {item.title ?? 'Untitled recording'}
      </div>

      {/* Description */}
      {item.description && (
        <div
          className="text-[13px] text-[#6b7280] leading-[1.6] mt-1 overflow-hidden"
          style={{ maxHeight: '2.8em' }}
        >
          {item.description}
        </div>
      )}

      {/* Audio player */}
      <InlinePlayer url={item.url} duration={item.duration_seconds} />

      {/* Meta row */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-[12px] text-[#6b7280]">{authorLabel}</span>
        <span className="text-[12px] text-[#6b7280]">👂 {item.listen_count}</span>
        <span className="text-[12px] text-[#6b7280]">{relativeTime(item.created_at)}</span>
      </div>

      {/* Pending notice */}
      {isPending && (
        <div
          className="mt-3 px-4 py-2 rounded-[8px] text-[11.5px] text-[#c9a96e] leading-[1.5]"
          style={{
            background: 'rgba(201,169,110,0.06)',
            border: '1px solid rgba(201,169,110,0.20)',
          }}
        >
          Listen before approving. Content must be sensual but not explicitly sexual.
        </div>
      )}
    </motion.div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

export default function AdminAudioPage() {
  const [tab, setTab] = useState('all')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const queryKey = ['admin', 'audio', tab, page]

  const { data, isLoading } = useQuery<{ data: AudioItem[]; meta: Meta }>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ filter: tab, page: String(page) })
      const res = await fetch(`/api/admin/audio?${params}`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    staleTime: 30_000,
  })

  const actionMutation = useMutation<
    void,
    Error,
    { id: string; action: string },
    { prev: unknown }
  >({
    mutationFn: async ({ id, action }) => {
      const res = await fetch(`/api/admin/audio/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error('Failed')
    },
    onMutate: async ({ id, action }) => {
      await queryClient.cancelQueries({ queryKey })
      const prev = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old
        return {
          ...old,
          data: old.data
            .map((a: AudioItem) => {
              if (a.id !== id) return a
              if (action === 'approve') return { ...a, moderation_status: 'approved' }
              if (action === 'reject') return { ...a, moderation_status: 'rejected' }
              if (action === 'delete') return null
              return a
            })
            .filter(Boolean),
        }
      })
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  const rows = data?.data ?? []
  const meta = data?.meta
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1
  const pendingCount = meta?.pending_count ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="p-6 md:p-10 min-h-screen"
      style={{ background: '#07090f' }}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#eeeef0' }}>
            Audio Recordings
          </h1>
          {pendingCount > 0 && (
            <span
              className="text-[11px] px-[10px] py-1 rounded-full text-[#c9a96e] font-medium"
              style={{
                background: 'rgba(201,169,110,0.12)',
                border: '1px solid rgba(201,169,110,0.35)',
              }}
            >
              {pendingCount} pending
            </span>
          )}
        </div>
        <p className="text-[12px] text-[#6b7280]">{meta ? `${meta.total} total` : 'Loading…'}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key)
              setPage(1)
            }}
            className="text-[12px] px-[14px] py-[6px] rounded-full border cursor-pointer transition-all duration-150"
            style={{
              borderColor: tab === t.key ? '#e8607a' : '#1c2333',
              color: tab === t.key ? '#e8607a' : '#6b7280',
              background: tab === t.key ? 'rgba(232,96,122,0.08)' : 'transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div key="loading" className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#111620] border border-[#1c2333] rounded-[16px] p-5 animate-pulse h-[180px]"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-[#6b7280] text-[13px] py-20"
          >
            Nothing here yet.
          </motion.div>
        ) : (
          <motion.div
            key={`${tab}-${page}`}
            variants={listContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-4"
          >
            {rows.map((item) => (
              <AudioCard
                key={item.id}
                item={item}
                onAction={(id, action) => actionMutation.mutate({ id, action })}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-[#1c2333] text-[#6b7280] disabled:opacity-30 hover:border-[rgba(232,96,122,0.5)] hover:text-[#e8607a] transition-all"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[12px] text-[#6b7280]">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-[#1c2333] text-[#6b7280] disabled:opacity-30 hover:border-[rgba(232,96,122,0.5)] hover:text-[#e8607a] transition-all"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </motion.div>
  )
}
