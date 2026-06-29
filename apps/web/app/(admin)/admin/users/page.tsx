'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronLeft, ChevronRight, X, MoreHorizontal, Trash2 } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface DreamerRow {
  id: string
  email: string
  alias: string | null
  name: string | null
  image: string | null
  onboarding_complete: boolean
  is_flagged: boolean
  deleted_at: string | null
  created_at: string
  gender: string | null
  vibes: unknown
  mood_intensity: number | null
  story_count: number
  like_count: number
  save_count: number
  booking_count: number
}

interface Meta {
  total: number
  page: number
  limit: number
}

interface DreamerDetail {
  user: DreamerRow & {
    story_count: number
    like_count: number
    save_count: number
    booking_count: number
    is_flagged: boolean
    deleted_at: string | null
  }
  profile: {
    gender: string | null
    vibes: unknown
    mood_intensity: number | null
    display_name: string | null
  } | null
  recent_stories: Array<{
    id: string
    title: string
    created_at: string
    moderation_status: string
  }>
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'banned', label: 'Banned' },
]

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function initials(alias: string | null, email: string) {
  const src = alias ?? email
  return src.replace('@', '').slice(0, 2).toUpperCase()
}

// ── Avatar ─────────────────────────────────────────────────────────────────

function Avatar({
  alias,
  email,
  size = 32,
}: {
  alias: string | null
  email: string
  size?: number
}) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg,#e8607a,#9b5fe0)',
        fontSize: size * 0.34,
      }}
    >
      {initials(alias, email)}
    </div>
  )
}

// ── Kebab menu ─────────────────────────────────────────────────────────────

function KebabMenu({
  onView,
  onFlag,
  onBan,
  onDelete,
  isFlagged = false,
  isBanned = false,
}: {
  onView: () => void
  onFlag: () => void
  onBan: () => void
  onDelete: () => void
  isFlagged?: boolean
  isBanned?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    }
    setOpen((o) => !o)
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      )
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const items = [
    {
      label: 'View details',
      action: () => {
        onView()
        setOpen(false)
      },
      danger: false,
    },
    {
      label: isFlagged ? 'Unflag user' : 'Flag user',
      action: () => {
        onFlag()
        setOpen(false)
      },
      danger: false,
    },
    {
      label: isBanned ? 'Unban account' : 'Ban account',
      action: () => {
        onBan()
        setOpen(false)
      },
      danger: !isBanned,
    },
    {
      label: 'Delete account',
      action: () => {
        onDelete()
        setOpen(false)
      },
      danger: true,
    },
  ]

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="w-8 h-8 flex items-center justify-center rounded-full border border-[#1c2333] text-[#6b7280] hover:text-[#eeeef0] hover:border-[rgba(232,96,122,0.4)] transition-all"
      >
        <MoreHorizontal size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              top: pos.top,
              right: pos.right,
              background: '#0d1117',
              border: '1px solid #1c2333',
              borderRadius: 12,
              padding: '4px 0',
              zIndex: 9999,
              minWidth: 160,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full text-left px-4 py-2 text-[13px] transition-colors hover:bg-white/[0.04] flex items-center gap-2"
                style={{ color: item.danger ? '#ef4444' : '#eeeef0' }}
              >
                {item.label === 'Delete account' && <Trash2 size={12} />}
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Ban confirm modal ──────────────────────────────────────────────────────

