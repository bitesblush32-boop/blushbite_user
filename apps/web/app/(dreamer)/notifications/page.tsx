'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Bell } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Notification } from '@/hooks/useNotifications'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60)  return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7)   return `${d}d`
  return `${Math.floor(d / 7)}w`
}

function groupNotifications(items: Notification[]): { label: string; items: Notification[] }[] {
  const now      = new Date()
  const todayStr = now.toDateString()
  const weekAgo  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const today: Notification[] = [], thisWeek: Notification[] = [], earlier: Notification[] = []
  for (const n of items) {
    const d = new Date(n.created_at)
    if (d.toDateString() === todayStr) today.push(n)
    else if (d >= weekAgo)             thisWeek.push(n)
    else                               earlier.push(n)
  }
  const groups: { label: string; items: Notification[] }[] = []
  if (today.length)    groups.push({ label: 'Today',     items: today })
  if (thisWeek.length) groups.push({ label: 'This week', items: thisWeek })
  if (earlier.length)  groups.push({ label: 'Earlier',   items: earlier })
  return groups
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  const bytes   = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', height: 64 }}>
      <div className="shimmer" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="shimmer" style={{ height: 13, borderRadius: 6, width: '68%' }} />
        <div className="shimmer" style={{ height: 10, borderRadius: 6, width: '28%' }} />
      </div>
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function AvatarCell({ alias, image }: { alias: string; image: string | null }) {
  const initials = alias.replace('@', '').slice(0, 2).toUpperCase()
  if (image) {
    return <img src={image} alt={alias} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  }
  return (
    <span style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0, background: 'linear-gradient(135deg,#e8607a,#9b5fe0)' }}>
      {initials}
    </span>
  )
}

// ─── Notification row ─────────────────────────────────────────────────────────

const rowVariants = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] } },
}

function NotifRow({ n, onTap }: { n: Notification; onTap: (n: Notification) => void }) {
  const alias = `@${n.actor.alias}`
  return (
    <motion.button
      variants={rowVariants}
      type="button"
      onClick={() => onTap(n)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px', width: '100%',
        background: n.is_read ? 'transparent' : 'rgba(232,96,122,0.05)',
        border: 'none',
        borderLeftWidth: 3, borderLeftStyle: 'solid',
        borderLeftColor: n.is_read ? 'transparent' : '#e8607a',
        cursor: 'pointer', textAlign: 'left',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = n.is_read ? 'transparent' : 'rgba(232,96,122,0.05)' }}
    >
      <AvatarCell alias={n.actor.alias} image={n.actor.image} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, color: '#eeeef0', lineHeight: 1.4, marginBottom: 3 }}>
          {n.type === 'story_like'    && <><b style={{ color: '#e8607a' }}>{alias}</b> liked your confession</>}
          {n.type === 'story_save'    && <><b style={{ color: '#e8607a' }}>{alias}</b> saved your confession</>}
          {n.type === 'story_comment' && <><b style={{ color: '#e8607a' }}>{alias}</b> commented on your confession</>}
          {n.type === 'comment_reply' && <><b style={{ color: '#e8607a' }}>{alias}</b> replied to your comment</>}
          {n.type === 'comment_like'  && <><b style={{ color: '#e8607a' }}>{alias}</b> liked your comment</>}
          {!['story_like','story_save','story_comment','comment_reply','comment_like'].includes(n.type) && (
            <><b style={{ color: '#e8607a' }}>{alias}</b> interacted with your content</>
          )}
        </p>
        <p style={{ fontSize: 12, color: '#6b7280' }}>{formatRelative(n.created_at)}</p>
      </div>
      {!n.is_read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e8607a', flexShrink: 0 }} />}
    </motion.button>
  )
}

// ─── Permission Banner ────────────────────────────────────────────────────────

function PermissionBanner({ onGranted }: { onGranted: () => void }) {
  const [show,    setShow]    = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default' &&
      'serviceWorker' in navigator
    ) {
      setShow(true)
    }
  }, [])

  async function handleEnable() {
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        const reg = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) as any,
        })
        // sub.toJSON() nests keys under { keys: { p256dh, auth } } — extract them explicitly
        const raw = sub.toJSON() as { endpoint: string; keys?: { p256dh: string; auth: string } }
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: raw.endpoint,
            p256dh:   raw.keys?.p256dh ?? '',
            auth:     raw.keys?.auth   ?? '',
          }),
        })
        onGranted()
      }
    } catch {
      // non-fatal
    } finally {
      setShow(false)
      setLoading(false)
    }
  }

  if (!show) return null

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        margin: '0 16px 12px',
        padding: '12px 14px',
        borderRadius: 14,
        background: 'rgba(232,96,122,0.07)',
        border: '1px solid rgba(232,96,122,0.2)',
      }}
    >
      <span style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(232,96,122,0.12)', flexShrink: 0 }}>
        <Bell size={16} color="#e8607a" />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, color: '#eeeef0', fontWeight: 500, marginBottom: 1 }}>Get notified on this device</p>
        <p style={{ fontSize: 11, color: '#6b7280' }}>Know instantly when someone reacts to your content.</p>
      </div>
      <button
        type="button"
        onClick={handleEnable}
        disabled={loading}
        style={{ fontSize: 12, color: '#fff', background: '#e8607a', border: 'none', borderRadius: 20, padding: '6px 14px', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.6 : 1, flexShrink: 0 }}
      >
        {loading ? '…' : 'Enable'}
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface NotificationsResponse {
  notifications: Notification[]
  unread_count:  number
}

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } }

