'use client'

import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications, useMarkAllRead, useMarkRead } from '@/hooks/useNotifications'
import type { Notification } from '@/hooks/useNotifications'

interface Props {
  open: boolean
  onClose: () => void
}

function getNotifCopy(n: Notification): string {
  const who = `@${n.actor.alias}`
  switch (n.type) {
    case 'story_like':    return `${who} liked your confession`
    case 'story_save':    return `${who} saved your confession`
    case 'story_comment': return `${who} commented on your confession`
    case 'comment_reply': return `${who} replied to your comment`
    case 'comment_like':  return `${who} liked your comment`
    default:              return `${who} interacted with your content`
  }
}

function getDestination(n: Notification): string {
  if (n.content_type === 'story' && n.content_id) {
    return `/confessions?open=${n.content_id}`
  }
  return '/confessions'
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function AvatarCell({ alias, image }: { alias: string; image: string | null }) {
  const initials = alias.replace('@', '').slice(0, 2).toUpperCase()
  if (image) {
    return (
      <img
        src={image}
        alt={alias}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    )
  }
  return (
    <span
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 600,
        color: '#fff',
        flexShrink: 0,
        background: 'linear-gradient(135deg,#e8607a,#9b5fe0)',
      }}
    >
      {initials}
    </span>
  )
}

function SkeletonRow() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 0',
        borderBottom: '1px solid #1c2333',
        height: 64,
      }}
    >
      <div
        className="shimmer"
        style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="shimmer" style={{ height: 12, borderRadius: 6, width: '70%' }} />
        <div className="shimmer" style={{ height: 10, borderRadius: 6, width: '30%' }} />
      </div>
    </div>
  )
}

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

export default function NotificationsPanel({ open: _open, onClose }: Props) {
  const router = useRouter()
  const { notifications, unreadCount, isLoading } = useNotifications()
  const markAllRead = useMarkAllRead()
  const markRead = useMarkRead()

  function handleTap(n: Notification) {
    if (!n.is_read) {
      markRead.mutate(n.id)
    }
    onClose()
    router.push(getDestination(n))
  }

  if (isLoading) {
    return (
      <div style={{ padding: '0 2px' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 280,
          borderRadius: 18,
          border: '1px dashed #1c2333',
          background: '#111620',
          padding: '0 24px',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            border: '1px solid #1c2333',
            background: 'rgba(232,96,122,0.08)',
          }}
        >
          <Bell size={24} color="#e8607a" />
        </span>
        <p style={{ fontSize: 15, color: '#eeeef0', marginBottom: 8 }}>No notifications yet</p>
        <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.6, maxWidth: 260 }}>
          When someone reacts to your activity, it&apos;ll show up here.
        </p>
      </div>
    )
  }

  return (
    <div>
      {unreadCount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            style={{
              fontSize: 11,
              color: '#e8607a',
              background: 'rgba(232,96,122,0.08)',
              border: '1px solid rgba(232,96,122,0.2)',
              borderRadius: 20,
              padding: '4px 12px',
              cursor: 'pointer',
              opacity: markAllRead.isPending ? 0.5 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            Mark all read
          </button>
        </div>
      )}

      <motion.div
        variants={{ show: { transition: { staggerChildren: 0.04 } } }}
        initial="hidden"
        animate="show"
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <AnimatePresence>
          {notifications.map(n => (
            <motion.button
              key={n.id}
              type="button"
              variants={rowVariants}
              onClick={() => handleTap(n)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '13px 12px',
                borderRadius: 12,
                marginBottom: 4,
                cursor: 'pointer',
                border: 'none',
                textAlign: 'left',
                width: '100%',
                background: n.is_read ? 'transparent' : 'rgba(232,96,122,0.06)',
                borderLeft: n.is_read ? '2px solid transparent' : '2px solid #e8607a',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = n.is_read
                  ? 'transparent'
                  : 'rgba(232,96,122,0.06)'
              }}
            >
              <AvatarCell alias={n.actor.alias} image={n.actor.image} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 13,
                    color: '#eeeef0',
                    lineHeight: 1.4,
                    marginBottom: 3,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {getNotifCopy(n)}
                </p>
                <p style={{ fontSize: 11, color: '#6b7280' }}>{formatRelative(n.created_at)}</p>
              </div>

              {!n.is_read && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#e8607a',
                    flexShrink: 0,
                  }}
                />
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
