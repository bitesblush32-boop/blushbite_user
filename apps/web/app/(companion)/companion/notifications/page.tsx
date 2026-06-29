'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Bell, Eye, Link2, CheckCircle2, Star, Calendar } from 'lucide-react'
import { useNotificationsWithMarkRead } from '@/hooks/useNotifications'
import type { NotificationItem } from '@/hooks/useNotifications'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

type FilterKey =
  | 'all'
  | 'profile_viewed'
  | 'story_linked'
  | 'bridge_approved'
  | 'booking_request'
  | 'admin_approved'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'profile_viewed', label: 'Profile Views' },
  { key: 'story_linked', label: 'Stories' },
  { key: 'booking_request', label: 'Bookings' },
  { key: 'admin_approved', label: 'System' },
]

function notifIcon(type: string) {
  switch (type) {
    case 'profile_viewed':
      return { Icon: Eye, bg: 'rgba(232,96,122,0.12)', color: '#e8607a' }
    case 'story_linked':
      return { Icon: Link2, bg: 'rgba(201,169,110,0.12)', color: '#c9a96e' }
    case 'bridge_approved':
      return { Icon: CheckCircle2, bg: 'rgba(52,211,153,0.12)', color: '#34d399' }
    case 'admin_approved':
      return { Icon: Star, bg: 'rgba(201,169,110,0.12)', color: '#c9a96e' }
    case 'booking_request':
      return { Icon: Calendar, bg: 'rgba(201,169,110,0.12)', color: '#c9a96e' }
    default:
      return { Icon: Bell, bg: 'rgba(107,114,128,0.12)', color: '#6b7280' }
  }
}

// ─── Stagger variants ──────────────────────────────────────────────────────────

const container = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } }
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CompanionNotificationsPage() {
  const router = useRouter()
  const { notifications, unreadCount, isLoading, markRead } = useNotificationsWithMarkRead()
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  const unreadIds = notifications
    .filter((n: NotificationItem) => !n.is_read)
    .map((n: NotificationItem) => n.id)

  const filtered =
    activeFilter === 'all'
      ? notifications
      : notifications.filter((n: NotificationItem) => n.notification_type === activeFilter)

  async function handleTap(n: NotificationItem) {
    if (!n.is_read) await markRead([n.id])
    if (n.action_url) router.push(n.action_url)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bell size={20} color="#e8607a" />
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 24,
              color: '#eeeef0',
              margin: 0,
            }}
          >
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: 9999,
                background: 'rgba(232,96,122,0.12)',
                border: '1px solid rgba(232,96,122,0.3)',
                color: '#e8607a',
              }}
            >
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadIds.length > 0 && (
          <button
            onClick={() => markRead(unreadIds)}
            style={{
              fontSize: 12,
              color: '#e8607a',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              opacity: 0.8,
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.opacity = '1'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.opacity = '0.8'
            }}
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* ── Filter pills ────────────────────────────────────────────────────── */}
      <div
        className="flex gap-2 mb-5 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            style={{
              flexShrink: 0,
              fontSize: 12,
              padding: '6px 14px',
              borderRadius: 9999,
              border: `1px solid ${activeFilter === f.key ? '#e8607a' : '#1c2333'}`,
              background: activeFilter === f.key ? 'rgba(232,96,122,0.08)' : 'transparent',
              color: activeFilter === f.key ? '#e8607a' : '#6b7280',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── List ────────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="shimmer"
              style={{ height: 76, borderRadius: 14, background: '#111620' }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: '#111620',
            border: '1px solid #1c2333',
            borderRadius: 16,
          }}
        >
          <Bell size={28} color="#6b7280" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: '#6b7280' }}>Nothing here yet.</p>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          {filtered.map((n: NotificationItem) => {
            const { Icon, bg, color } = notifIcon(n.notification_type)
            return (
              <motion.div
                key={n.id}
                variants={item}
                onClick={() => handleTap(n)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  background: '#111620',
                  borderRadius: 14,
                  padding: 16,
                  cursor: n.action_url ? 'pointer' : 'default',
                  borderLeft: n.is_read ? '1px solid #1c2333' : '3px solid #e8607a',
                  borderTop: '1px solid #1c2333',
                  borderRight: '1px solid #1c2333',
                  borderBottom: '1px solid #1c2333',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (n.action_url) (e.currentTarget as HTMLDivElement).style.background = '#161d2a'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLDivElement).style.background = '#111620'
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9999,
                    background: bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} color={color} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: n.is_read ? '#6b7280' : '#eeeef0',
                      marginBottom: 3,
                      lineHeight: 1.35,
                    }}
                  >
                    {n.title}
                  </p>
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, lineHeight: 1.5 }}>
                    {n.body}
                  </p>
                  <p style={{ fontSize: 10, color: '#4b5563' }}>{relativeTime(n.created_at)}</p>
                </div>

                {/* Unread dot */}
                {!n.is_read && (
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#e8607a',
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />
                )}
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
