'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface Booking {
  id: string
  status: string
  requested_date: string | null
  requested_time: string | null
  requested_duration_minutes: number | null
  message: string | null
  companion_notes: string | null
  price_quoted: string | null
  currency: string | null
  created_at: string
  updated_at: string
  user_alias: string | null
  companion_name: string | null
  companion_alias: string | null
  city: string | null
  session_title: string | null
  session_type: string | null
}

interface Meta {
  total: number
  page: number
  limit: number
  pending: number
  accepted: number
  completed: number
  declined: number
  cancelled: number
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'completed', label: 'Completed' },
  { key: 'declined', label: 'Declined' },
]

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  pending: { color: '#c9a96e', bg: 'rgba(201,169,110,0.10)', border: 'rgba(201,169,110,0.30)' },
  accepted: { color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.30)' },
  completed: { color: '#e8607a', bg: 'rgba(232,96,122,0.08)', border: 'rgba(232,96,122,0.30)' },
  declined: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.30)' },
  cancelled: { color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.30)' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.cancelled
  return (
    <span
      className="text-[11px] px-[10px] py-1 rounded-full capitalize"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      {status}
    </span>
  )
}

function formatDate(d: string | null, t: string | null) {
  if (!d) return '—'
  const date = new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  return t ? `${date} at ${t.slice(0, 5)}` : date
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Booking card ───────────────────────────────────────────────────────────

const cardItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
}