export default function NotificationsPage() {
  const router       = useRouter()
  const queryClient  = useQueryClient()
  const headerRef    = useRef<HTMLDivElement>(null)
  const [headerH, setHeaderH] = useState(0)
  const [markedLabel, setMarkedLabel] = useState<'Mark all read' | 'Marked ✓'>('Mark all read')

  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn:  () => fetch('/api/notifications').then(r => r.json()),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  })

  const notifications = data?.notifications ?? []
  const unreadCount   = data?.unread_count  ?? 0

  // Measure the sticky header so content below never hides behind it
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const obs = new ResizeObserver(() => setHeaderH(el.offsetHeight))
    obs.observe(el)
    setHeaderH(el.offsetHeight)
    return () => obs.disconnect()
  }, [])

  const markAllRead = useMutation({
    mutationFn: () => fetch('/api/notifications/read-all', { method: 'PATCH' }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      setMarkedLabel('Marked ✓')
      setTimeout(() => setMarkedLabel('Mark all read'), 1500)
    },
  })

  function handleTap(n: Notification) {
    fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' }).catch(() => {})
    queryClient.setQueryData<NotificationsResponse>(['notifications'], old => {
      if (!old) return old
      return {
        ...old,
        notifications: old.notifications.map(x => x.id === n.id ? { ...x, is_read: true } : x),
        unread_count: Math.max(0, old.unread_count - (n.is_read ? 0 : 1)),
      }
    })
    if (n.content_type === 'story' || n.content_type === 'comment') {
      router.push('/confessions')
    }
  }

  const groups = groupNotifications(notifications)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ minHeight: '100vh', background: '#07090f', position: 'relative' }}
    >
      {/* Noise */}
      <div className="fixed inset-0 pointer-events-none z-[1000] opacity-60"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }}
      />
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(232,96,122,0.06) 0%, transparent 70%)' }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Sticky header ── */}
        <div
          ref={headerRef}
          style={{
            position: 'sticky',
            top: 75,
            zIndex: 10,
            background: 'rgba(7,9,15,0.92)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid #1c2333',
          }}
        >
          {/* Title row */}
          <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#eeeef0', fontWeight: 400 }}>
                Activity
              </h1>
              {unreadCount > 0 && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{unreadCount} unread</p>}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                style={{
                  fontSize: 12,
                  color:      markedLabel === 'Marked ✓' ? '#4ade80' : '#e8607a',
                  background: markedLabel === 'Marked ✓' ? 'rgba(74,222,128,0.08)' : 'rgba(232,96,122,0.08)',
                  border:     `1px solid ${markedLabel === 'Marked ✓' ? 'rgba(74,222,128,0.2)' : 'rgba(232,96,122,0.2)'}`,
                  borderRadius: 20, padding: '6px 14px',
                  cursor: markAllRead.isPending ? 'default' : 'pointer',
                  opacity: markAllRead.isPending ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {markedLabel}
              </button>
            )}
          </div>

          {/* Permission banner — inside sticky so it never fights with content */}
          <PermissionBanner onGranted={() => setHeaderH(headerRef.current?.offsetHeight ?? headerH)} />
        </div>

        {/* ── Content — padded so first row is never hidden behind the sticky header ── */}
        <div style={{ paddingTop: headerH > 0 ? headerH : undefined }}>

          {/* Loading */}
          {isLoading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

          {/* Empty */}
          {!isLoading && notifications.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 300px)', padding: '0 20px', textAlign: 'center' }}>
              <span style={{ width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, background: 'rgba(232,96,122,0.08)', border: '1px solid rgba(232,96,122,0.15)' }}>
                <Bell size={28} color="#e8607a" />
              </span>
              <p style={{ fontSize: 15, color: '#eeeef0', marginBottom: 10 }}>No notifications yet</p>
              <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.6, maxWidth: 260 }}>
                When someone likes, saves, or comments on your content it&apos;ll appear here.
              </p>
            </div>
          )}

          {/* Grouped notifications */}
          {!isLoading && notifications.length > 0 && (
            <motion.div variants={containerVariants} initial="hidden" animate="show">
              {groups.map(group => (
                <div key={group.label}>
                  <div style={{ padding: '10px 20px 6px', fontSize: 11, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
                    {group.label}
                  </div>
                  {group.items.map((n, i) => (
                    <div key={n.id}>
                      <NotifRow n={n} onTap={handleTap} />
                      {i < group.items.length - 1 && <div style={{ height: 1, background: '#1c2333', margin: '0 20px' }} />}
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>
          )}

          <div style={{ height: 100 }} />
        </div>
      </div>
    </motion.div>
  )
}
