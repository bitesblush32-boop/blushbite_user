'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, ChevronDown, ChevronUp, Check, X } from 'lucide-react'

type BookingStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled'

interface Booking {
  id: string
  user_alias: string
  session_title: string | null
  session_type: string | null
  status: BookingStatus
  requested_date: string
  requested_time: string | null
  requested_duration_minutes: number | null
  message: string | null
  price_quoted: string | null
  currency: string
  created_at: string
}

const TABS: { label: string; value: string }[] = [
  { label: 'All',       value: 'all' },
  { label: 'Pending',   value: 'pending' },
  { label: 'Accepted',  value: 'accepted' },
  { label: 'Completed', value: 'completed' },
]

const STATUS_COLORS: Record<BookingStatus, { bg: string; text: string; border: string }> = {
  pending:   { bg: 'rgba(201,169,110,0.1)',  text: '#c9a96e', border: 'rgba(201,169,110,0.35)' },
  accepted:  { bg: 'rgba(34,197,94,0.1)',    text: '#4ade80', border: 'rgba(34,197,94,0.3)'    },
  declined:  { bg: 'rgba(232,96,122,0.1)',   text: '#e8607a', border: 'rgba(232,96,122,0.3)'   },
  completed: { bg: 'rgba(99,102,241,0.1)',   text: '#a5b4fc', border: 'rgba(99,102,241,0.3)'   },
  cancelled: { bg: 'rgba(107,114,128,0.1)',  text: '#6b7280', border: 'rgba(107,114,128,0.3)'  },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(timeStr: string | null) {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'pm' : 'am'
  return `${hour % 12 || 12}:${m}${ampm}`
}

function BookingCard({
  booking,
  onStatusChange,
}: {
  booking: Booking
  onStatusChange: (id: string, status: BookingStatus) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const sc = STATUS_COLORS[booking.status]

  async function handleAction(newStatus: BookingStatus) {
    setLoading(newStatus)
    try {
      const res = await fetch(`/api/companions/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        onStatusChange(booking.id, booking.status)
      }
    } catch {
      onStatusChange(booking.id, booking.status)
    } finally {
      setLoading(null)
    }
  }

  function accept() {
    onStatusChange(booking.id, 'accepted')
    handleAction('accepted')
  }

  function decline() {
    onStatusChange(booking.id, 'declined')
    handleAction('declined')
  }

  function complete() {
    onStatusChange(booking.id, 'completed')
    handleAction('completed')
  }

  const hasLongMessage = (booking.message?.length ?? 0) > 120

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#111620] border border-[#1c2333] rounded-[14px] p-5 transition-colors hover:border-[rgba(232,96,122,0.25)]"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[12px] text-[#eeeef0] font-medium px-[10px] py-[3px] rounded-full"
              style={{ background: 'rgba(232,96,122,0.12)', border: '1px solid rgba(232,96,122,0.25)' }}
            >
              {booking.user_alias}
            </span>
            {booking.session_title && (
              <span className="text-[11px] text-[#6b7280]">· {booking.session_title}</span>
            )}
          </div>
        </div>
        <span
          className="text-[11px] px-[10px] py-[3px] rounded-full flex-shrink-0 font-medium"
          style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
        >
          {booking.status}
        </span>
      </div>

      {/* Date/time row */}
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        <span className="flex items-center gap-[6px] text-[12px] text-[#6b7280]">
          <Calendar size={13} className="text-[#e8607a]" />
          {formatDate(booking.requested_date)}
        </span>
        {booking.requested_time && (
          <span className="flex items-center gap-[6px] text-[12px] text-[#6b7280]">
            <Clock size={13} className="text-[#e8607a]" />
            {formatTime(booking.requested_time)}
            {booking.requested_duration_minutes && (
              <span className="text-[#6b7280]">· {booking.requested_duration_minutes} min</span>
            )}
          </span>
        )}
        {booking.price_quoted && (
          <span className="text-[13px] text-[#e8607a] font-medium ml-auto">
            {booking.currency}{booking.price_quoted}
          </span>
        )}
      </div>

      {/* Message */}
      {booking.message && (
        <div className="mb-3">
          <p className="text-[12.5px] text-[#6b7280] leading-[1.6]">
            {expanded || !hasLongMessage
              ? booking.message
              : `${booking.message.slice(0, 120)}…`}
          </p>
          {hasLongMessage && (
            <button
              onClick={() => setExpanded(p => !p)}
              className="flex items-center gap-1 text-[11px] text-[#e8607a] mt-1 opacity-80 hover:opacity-100 transition-opacity"
            >
              {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read more</>}
            </button>
          )}
        </div>
      )}

      {/* Action buttons */}
      {booking.status === 'pending' && (
        <div className="flex gap-2 mt-1">
          <button
            onClick={accept}
            disabled={loading !== null}
            className="flex items-center gap-[6px] text-[12px] px-[14px] py-[7px] rounded-[8px] border-none cursor-pointer transition-all duration-200 disabled:opacity-50"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            {loading === 'accepted' ? (
              <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check size={12} />
            )}
            Accept
          </button>
          <button
            onClick={decline}
            disabled={loading !== null}
            className="flex items-center gap-[6px] text-[12px] px-[14px] py-[7px] rounded-[8px] border-none cursor-pointer transition-all duration-200 disabled:opacity-50"
            style={{ background: 'rgba(232,96,122,0.08)', color: '#e8607a', border: '1px solid rgba(232,96,122,0.25)' }}
          >
            {loading === 'declined' ? (
              <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <X size={12} />
            )}
            Decline
          </button>
        </div>
      )}

      {booking.status === 'accepted' && (
        <div className="mt-1">
          <button
            onClick={complete}
            disabled={loading !== null}
            className="flex items-center gap-[6px] text-[12px] px-[14px] py-[7px] rounded-[8px] cursor-pointer transition-all duration-200 disabled:opacity-50"
            style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}
          >
            {loading === 'completed' ? (
              <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check size={12} />
            )}
            Mark as completed
          </button>
        </div>
      )}
    </motion.div>
  )
}

function BookingsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get('tab') ?? 'all'

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/companions/bookings')
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  function handleStatusChange(id: string, newStatus: BookingStatus) {
    setBookings(prev =>
      prev.map(b => b.id === id ? { ...b, status: newStatus } : b)
    )
  }

  function setTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'all') params.delete('tab')
    else params.set('tab', tab)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const filtered = activeTab === 'all'
    ? bookings
    : bookings.filter(b => b.status === activeTab)

  const counts = {
    all:       bookings.length,
    pending:   bookings.filter(b => b.status === 'pending').length,
    accepted:  bookings.filter(b => b.status === 'accepted').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  }

  return (
    <div className="max-w-[860px] mx-auto px-5 md:px-10 py-8">
      {/* Noise + glow */}
      <div
        className="fixed inset-0 pointer-events-none z-[1000] opacity-60"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(232,96,122,0.06) 0%, transparent 70%)' }}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <h1
          className="text-[28px] text-[#eeeef0] mb-1"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Your booking requests
        </h1>
        <p className="text-[12px] text-[#6b7280]">
          Every request, at a glance. Accept what feels right.
        </p>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(tab => {
          const count = counts[tab.value as keyof typeof counts] ?? 0
          const isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => setTab(tab.value)}
              className="flex items-center gap-[6px] text-[12px] px-[14px] py-[6px] rounded-full border cursor-pointer transition-all duration-150"
              style={{
                borderColor: isActive ? '#e8607a' : '#1c2333',
                color:       isActive ? '#e8607a' : '#6b7280',
                background:  isActive ? 'rgba(232,96,122,0.08)' : 'transparent',
              }}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className="text-[10px] px-[6px] py-px rounded-full"
                  style={{
                    background: isActive ? 'rgba(232,96,122,0.2)' : 'rgba(255,255,255,0.06)',
                    color:      isActive ? '#e8607a' : '#6b7280',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-[#111620] border border-[#1c2333] rounded-[14px] h-[120px] animate-pulse" />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-3"
          >
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p
                  className="text-[20px] text-[#6b7280] italic"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {activeTab === 'pending'
                    ? 'No one waiting on your answer yet.'
                    : activeTab === 'accepted'
                    ? 'No accepted bookings right now.'
                    : activeTab === 'completed'
                    ? 'Your completed sessions will appear here.'
                    : 'No bookings yet. They will come.'}
                </p>
              </div>
            ) : (
              filtered.map((booking, i) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                >
                  <BookingCard booking={booking} onStatusChange={handleStatusChange} />
                </motion.div>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

export default function BookingsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[860px] mx-auto px-5 md:px-10 py-8">
        <div className="bg-[#111620] border border-[#1c2333] rounded-[14px] h-[400px] animate-pulse" />
      </div>
    }>
      <BookingsContent />
    </Suspense>
  )
}