function BanModal({
  alias,
  onConfirm,
  onCancel,
}: {
  alias: string | null
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-[6px] z-[900] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[#0d1117] border border-[#1c2333] rounded-[20px] w-full max-w-[420px] overflow-hidden"
      >
        <div
          className="h-[2px]"
          style={{ background: 'linear-gradient(90deg,transparent,#ef4444,transparent)' }}
        />
        <div className="p-6">
          <h3
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-[20px] text-[#eeeef0] mb-2"
          >
            Ban account
          </h3>
          <p className="text-[13px] text-[#6b7280] leading-[1.6] mb-5">
            {alias ? `@${alias.replace('@', '')}` : 'This user'} will no longer be able to sign in.
            This action can be reversed by removing the ban in the database.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-transparent text-[#6b7280] border border-[#1c2333] px-4 py-[10px] rounded-[10px] text-[13px] cursor-pointer transition-all hover:border-white/20 hover:text-[#eeeef0]"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 text-white border-none px-4 py-[10px] rounded-[10px] text-[13px] font-medium cursor-pointer"
              style={{ background: '#ef4444' }}
            >
              Ban account
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Delete confirm modal ───────────────────────────────────────────────────

function DeleteModal({
  alias,
  onConfirm,
  onCancel,
  isPending,
}: {
  alias: string | null
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}) {
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
          style={{ background: 'linear-gradient(90deg,transparent,#ef4444,transparent)' }}
        />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.3)',
              }}
            >
              <Trash2 size={16} color="#ef4444" />
            </div>
            <h3
              style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-[20px] text-[#eeeef0]"
            >
              Delete account
            </h3>
          </div>
          <p className="text-[13px] text-[#6b7280] leading-[1.6] mb-1">
            This will permanently delete{' '}
            <span className="text-[#eeeef0]">
              {alias ? `@${alias.replace('@', '')}` : 'this account'}
            </span>{' '}
            and wipe all associated data:
          </p>
          <ul className="text-[12px] text-[#6b7280] leading-[1.7] mb-5 ml-2">
            <li>· Profile, preferences, and tags</li>
            <li>· All stories and audio recordings</li>
            <li>· Likes, saves, comments, and bookings</li>
            <li>· Push subscriptions and notifications</li>
          </ul>
          <p className="text-[12px] text-[#ef4444] mb-5">This action cannot be undone.</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isPending}
              className="flex-1 bg-transparent text-[#6b7280] border border-[#1c2333] px-4 py-[10px] rounded-[10px] text-[13px] cursor-pointer transition-all hover:border-white/20 hover:text-[#eeeef0] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex-1 text-white border-none px-4 py-[10px] rounded-[10px] text-[13px] font-medium cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ background: '#ef4444' }}
            >
              {isPending ? 'Deleting…' : 'Delete permanently'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── User detail drawer ─────────────────────────────────────────────────────

function UserDrawer({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery<DreamerDetail>({
    queryKey: ['admin', 'user', userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    staleTime: 60_000,
  })

  const vibes = Array.isArray(data?.profile?.vibes) ? (data!.profile!.vibes as string[]) : []

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[700]"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: 380 }}
        animate={{ x: 0 }}
        exit={{ x: 380 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 right-0 bottom-0 w-[380px] z-[800] overflow-y-auto"
        style={{ background: '#0d1117', borderLeft: '1px solid #1c2333' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b border-[#1c2333] sticky top-0 z-10"
          style={{ background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(10px)' }}
        >
          <h2
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-[18px] text-[#eeeef0]"
          >
            Dreamer detail
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#6b7280] hover:text-[#eeeef0] hover:bg-white/[0.06] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-[#6b7280] text-[13px]">Loading…</div>
          </div>
        ) : data ? (
          <div className="px-6 py-5 flex flex-col gap-5">
            {/* Identity */}
            <div className="flex items-center gap-3">
              <Avatar alias={data.user.alias} email={data.user.email} size={44} />
              <div>
                <div className="text-[14px] text-[#eeeef0] font-medium">
                  {data.user.alias ?? data.user.email}
                </div>
                <div className="text-[12px] text-[#6b7280]">{data.user.email}</div>
                <div className="text-[11px] text-[#6b7280]">
                  Joined {relativeTime(data.user.created_at)}
                </div>
              </div>
            </div>

            {/* Profile */}
            {data.profile && (
              <div className="bg-[#111620] border border-[#1c2333] rounded-[12px] p-4 flex flex-col gap-2">
                <div className="text-[11px] text-[#6b7280] uppercase tracking-[0.05em] mb-1">
                  Profile
                </div>
                {data.profile.gender && (
                  <div className="flex justify-between">
                    <span className="text-[12px] text-[#6b7280]">Gender</span>
                    <span className="text-[12px] text-[#eeeef0] capitalize">
                      {data.profile.gender}
                    </span>
                  </div>
                )}
                {data.profile.mood_intensity != null && (
                  <div className="flex justify-between">
                    <span className="text-[12px] text-[#6b7280]">Mood intensity</span>
                    <span className="text-[12px] text-[#eeeef0]">
                      {data.profile.mood_intensity} / 100
                    </span>
                  </div>
                )}
                {vibes.length > 0 && (
                  <div className="mt-1">
                    <div className="text-[11px] text-[#6b7280] mb-1">Vibes</div>
                    <div className="flex flex-wrap gap-2">
                      {vibes.map((v, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-[10px] py-1 rounded-full text-[#e8607a]"
                          style={{
                            background: 'rgba(232,96,122,0.08)',
                            border: '1px solid rgba(232,96,122,0.25)',
                          }}
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Engagement counts */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Stories', value: data.user.story_count },
                { label: 'Likes', value: data.user.like_count },
                { label: 'Saves', value: data.user.save_count },
                { label: 'Bookings', value: data.user.booking_count },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-[#111620] border border-[#1c2333] rounded-[12px] p-3 text-center"
                >
                  <div className="text-[18px] font-semibold text-[#eeeef0]">{stat.value}</div>
                  <div className="text-[11px] text-[#6b7280]">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Recent stories */}
            {data.recent_stories.length > 0 && (
              <div>
                <div className="text-[11px] text-[#6b7280] uppercase tracking-[0.05em] mb-2">
                  Recent stories
                </div>
                <div className="flex flex-col gap-2">
                  {data.recent_stories.map((s) => (
                    <div
                      key={s.id}
                      className="bg-[#111620] border border-[#1c2333] rounded-[10px] px-4 py-3 flex items-start justify-between gap-2"
                    >
                      <div className="text-[13px] text-[#eeeef0] leading-[1.3] line-clamp-2">
                        {s.title}
                      </div>
                      <span
                        className="text-[10px] px-2 py-[2px] rounded-full flex-shrink-0 capitalize"
                        style={{
                          color:
                            s.moderation_status === 'approved'
                              ? '#4ade80'
                              : s.moderation_status === 'rejected'
                                ? '#ef4444'
                                : '#c9a96e',
                          background:
                            s.moderation_status === 'approved'
                              ? 'rgba(74,222,128,0.08)'
                              : s.moderation_status === 'rejected'
                                ? 'rgba(239,68,68,0.08)'
                                : 'rgba(201,169,110,0.08)',
                          border: `1px solid ${s.moderation_status === 'approved' ? 'rgba(74,222,128,0.25)' : s.moderation_status === 'rejected' ? 'rgba(239,68,68,0.25)' : 'rgba(201,169,110,0.25)'}`,
                        }}
                      >
                        {s.moderation_status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Moderation status */}
            {(data.user.is_flagged || data.user.deleted_at) && (
              <div className="flex flex-wrap gap-2">
                {data.user.is_flagged && (
                  <span
                    className="text-[11px] px-[10px] py-1 rounded-full text-[#c9a96e]"
                    style={{
                      background: 'rgba(201,169,110,0.08)',
                      border: '1px solid rgba(201,169,110,0.25)',
                    }}
                  >
                    ⚑ Flagged
                  </span>
                )}
                {data.user.deleted_at && (
                  <span
                    className="text-[11px] px-[10px] py-1 rounded-full text-[#ef4444]"
                    style={{
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.25)',
                    }}
                  >
                    ✕ Banned
                  </span>
                )}
              </div>
            )}

            {/* Onboarding */}
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#6b7280]">Onboarding</span>
              {data.user.onboarding_complete ? (
                <span
                  className="text-[11px] px-[10px] py-1 rounded-full text-[#4ade80]"
                  style={{
                    background: 'rgba(74,222,128,0.08)',
                    border: '1px solid rgba(74,222,128,0.25)',
                  }}
                >
                  Complete
                </span>
              ) : (
                <span
                  className="text-[11px] px-[10px] py-1 rounded-full text-[#c9a96e]"
                  style={{
                    background: 'rgba(201,169,110,0.08)',
                    border: '1px solid rgba(201,169,110,0.25)',
                  }}
                >
                  Incomplete
                </span>
              )}
            </div>
          </div>
        ) : null}
      </motion.div>
    </>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

const cardItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
}
const tableContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03 } },
}

export default function AdminUsersPage() {
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebounced] = useState('')
  const [page, setPage] = useState(1)
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null)
  const [banUserId, setBanUserId] = useState<string | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const queryClient = useQueryClient()

  const handleSearch = (val: string) => {
    setSearch(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebounced(val)
      setPage(1)
    }, 300)
  }

  useEffect(() => {
    setPage(1)
  }, [tab])

  const queryKey = ['admin', 'users', tab, debouncedSearch, page]

  const { data, isLoading } = useQuery<{ data: DreamerRow[]; meta: Meta }>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ filter: tab, page: String(page) })
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    staleTime: 30_000,
  })

  const userAction = async (id: string, action: string) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (!res.ok) throw new Error('Failed')
  }

  const banMutation = useMutation<void, Error, { id: string; action: 'ban' | 'unban' }>({
    mutationFn: ({ id, action }) => userAction(id, action),
    onSuccess: () => {
      setBanUserId(null)
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })

  const flagMutation = useMutation<void, Error, { id: string; action: 'flag' | 'unflag' }>({
    mutationFn: ({ id, action }) => userAction(id, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
    },
    onSuccess: () => {
      setDeleteUserId(null)
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })

  const rows = data?.data ?? []
  const meta = data?.meta
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1

  const banTarget = rows.find((r) => r.id === banUserId)
  const deleteTarget = rows.find((r) => r.id === deleteUserId)

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
        <div className="flex items-center gap-3 mb-1">
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#eeeef0' }}>
            Dreamers
          </h1>
          {meta && <span className="text-[12px] text-[#6b7280]">{meta.total} total</span>}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-[400px] mb-6">
        <Search
          size={14}
          color="#6b7280"
          className="absolute left-[14px] top-1/2 -translate-y-1/2 pointer-events-none"
        />
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by alias, email, or name…"
          className="w-full bg-[#111620] border border-[#1c2333] rounded-[10px] pl-[38px] pr-4 py-[10px] text-[13px] text-[#eeeef0] placeholder-[#6b7280] outline-none transition-colors focus:border-[rgba(232,96,122,0.5)]"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
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

      {/* Desktop table */}
      <div className="hidden md:block rounded-[14px] overflow-hidden border border-[#1c2333]">
        <table className="w-full">
          <thead>
            <tr style={{ background: '#111620', borderBottom: '1px solid #1c2333' }}>
              {['User', 'Joined', 'Onboarding', 'Activity', 'Bookings', ''].map((h) => (
                <th
                  key={h}
                  className="text-left text-[11px] text-[#6b7280] font-medium px-4 py-3 tracking-[0.04em] uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <tbody key="loading">
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: '1px solid #1c2333',
                      background: i % 2 === 0 ? '#0d1117' : '#07090f',
                    }}
                  >
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div
                          className="h-[14px] rounded-full bg-[#1c2333] animate-pulse"
                          style={{ width: j === 0 ? 160 : 80 }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ) : (
              <motion.tbody
                key={`${tab}-${debouncedSearch}-${page}`}
                variants={tableContainer}
                initial="hidden"
                animate="show"
              >
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-[#6b7280] text-[13px] py-16">
                      Nothing here yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => {
                    const isBanned = !!row.deleted_at
                    const isFlagged = row.is_flagged
                    return (
                      <motion.tr
                        key={row.id}
                        variants={cardItem}
                        style={{
                          borderBottom: '1px solid #1c2333',
                          background: isBanned
                            ? 'rgba(239,68,68,0.04)'
                            : isFlagged
                              ? 'rgba(201,169,110,0.03)'
                              : idx % 2 === 0
                                ? '#0d1117'
                                : '#07090f',
                          opacity: isBanned ? 0.5 : 1,
                        }}
                        className="hover:bg-[#111620] transition-colors group"
                      >
                        {/* User */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar alias={row.alias} email={row.email} size={32} />
                            <div>
                              <div className="text-[13px] text-[#eeeef0] font-medium">
                                {row.alias ?? '—'}
                              </div>
                              <div className="text-[11px] text-[#6b7280]">{row.email}</div>
                            </div>
                            {isBanned && (
                              <span
                                className="text-[10px] px-2 py-[2px] rounded-full text-[#ef4444]"
                                style={{
                                  background: 'rgba(239,68,68,0.08)',
                                  border: '1px solid rgba(239,68,68,0.25)',
                                }}
                              >
                                Banned
                              </span>
                            )}
                            {isFlagged && !isBanned && (
                              <span
                                className="text-[10px] px-2 py-[2px] rounded-full text-[#c9a96e]"
                                style={{
                                  background: 'rgba(201,169,110,0.08)',
                                  border: '1px solid rgba(201,169,110,0.25)',
                                }}
                              >
                                Flagged
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Joined */}
                        <td className="px-4 py-3 text-[12px] text-[#6b7280]">
                          {relativeTime(row.created_at)}
                        </td>
                        {/* Onboarding */}
                        <td className="px-4 py-3">
                          {row.onboarding_complete ? (
                            <span
                              className="text-[11px] px-[10px] py-1 rounded-full text-[#4ade80]"
                              style={{
                                background: 'rgba(74,222,128,0.08)',
                                border: '1px solid rgba(74,222,128,0.25)',
                              }}
                            >
                              Complete
                            </span>
                          ) : (
                            <span
                              className="text-[11px] px-[10px] py-1 rounded-full text-[#c9a96e]"
                              style={{
                                background: 'rgba(201,169,110,0.08)',
                                border: '1px solid rgba(201,169,110,0.25)',
                              }}
                            >
                              Incomplete
                            </span>
                          )}
                        </td>
                        {/* Activity */}
                        <td className="px-4 py-3 text-[11px] text-[#6b7280]">
                          {row.story_count} stories · {row.like_count} likes · {row.save_count}{' '}
                          saves
                        </td>
                        {/* Bookings */}
                        <td className="px-4 py-3">
                          <span
                            style={{ color: row.booking_count > 0 ? '#e8607a' : '#6b7280' }}
                            className="text-[13px] font-medium"
                          >
                            {row.booking_count}
                          </span>
                        </td>
                        {/* Action */}
                        <td className="px-4 py-3">
                          <KebabMenu
                            onView={() => setDrawerUserId(row.id)}
                            onFlag={() =>
                              flagMutation.mutate({
                                id: row.id,
                                action: isFlagged ? 'unflag' : 'flag',
                              })
                            }
                            onBan={() =>
                              isBanned
                                ? banMutation.mutate({ id: row.id, action: 'unban' })
                                : setBanUserId(row.id)
                            }
                            onDelete={() => setDeleteUserId(row.id)}
                            isFlagged={isFlagged}
                            isBanned={isBanned}
                          />
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </motion.tbody>
            )}
          </AnimatePresence>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={`mob-${tab}-${debouncedSearch}-${page}`}
            variants={tableContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-3"
          >
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-[#111620] border border-[#1c2333] rounded-[14px] p-4 animate-pulse h-[90px]"
                  />
                ))
              : rows.map((row) => {
                  const isBanned = !!row.deleted_at
                  const isFlagged = row.is_flagged
                  return (
                    <motion.div
                      key={row.id}
                      variants={cardItem}
                      className="bg-[#111620] border border-[#1c2333] rounded-[14px] p-4 relative"
                      style={{ opacity: isBanned ? 0.5 : 1 }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar alias={row.alias} email={row.email} size={36} />
                          <div>
                            <div className="text-[13px] text-[#eeeef0] font-medium">
                              {row.alias ?? '—'}
                            </div>
                            <div className="text-[11px] text-[#6b7280]">
                              {relativeTime(row.created_at)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {row.onboarding_complete ? (
                            <span
                              className="text-[10px] px-2 py-[2px] rounded-full text-[#4ade80]"
                              style={{
                                background: 'rgba(74,222,128,0.08)',
                                border: '1px solid rgba(74,222,128,0.25)',
                              }}
                            >
                              ✓
                            </span>
                          ) : null}
                          <KebabMenu
                            onView={() => setDrawerUserId(row.id)}
                            onFlag={() =>
                              flagMutation.mutate({
                                id: row.id,
                                action: isFlagged ? 'unflag' : 'flag',
                              })
                            }
                            onBan={() =>
                              isBanned
                                ? banMutation.mutate({ id: row.id, action: 'unban' })
                                : setBanUserId(row.id)
                            }
                            onDelete={() => setDeleteUserId(row.id)}
                            isFlagged={isFlagged}
                            isBanned={isBanned}
                          />
                        </div>
                      </div>
                      <div className="text-[11px] text-[#6b7280] mt-2">
                        {row.story_count} stories · {row.like_count} likes · {row.save_count} saves
                        {row.booking_count > 0 && (
                          <span style={{ color: '#e8607a' }}> · {row.booking_count} bookings</span>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
          </motion.div>
        </AnimatePresence>
      </div>

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

      {/* User detail drawer */}
      <AnimatePresence>
        {drawerUserId && (
          <UserDrawer
            key={drawerUserId}
            userId={drawerUserId}
            onClose={() => setDrawerUserId(null)}
          />
        )}
      </AnimatePresence>

      {/* Ban modal */}
      <AnimatePresence>
        {banUserId && (
          <BanModal
            key="ban"
            alias={banTarget?.alias ?? null}
            onConfirm={() => banMutation.mutate({ id: banUserId!, action: 'ban' })}
            onCancel={() => setBanUserId(null)}
          />
        )}
      </AnimatePresence>

      {/* Delete modal */}
      <AnimatePresence>
        {deleteUserId && (
          <DeleteModal
            key="delete"
            alias={deleteTarget?.alias ?? null}
            onConfirm={() => deleteMutation.mutate(deleteUserId!)}
            onCancel={() => setDeleteUserId(null)}
            isPending={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
