'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Users2,
  Star,
  Clock,
  CalendarDays,
  FileText,
  AlertCircle,
  Heart,
  Bookmark,
  AlertTriangle,
  PenLine,
  UserCheck,
  Upload,
  Tags,
} from 'lucide-react'

interface AnalyticsData {
  content_by_author: { admin: number; companion: number; user: number }
  booking_funnel: {
    pending: number
    accepted: number
    completed: number
    declined: number
    cancelled: number
    total: number
  }
  top_fantasy_tags: {
    id: number
    name: string
    category_name: string | null
    usage_count: number
  }[]
}

interface OverviewData {
  total_dreamers: number
  total_companions_live: number
  total_companions_pending: number
  total_companions_all: number
  stories_pending: number
  stories_approved: number
  stories_total: number
  audio_pending: number
  bookings_open: number
  bookings_total: number
  bookings_completed: number
  new_dreamers_today: number
  new_companions_today: number
  new_stories_today: number
  total_likes: number
  total_saves: number
  total_comments: number
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const tileVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const tileItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as any } },
}

function PulseBorder({ color }: { color: 'gold' | 'rose' }) {
  const c = color === 'gold' ? 'rgba(201,169,110,0.6)' : 'rgba(232,96,122,0.6)'
  return (
    <div
      className="absolute inset-0 rounded-[16px] pointer-events-none"
      style={{
        border: `2px solid ${c}`,
        animation: 'ring-pulse 2s ease-in-out infinite',
      }}
    />
  )
}

