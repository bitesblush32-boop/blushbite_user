'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { User, Star, CheckCircle, FileText, CheckCircle2, Calendar } from 'lucide-react'

interface ActivityEvent {
  type: string
  timestamp: string
  id?: string
  alias?: string
  email?: string
  companion_id?: string
  companion_stage?: number
  title?: string
  author_type?: string
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatRelativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days !== 1 ? 's' : ''} ago`
}

function eventLabel(e: ActivityEvent): string {
  switch (e.type) {
    case 'new_dreamer':
      return e.alias ? `${e.alias} joined` : 'New dreamer joined'
    case 'new_companion':
      return `New companion applied`
    case 'companion_approved':
      return 'Companion went live'
    case 'story_submitted':
      return e.title ? `"${e.title}" submitted` : 'Story submitted'
    case 'story_approved':
      return e.title ? `"${e.title}" approved` : 'Story approved'
    case 'booking_request':
      return 'New booking request'
    case 'booking_completed':
      return 'Booking completed'
    default:
      return 'Platform event'
  }
}

const EVENT_META: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  new_dreamer: { icon: User, bg: 'rgba(232,96,122,0.10)', color: '#e8607a' },
  new_companion: { icon: Star, bg: 'rgba(201,169,110,0.10)', color: '#c9a96e' },
  companion_approved: { icon: CheckCircle, bg: 'rgba(74,222,128,0.10)', color: '#4ade80' },
  story_submitted: { icon: FileText, bg: 'rgba(232,96,122,0.10)', color: '#e8607a' },
  story_approved: { icon: CheckCircle2, bg: 'rgba(74,222,128,0.10)', color: '#4ade80' },
  booking_request: { icon: Calendar, bg: 'rgba(201,169,110,0.10)', color: '#c9a96e' },
  booking_completed: { icon: CheckCircle, bg: 'rgba(74,222,128,0.10)', color: '#4ade80' },
}

const FILTER_TYPES: Record<string, string[]> = {
  Companions: ['new_companion', 'companion_approved'],
  Content: ['story_submitted', 'story_approved'],
  Bookings: ['booking_request', 'booking_completed'],
  Dreamers: ['new_dreamer'],
}

const FILTERS = ['All', 'Companions', 'Content', 'Bookings', 'Dreamers']

const container = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } }
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as any } },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminActivityPage() {
  const [filter, setFilter] = useState('All')

  const { data, isLoading, refetch } = useQuery<{ data: ActivityEvent[] }>({
    queryKey: ['admin', 'activity'],
    queryFn: () => fetch('/api/admin/activity').then((r) => r.json()),
    refetchInterval: 20_000,
  })

  const events = data?.data ?? []
  const filtered =
    filter === 'All' ? events : events.filter((e) => FILTER_TYPES[filter]?.includes(e.type))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="p-6 md:p-8 min-h-screen"
      style={{ background: '#07090f' }}
    >
      {/* Noise */}
      <div
        className="fixed inset-0 pointer-events-none z-[1000] opacity-60"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Page header */}
      <div className="flex items-center gap-3 mb-2">
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#eeeef0' }}>
          Activity Feed
        </h1>
        <div
          className="w-[8px] h-[8px] rounded-full flex-shrink-0"
          style={{
            background: '#4ade80',
            boxShadow: '0 0 6px rgba(74,222,128,0.6)',
            animation: 'live-pulse 2s ease-in-out infinite',
          }}
        />
      </div>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Live platform events</p>

      {/* Filter pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map((f) => {
          const isActive = filter === f
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex-shrink-0 text-[12px] px-[14px] py-[6px] rounded-full border cursor-pointer transition-all duration-150"
              style={{
                borderColor: isActive ? '#e8607a' : '#1c2333',
                color: isActive ? '#e8607a' : '#6b7280',
                background: isActive ? 'rgba(232,96,122,0.08)' : 'transparent',
              }}
            >
              {f}
            </button>
          )
        })}
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-[#111620] border border-[#1c2333] rounded-[14px] h-[64px] animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 18,
            color: '#6b7280',
            fontStyle: 'italic',
            textAlign: 'center',
            padding: '60px 0',
          }}
        >
          No events yet.
        </p>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-3"
          >
            {filtered.map((event, i) => {
              const meta = EVENT_META[event.type] ?? EVENT_META['new_dreamer']
              const Icon = meta.icon

              let actionLink: string | null = null
              let actionLabel = ''
              if (event.type === 'story_submitted' && event.id) {
                actionLink = `/admin/content?highlight=${event.id}`
                actionLabel = 'Review →'
              } else if (event.type === 'new_companion' && event.companion_id) {
                actionLink = `/admin/companions/${event.companion_id}`
                actionLabel = event.companion_stage === 3 ? 'Approve →' : 'View →'
              } else if (event.type === 'companion_approved' && event.companion_id) {
                actionLink = `/admin/companions/${event.companion_id}`
                actionLabel = 'View →'
              }

              return (
                <motion.div
                  key={`${event.type}-${event.id ?? ''}-${i}`}
                  variants={item}
                  className="bg-[#111620] border border-[#1c2333] rounded-[14px] px-4 py-3 flex items-center gap-4 transition-colors hover:border-[rgba(232,96,122,0.2)]"
                >
                  {/* Icon */}
                  <div
                    className="w-[36px] h-[36px] rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: meta.bg }}
                  >
                    <Icon size={15} color={meta.color} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 13, color: '#eeeef0', lineHeight: 1.4 }}>
                      {eventLabel(event)}
                    </p>
                    <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                      {formatRelativeTime(event.timestamp)}
                    </p>
                  </div>

                  {/* Action */}
                  {actionLink && (
                    <Link
                      href={actionLink}
                      className="flex-shrink-0 transition-opacity hover:opacity-100 opacity-70"
                      style={{ fontSize: 12, color: '#e8607a' }}
                    >
                      {actionLabel}
                    </Link>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Load more */}
      {!isLoading && events.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => refetch()}
            className="bg-transparent border border-[#1c2333] px-[20px] py-[10px] rounded-[10px] text-[13px] transition-all duration-200 hover:border-white/20 hover:text-[#eeeef0]"
            style={{ color: '#6b7280', cursor: 'pointer' }}
          >
            Load earlier events
          </button>
        </div>
      )}

      <style jsx global>{`
        @keyframes live-pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(0.85);
          }
        }
        @keyframes ring-pulse {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.85;
          }
        }
      `}</style>
    </motion.div>
  )
}