function BookingCard({
  booking,
  onAction,
}: {
  booking: Booking
  onAction: (id: string, status: string, note?: string) => void
}) {
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState(booking.companion_notes ?? '')
  const [msgExpanded, setMsgExpanded] = useState(false)
  const isPending = booking.status === 'pending'
  const isAccepted = booking.status === 'accepted'
  const isTerminal = ['completed', 'declined', 'cancelled'].includes(booking.status)

  return (
    <motion.div
      variants={cardItem}
      className="bg-[#111620] border border-[#1c2333] rounded-[16px] p-5"
    >
      {/* Two-column desktop layout */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left */}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <StatusBadge status={booking.status} />
            {booking.session_type && (
              <span className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">
                {booking.session_type}
              </span>
            )}
            {booking.price_quoted && (
              <span
                className="text-[11px] px-[10px] py-1 rounded-full text-[#c9a96e]"
                style={{
                  background: 'rgba(201,169,110,0.08)',
                  border: '1px solid rgba(201,169,110,0.25)',
                }}
              >
                {booking.currency} {booking.price_quoted}
              </span>
            )}
          </div>

          <div
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-[14px] text-[#eeeef0] mb-[2px]"
          >
            For {booking.companion_name ?? booking.companion_alias ?? '—'}
            {booking.companion_alias && (
              <span className="text-[12px] text-[#6b7280] font-normal">
                {' '}
                ({booking.companion_alias})
              </span>
            )}
          </div>

          <div className="text-[12px] text-[#6b7280] mb-1">From @{booking.user_alias ?? '—'}</div>

          {booking.session_title && (
            <div className="text-[12px] text-[#6b7280] mb-1">
              {booking.session_title}
              {booking.requested_duration_minutes
                ? ` · ${booking.requested_duration_minutes} mins`
                : ''}
            </div>
          )}

          <div className="text-[12px] text-[#6b7280]">
            Requested: {formatDate(booking.requested_date, booking.requested_time)}
          </div>

          {/* Message — mobile: shows here */}
          {booking.message && (
            <div className="md:hidden mt-3">
              <div
                className="text-[13px] text-[#6b7280] italic leading-[1.6] overflow-hidden"
                style={{
                  maxHeight: msgExpanded ? '2000px' : '3em',
                  transition: 'max-height 0.3s ease',
                }}
              >
                "{booking.message}"
              </div>
              {booking.message.length > 100 && (
                <button
                  onClick={() => setMsgExpanded((e) => !e)}
                  className="text-[12px] text-[#e8607a] mt-1 hover:opacity-80 transition-opacity"
                >
                  {msgExpanded ? 'Less' : 'More'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right — desktop message + note */}
        <div className="hidden md:flex flex-col gap-2 w-[280px] flex-shrink-0">
          {booking.message && (
            <div>
              <div
                className="text-[13px] text-[#6b7280] italic leading-[1.6] overflow-hidden"
                style={{
                  maxHeight: msgExpanded ? '2000px' : '4.5em',
                  transition: 'max-height 0.3s ease',
                }}
              >
                "{booking.message}"
              </div>
              {booking.message.length > 150 && (
                <button
                  onClick={() => setMsgExpanded((e) => !e)}
                  className="text-[12px] text-[#e8607a] mt-1 hover:opacity-80 transition-opacity"
                >
                  {msgExpanded ? 'Less' : 'More'}
                </button>
              )}
            </div>
          )}
          {booking.companion_notes && (
            <div
              className="px-3 py-2 rounded-[8px] text-[12px] text-[#c9a96e] leading-[1.5]"
              style={{
                background: 'rgba(201,169,110,0.06)',
                border: '1px solid rgba(201,169,110,0.20)',
              }}
            >
              Note: {booking.companion_notes}
            </div>
          )}
          <div className="text-[11px] text-[#6b7280] mt-auto">
            {relativeTime(booking.created_at)}
          </div>
        </div>
      </div>

      {/* Inline note textarea */}
      <AnimatePresence>
        {noteOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 overflow-hidden"
          >
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add an admin note (visible to companion)…"
              rows={2}
              className="w-full bg-[#0d1117] border border-[#1c2333] rounded-[10px] px-3 py-2 text-[13px] text-[#eeeef0] placeholder-[#6b7280] outline-none resize-none focus:border-[rgba(232,96,122,0.5)] transition-colors"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  onAction(booking.id, booking.status, noteText)
                  setNoteOpen(false)
                }}
                className="text-[12px] px-4 py-[6px] rounded-full text-white cursor-pointer transition-all hover:opacity-80"
                style={{ background: '#e8607a' }}
              >
                Save note
              </button>
              <button
                onClick={() => setNoteOpen(false)}
                className="text-[12px] px-4 py-[6px] rounded-full text-[#6b7280] border border-[#1c2333] cursor-pointer transition-all hover:text-[#eeeef0]"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action bar */}
      {!isTerminal && (
        <div className="border-t border-[#1c2333] pt-3 mt-3 flex items-center gap-2 flex-wrap">
          {isPending && (
            <>
              <button
                onClick={() => onAction(booking.id, 'accepted')}
                className="text-[12px] px-4 py-[6px] rounded-full cursor-pointer transition-all hover:opacity-80"
                style={{
                  color: '#4ade80',
                  background: 'rgba(74,222,128,0.06)',
                  border: '1px solid rgba(74,222,128,0.30)',
                }}
              >
                Accept
              </button>
              <button
                onClick={() => onAction(booking.id, 'declined')}
                className="text-[12px] px-4 py-[6px] rounded-full cursor-pointer transition-all hover:opacity-80"
                style={{
                  color: '#ef4444',
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.30)',
                }}
              >
                Decline
              </button>
            </>
          )}
          {isAccepted && (
            <>
              <button
                onClick={() => onAction(booking.id, 'completed')}
                className="text-[12px] px-4 py-[6px] rounded-full cursor-pointer transition-all hover:opacity-80"
                style={{
                  color: '#4ade80',
                  background: 'rgba(74,222,128,0.06)',
                  border: '1px solid rgba(74,222,128,0.30)',
                }}
              >
                Mark completed
              </button>
              <button
                onClick={() => onAction(booking.id, 'cancelled')}
                className="text-[12px] px-4 py-[6px] rounded-full text-[#6b7280] border border-[#1c2333] cursor-pointer transition-all hover:text-[#eeeef0]"
              >
                Cancel
              </button>
            </>
          )}
          <button
            onClick={() => setNoteOpen((o) => !o)}
            className="inline-flex items-center gap-1 text-[12px] px-4 py-[6px] rounded-full text-[#6b7280] border border-[#1c2333] cursor-pointer transition-all hover:text-[#eeeef0] ml-auto"
          >
            <MessageSquare size={11} /> Add note
          </button>
        </div>
      )}

      {isTerminal && (
        <div className="border-t border-[#1c2333] pt-3 mt-3">
          <StatusBadge status={booking.status} />
          {booking.companion_notes && (
            <p className="text-[12px] text-[#6b7280] mt-2">Note: {booking.companion_notes}</p>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ── Stat tile ──────────────────────────────────────────────────────────────

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-[#111620] border border-[#1c2333] rounded-[14px] h-[70px] flex flex-col items-center justify-center gap-1">
      <div className="text-[20px] font-semibold" style={{ color }}>
        {value}
      </div>
      <div className="text-[11px] text-[#6b7280]">{label}</div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

export default function AdminBookingsPage() {
  const [tab, setTab] = useState('all')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const queryKey = ['admin', 'bookings', tab, page]

  const { data, isLoading } = useQuery<{ data: Booking[]; meta: Meta }>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ filter: tab, page: String(page) })
      const res = await fetch(`/api/admin/bookings?${params}`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    staleTime: 30_000,
  })

  const actionMutation = useMutation<
    void,
    Error,
    { id: string; status: string; note?: string },
    { prev: unknown }
  >({
    mutationFn: async ({ id, status, note }) => {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_note: note }),
      })
      if (!res.ok) throw new Error('Failed')
    },
    onMutate: async ({ id, status, note }) => {
      await queryClient.cancelQueries({ queryKey })
      const prev = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((b: Booking) =>
            b.id === id ? { ...b, status, companion_notes: note ?? b.companion_notes } : b
          ),
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
  const openCount = (meta?.pending ?? 0) + (meta?.accepted ?? 0)

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
            Booking Requests
          </h1>
          {openCount > 0 && (
            <span
              className="text-[11px] px-[10px] py-1 rounded-full text-[#e8607a] font-medium"
              style={{
                background: 'rgba(232,96,122,0.10)',
                border: '1px solid rgba(232,96,122,0.30)',
              }}
            >
              {openCount} open
            </span>
          )}
        </div>
        <p className="text-[12px] text-[#6b7280]">{meta ? `${meta.total} total` : 'Loading…'}</p>
      </div>

      {/* Stats row */}
      {meta && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatTile label="Pending" value={meta.pending} color="#c9a96e" />
          <StatTile label="Accepted" value={meta.accepted} color="#4ade80" />
          <StatTile label="Completed" value={meta.completed} color="#e8607a" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
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
                className="bg-[#111620] border border-[#1c2333] rounded-[16px] p-5 animate-pulse h-[160px]"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p
              style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-[#6b7280] text-[16px] italic"
            >
              No booking requests match this filter.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={`${tab}-${page}`}
            variants={listContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-3"
          >
            {rows.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onAction={(id, status, note) => actionMutation.mutate({ id, status, note })}
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