function StatTile({
  icon: Icon,
  iconColor,
  label,
  value,
  delta,
  deltaPositive,
  pulse,
  onClick,
}: {
  icon: React.ElementType
  iconColor: string
  label: string
  value: number
  delta?: string
  deltaPositive?: boolean
  pulse?: 'gold' | 'rose'
  onClick?: () => void
}) {
  return (
    <motion.div
      variants={tileItem}
      onClick={onClick}
      className="relative bg-[#111620] border border-[#1c2333] rounded-[16px] p-5 overflow-hidden"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {pulse && value > 0 && <PulseBorder color={pulse} />}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center flex-shrink-0"
          style={{ background: `${iconColor}18` }}
        >
          <Icon size={16} color={iconColor} />
        </div>
        <span
          style={{
            fontSize: 11,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#6b7280',
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{ fontSize: 32, fontWeight: 600, color: '#eeeef0', lineHeight: 1, marginBottom: 8 }}
      >
        {value.toLocaleString()}
      </div>
      {delta && (
        <div style={{ fontSize: 12, color: deltaPositive && value > 0 ? '#4ade80' : '#6b7280' }}>
          {delta}
        </div>
      )}
    </motion.div>
  )
}

function EngagementBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? value / max : 0
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-[6px]">
        <span style={{ fontSize: 13, color: '#6b7280' }}>{label}</span>
        <span style={{ fontSize: 13, color: '#eeeef0', fontWeight: 500 }}>
          {value.toLocaleString()}
        </span>
      </div>
      <div className="h-[4px] rounded-full overflow-hidden" style={{ background: '#1c2333' }}>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: pct }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ transformOrigin: 'left', background: '#e8607a' }}
        />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const router = useRouter()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const { data: overviewRes, isLoading } = useQuery<{ data: OverviewData }>({
    queryKey: ['admin', 'overview'],
    queryFn: () => fetch('/api/admin/stats/overview').then((r) => r.json()),
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  })

  const { data: analyticsRes } = useQuery<{ data: AnalyticsData }>({
    queryKey: ['admin', 'analytics'],
    queryFn: () => fetch('/api/admin/stats/analytics').then((r) => r.json()),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })

  // Pre-fetch activity into cache
  useQuery({
    queryKey: ['admin', 'activity'],
    queryFn: () => fetch('/api/admin/activity').then((r) => r.json()),
    staleTime: 20_000,
    refetchOnWindowFocus: false,
  })

  const d = overviewRes?.data
  const an = analyticsRes?.data
  const pending_combined = (d?.stories_pending ?? 0) + (d?.audio_pending ?? 0)
  const showBanner =
    (d?.total_companions_pending ?? 0) > 0 || pending_combined > 0 || (d?.bookings_open ?? 0) > 0
  const engMax = Math.max(d?.total_likes ?? 0, d?.total_saves ?? 0, d?.total_comments ?? 0, 1)

  const dateStr = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

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
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 28,
              color: '#eeeef0',
              marginBottom: 4,
            }}
          >
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>BlushBite platform overview</p>
        </div>
        <div className="text-right">
          <p style={{ fontSize: 13, color: '#eeeef0' }}>{timeStr}</p>
          <p style={{ fontSize: 11, color: '#6b7280' }}>{dateStr}</p>
        </div>
      </div>

      {/* Urgent actions banner */}
      {!isLoading && showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-[16px] p-5 mb-6 flex flex-wrap items-center gap-4"
          style={{
            background: 'rgba(201,169,110,0.08)',
            border: '1px solid rgba(201,169,110,0.25)',
          }}
        >
          <div className="flex items-center gap-2 flex-shrink-0">
            <AlertTriangle size={16} color="#c9a96e" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#c9a96e' }}>Action required</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(d?.total_companions_pending ?? 0) > 0 && (
              <button
                onClick={() => router.push('/admin/companions?filter=pending')}
                className="transition-colors"
                style={{
                  background: 'rgba(201,169,110,0.1)',
                  border: '1px solid rgba(201,169,110,0.2)',
                  borderRadius: 99,
                  padding: '6px 16px',
                  fontSize: 12,
                  color: '#c9a96e',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.background = 'rgba(201,169,110,0.18)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.background = 'rgba(201,169,110,0.1)'
                }}
              >
                {d?.total_companions_pending} companion
                {d?.total_companions_pending !== 1 ? 's' : ''} taken down →
              </button>
            )}
            {pending_combined > 0 && (
              <button
                onClick={() => router.push('/admin/content?filter=pending')}
                className="transition-colors"
                style={{
                  background: 'rgba(201,169,110,0.1)',
                  border: '1px solid rgba(201,169,110,0.2)',
                  borderRadius: 99,
                  padding: '6px 16px',
                  fontSize: 12,
                  color: '#c9a96e',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.background = 'rgba(201,169,110,0.18)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.background = 'rgba(201,169,110,0.1)'
                }}
              >
                {pending_combined} {pending_combined === 1 ? 'story' : 'stories'} in moderation →
              </button>
            )}
            {(d?.bookings_open ?? 0) > 0 && (
              <button
                onClick={() => router.push('/admin/bookings')}
                className="transition-colors"
                style={{
                  background: 'rgba(201,169,110,0.1)',
                  border: '1px solid rgba(201,169,110,0.2)',
                  borderRadius: 99,
                  padding: '6px 16px',
                  fontSize: 12,
                  color: '#c9a96e',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.background = 'rgba(201,169,110,0.18)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.background = 'rgba(201,169,110,0.1)'
                }}
              >
                {d?.bookings_open} open booking{d?.bookings_open !== 1 ? 's' : ''} →
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Row 1 — Platform Health */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#111620] border border-[#1c2333] rounded-[16px] h-[120px] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <motion.div
          variants={tileVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <StatTile
            icon={Users2}
            iconColor="#e8607a"
            label="Dreamers"
            value={d?.total_dreamers ?? 0}
            delta={`+${d?.new_dreamers_today ?? 0} today`}
            deltaPositive={(d?.new_dreamers_today ?? 0) > 0}
          />
          <StatTile
            icon={Star}
            iconColor="#c9a96e"
            label="Live Companions"
            value={d?.total_companions_live ?? 0}
            delta={`+${d?.new_companions_today ?? 0} today`}
            deltaPositive={(d?.new_companions_today ?? 0) > 0}
          />
          <StatTile
            icon={Clock}
            iconColor="#c9a96e"
            label="Taken Down"
            value={d?.total_companions_pending ?? 0}
            pulse="gold"
            onClick={() => router.push('/admin/companions')}
          />
          <StatTile
            icon={CalendarDays}
            iconColor="#4ade80"
            label="Open Bookings"
            value={d?.bookings_open ?? 0}
            pulse="rose"
            onClick={() => router.push('/admin/bookings')}
          />
        </motion.div>
      )}

      {/* Row 2 — Content & Engagement */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#111620] border border-[#1c2333] rounded-[16px] h-[120px] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <motion.div
          variants={tileVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <StatTile
            icon={FileText}
            iconColor="#e8607a"
            label="Stories Live"
            value={d?.stories_approved ?? 0}
            delta={`+${d?.new_stories_today ?? 0} today`}
            deltaPositive={(d?.new_stories_today ?? 0) > 0}
          />
          <StatTile
            icon={AlertCircle}
            iconColor="#c9a96e"
            label="Pending Review"
            value={pending_combined}
            pulse="gold"
            onClick={() => router.push('/admin/content?filter=pending')}
          />
          <StatTile
            icon={Heart}
            iconColor="#e8607a"
            label="Total Likes"
            value={d?.total_likes ?? 0}
          />
          <StatTile
            icon={Bookmark}
            iconColor="#6b7280"
            label="Total Saves"
            value={d?.total_saves ?? 0}
          />
        </motion.div>
      )}

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement mini chart */}
        <div className="bg-[#111620] border border-[#1c2333] rounded-[16px] p-5">
          <p style={{ fontSize: 14, fontWeight: 600, color: '#eeeef0', marginBottom: 20 }}>
            Engagement Totals
          </p>
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-[42px] rounded-[8px] animate-pulse"
                  style={{ background: '#1c2333' }}
                />
              ))}
            </div>
          ) : (
            <>
              <EngagementBar label="Likes" value={d?.total_likes ?? 0} max={engMax} />
              <EngagementBar label="Saves" value={d?.total_saves ?? 0} max={engMax} />
              <EngagementBar label="Comments" value={d?.total_comments ?? 0} max={engMax} />
            </>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-[#111620] border border-[#1c2333] rounded-[16px] p-5">
          <p style={{ fontSize: 14, fontWeight: 600, color: '#eeeef0', marginBottom: 16 }}>
            Quick Actions
          </p>
          <div className="flex flex-col gap-2">
            {(
              [
                { icon: PenLine, label: 'Write & publish a story', href: '/admin/content/create' },
                {
                  icon: UserCheck,
                  label: 'Review pending companions',
                  href: '/admin/companions?filter=pending',
                },
                {
                  icon: Upload,
                  label: 'Import scraped stories',
                  href: '/admin/content/create?mode=import',
                },
                { icon: Tags, label: 'Manage tag library', href: '/admin/tags' },
              ] as const
            ).map(({ icon: Icon, label, href }) => (
              <button
                key={href}
                onClick={() => router.push(href)}
                className="flex items-center gap-3 p-3 rounded-[10px] transition-all duration-150 text-left w-full"
                style={{
                  background: '#0d1117',
                  border: '1px solid #1c2333',
                  fontSize: 13,
                  color: '#6b7280',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = 'rgba(232,96,122,0.3)'
                  el.style.background = 'rgba(232,96,122,0.05)'
                  el.style.color = '#eeeef0'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = '#1c2333'
                  el.style.background = '#0d1117'
                  el.style.color = '#6b7280'
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Content Performance */}
        <div className="bg-[#111620] border border-[#1c2333] rounded-[16px] p-5">
          <p style={{ fontSize: 14, fontWeight: 600, color: '#eeeef0', marginBottom: 18 }}>
            Content by Author
          </p>
          {!an ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-[38px] rounded-[8px] animate-pulse"
                  style={{ background: '#1c2333' }}
                />
              ))}
            </div>
          ) : (
            (() => {
              const total =
                an.content_by_author.admin +
                  an.content_by_author.companion +
                  an.content_by_author.user || 1
              return (
                <>
                  {(
                    [
                      {
                        label: 'Admin-seeded',
                        value: an.content_by_author.admin,
                        color: '#c9a96e',
                      },
                      {
                        label: 'By companions',
                        value: an.content_by_author.companion,
                        color: '#e8607a',
                      },
                      { label: 'By dreamers', value: an.content_by_author.user, color: '#6b7280' },
                    ] as const
                  ).map(({ label, value, color }) => (
                    <div key={label} className="mb-4 last:mb-0">
                      <div className="flex items-center justify-between mb-[6px]">
                        <span style={{ fontSize: 13, color: '#6b7280' }}>{label}</span>
                        <span style={{ fontSize: 13, color: '#eeeef0', fontWeight: 500 }}>
                          {value.toLocaleString()}
                        </span>
                      </div>
                      <div
                        className="h-[4px] rounded-full overflow-hidden"
                        style={{ background: '#1c2333' }}
                      >
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: value / total }}
                          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          className="h-full rounded-full"
                          style={{ transformOrigin: 'left', background: color }}
                        />
                      </div>
                    </div>
                  ))}
                </>
              )
            })()
          )}
        </div>

        {/* Booking Funnel */}
        <div className="bg-[#111620] border border-[#1c2333] rounded-[16px] p-5">
          <p style={{ fontSize: 14, fontWeight: 600, color: '#eeeef0', marginBottom: 18 }}>
            Booking Funnel
          </p>
          {!an ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[38px] rounded-[8px] animate-pulse"
                  style={{ background: '#1c2333' }}
                />
              ))}
            </div>
          ) : (
            (() => {
              const f = an.booking_funnel
              const total = f.total || 1
              const steps = [
                { label: 'Pending', value: f.pending, color: '#c9a96e' },
                { label: 'Accepted', value: f.accepted, color: '#4ade80' },
                { label: 'Completed', value: f.completed, color: '#e8607a' },
                { label: 'Declined', value: f.declined, color: '#f87171' },
              ]
              return (
                <>
                  {steps.map(({ label, value, color }) => (
                    <div key={label} className="mb-4 last:mb-0">
                      <div className="flex items-center justify-between mb-[6px]">
                        <span style={{ fontSize: 13, color: '#6b7280' }}>{label}</span>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 11, color: '#6b7280' }}>
                            {Math.round((value / total) * 100)}%
                          </span>
                          <span
                            style={{
                              fontSize: 13,
                              color: '#eeeef0',
                              fontWeight: 500,
                              minWidth: 24,
                              textAlign: 'right',
                            }}
                          >
                            {value}
                          </span>
                        </div>
                      </div>
                      <div
                        className="h-[4px] rounded-full overflow-hidden"
                        style={{ background: '#1c2333' }}
                      >
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: value / total }}
                          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="h-full rounded-full"
                          style={{ transformOrigin: 'left', background: color }}
                        />
                      </div>
                    </div>
                  ))}
                </>
              )
            })()
          )}
        </div>

        {/* Top Fantasy Tags */}
        <div className="bg-[#111620] border border-[#1c2333] rounded-[16px] p-5">
          <p style={{ fontSize: 14, fontWeight: 600, color: '#eeeef0', marginBottom: 18 }}>
            Top Fantasy Tags
          </p>
          {!an ? (
            <div className="flex flex-col gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-[32px] rounded-[8px] animate-pulse"
                  style={{ background: '#1c2333' }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-[6px]">
              {an.top_fantasy_tags.slice(0, 8).map((tag, i) => (
                <div key={tag.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span style={{ fontSize: 11, color: '#6b7280', width: 14, flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: '#eeeef0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tag.name}
                    </span>
                    {tag.category_name && (
                      <span style={{ fontSize: 10, color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {tag.category_name}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 99,
                      color: '#e8607a',
                      background: 'rgba(232,96,122,0.1)',
                      border: '1px solid rgba(232,96,122,0.2)',
                      flexShrink: 0,
                      marginLeft: 8,
                    }}
                  >
                    {tag.usage_count}
                  </span>
                </div>
              ))}
              {an.top_fantasy_tags.length === 0 && (
                <p style={{ fontSize: 13, color: '#6b7280' }}>No tags in use yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
