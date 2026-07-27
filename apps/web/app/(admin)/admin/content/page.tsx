'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Star, ChevronLeft, ChevronRight, Trash2, Check, X, RotateCcw } from 'lucide-react'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────

interface StoryListItem {
  id: string
  title: string
  excerpt: string | null
  author_type: string
  is_anonymous: boolean
  is_published: boolean
  is_featured: boolean
  moderation_status: string
  moderated_at: string | null
  view_count: number
  like_count: number
  save_count: number
  comment_count: number
  created_at: string
  published_at: string | null
  user_alias: string | null
  companion_name: string | null
  category_name: string | null
}

interface Meta {
  total: number
  pending_count: number
  page: number
  limit: number
}

// ── Constants ──────────────────────────────────────────────────────────────

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'featured', label: 'Featured' },
  { key: 'user', label: 'User Posts' },
  { key: 'companion', label: 'Companion Posts' },
  { key: 'admin', label: 'Admin Content' },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function authorLabel(item: StoryListItem) {
  if (item.is_anonymous) return 'Anonymous'
  if (item.author_type === 'admin') return 'Admin'
  if (item.author_type === 'companion') return item.companion_name ?? 'Companion'
  return item.user_alias ?? 'User'
}

// ── Badges ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; border: string }> = {
    pending: { color: '#c9a96e', bg: 'rgba(201,169,110,0.10)', border: 'rgba(201,169,110,0.30)' },
    approved: { color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.30)' },
    rejected: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.30)' },
  }
  const s = map[status] ?? map.pending
  return (
    <span
      className="text-[11px] px-[10px] py-1 rounded-full capitalize"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      {status}
    </span>
  )
}

// ── Delete confirm modal ───────────────────────────────────────────────────

function DeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-[6px] z-[900] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[#0d1117] border border-[#1c2333] rounded-[20px] w-full max-w-[400px] overflow-hidden"
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
            Delete story
          </h3>
          <p className="text-[13px] text-[#6b7280] leading-[1.6] mb-5">
            This will soft-delete the story. It will no longer appear in any feed.
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
              Delete
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Story item ─────────────────────────────────────────────────────────────

const cardItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
}

function StoryItem({
  story,
  selected,
  onSelect,
  onAction,
}: {
  story: StoryListItem
  selected: boolean
  onSelect: (id: string) => void
  onAction: (id: string, action: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const isPending = story.moderation_status === 'pending'
  const isApproved = story.moderation_status === 'approved'
  const isRejected = story.moderation_status === 'rejected'

  return (
    <>
      <motion.div
        variants={cardItem}
        className="relative bg-[#111620] border rounded-[16px] p-5 transition-colors"
        style={{ borderColor: selected ? 'rgba(232,96,122,0.4)' : '#1c2333' }}
      >
        {/* Checkbox */}
        <button
          onClick={() => onSelect(story.id)}
          className="absolute top-4 left-4 w-5 h-5 rounded-[4px] border flex items-center justify-center flex-shrink-0 transition-all"
          style={{
            background: selected ? '#e8607a' : 'transparent',
            borderColor: selected ? '#e8607a' : '#1c2333',
          }}
        >
          {selected && <Check size={11} color="white" />}
        </button>

        {/* Top row */}
        <div className="flex items-start justify-between gap-3 pl-8">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={story.moderation_status} />
            <span className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03] capitalize">
              {story.author_type}
            </span>
            {story.is_featured && (
              <span
                className="inline-flex items-center gap-1 text-[11px] px-[10px] py-1 rounded-full text-[#c9a96e]"
                style={{
                  background: 'rgba(201,169,110,0.10)',
                  border: '1px solid rgba(201,169,110,0.30)',
                }}
              >
                <Star size={9} fill="#c9a96e" /> Featured
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            {isPending && (
              <>
                <button
                  onClick={() => onAction(story.id, 'approve')}
                  className="inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full cursor-pointer transition-all hover:opacity-80"
                  style={{
                    color: '#4ade80',
                    background: 'rgba(74,222,128,0.08)',
                    border: '1px solid rgba(74,222,128,0.30)',
                  }}
                >
                  <Check size={10} /> Approve
                </button>
                <button
                  onClick={() => onAction(story.id, 'reject')}
                  className="inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full cursor-pointer transition-all hover:opacity-80"
                  style={{
                    color: '#ef4444',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.30)',
                  }}
                >
                  <X size={10} /> Reject
                </button>
                <button
                  onClick={() => onAction(story.id, story.is_featured ? 'unfeature' : 'feature')}
                  className="inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full cursor-pointer transition-all hover:opacity-80"
                  style={{
                    color: '#c9a96e',
                    background: 'rgba(201,169,110,0.08)',
                    border: '1px solid rgba(201,169,110,0.30)',
                  }}
                >
                  <Star size={9} /> {story.is_featured ? 'Unfeature' : 'Feature'}
                </button>
              </>
            )}
            {isApproved && (
              <>
                <button
                  onClick={() => onAction(story.id, story.is_featured ? 'unfeature' : 'feature')}
                  className="inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full cursor-pointer transition-all hover:opacity-80"
                  style={{
                    color: '#c9a96e',
                    background: 'rgba(201,169,110,0.08)',
                    border: '1px solid rgba(201,169,110,0.30)',
                  }}
                >
                  <Star size={9} /> {story.is_featured ? 'Unfeature' : 'Feature'}
                </button>
                <button
                  onClick={() => setShowDelete(true)}
                  className="inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full cursor-pointer transition-all hover:opacity-80"
                  style={{
                    color: '#ef4444',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.30)',
                  }}
                >
                  <Trash2 size={10} /> Delete
                </button>
              </>
            )}
            {isRejected && (
              <>
                <button
                  onClick={() => onAction(story.id, 'approve')}
                  className="inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full cursor-pointer transition-all hover:opacity-80"
                  style={{
                    color: '#4ade80',
                    background: 'rgba(74,222,128,0.08)',
                    border: '1px solid rgba(74,222,128,0.30)',
                  }}
                >
                  <RotateCcw size={10} /> Restore
                </button>
                <button
                  onClick={() => setShowDelete(true)}
                  className="inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full cursor-pointer transition-all hover:opacity-80"
                  style={{
                    color: '#ef4444',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.30)',
                  }}
                >
                  <Trash2 size={10} /> Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Title + body */}
        <div className="pl-8 mt-3">
          <div
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-[16px] text-[#eeeef0] leading-[1.3] overflow-hidden text-ellipsis whitespace-nowrap"
          >
            {story.title}
          </div>

          {story.excerpt && (
            <div>
              <div
                className="text-[13px] text-[#6b7280] leading-[1.6] mt-1 overflow-hidden"
                style={{
                  maxHeight: expanded ? '2000px' : '2.8em',
                  transition: 'max-height 0.4s ease',
                }}
              >
                {story.excerpt}
              </div>
              {story.excerpt.length > 120 && (
                <button
                  onClick={() => setExpanded((e) => !e)}
                  className="text-[12px] text-[#e8607a] mt-1 hover:opacity-80 transition-opacity"
                >
                  {expanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <span className="text-[12px] text-[#6b7280]">{authorLabel(story)}</span>
            {story.category_name && (
              <span className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">
                {story.category_name}
              </span>
            )}
            <span className="text-[12px] text-[#6b7280]">{relativeTime(story.created_at)}</span>
            <span className="text-[12px] text-[#6b7280]">👁 {story.view_count}</span>
            <span className="text-[12px] text-[#6b7280]">♥ {story.like_count}</span>
            <span className="text-[12px] text-[#6b7280]">🔖 {story.save_count}</span>
            <span className="text-[12px] text-[#6b7280]">💬 {story.comment_count}</span>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showDelete && (
          <DeleteModal
            key="del"
            onConfirm={() => {
              onAction(story.id, 'delete')
              setShowDelete(false)
            }}
            onCancel={() => setShowDelete(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

export default function AdminContentPage() {
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const queryClient = useQueryClient()

  const handleSearch = (val: string) => {
    setSearch(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(1)
    }, 300)
  }

  useEffect(() => {
    setPage(1)
    setSelected(new Set())
  }, [tab])

  const queryKey = ['admin', 'content', tab, debouncedSearch, page]

  const { data, isLoading } = useQuery<{ data: StoryListItem[]; meta: Meta }>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ filter: tab, page: String(page), limit: '20' })
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await fetch(`/api/admin/content?${params}`)
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
      const res = await fetch(`/api/admin/content/${id}`, {
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
            .map((s: StoryListItem) => {
              if (s.id !== id) return s
              if (action === 'approve')
                return { ...s, moderation_status: 'approved', is_published: true }
              if (action === 'reject')
                return { ...s, moderation_status: 'rejected', is_published: false }
              if (action === 'feature') return { ...s, is_featured: true }
              if (action === 'unfeature') return { ...s, is_featured: false }
              if (action === 'delete') return null
              return s
            })
            .filter(Boolean),
        }
      })
      return { prev }
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  const bulkAction = async (action: string) => {
    const ids = Array.from(selected)
    await Promise.all(ids.map((id) => actionMutation.mutateAsync({ id, action })))
    setSelected(new Set())
  }

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
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
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#eeeef0' }}>
              Stories & Confessions
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
        <Link
          href="/admin/content/create"
          className="bg-[#e8607a] hover:bg-[#c4485e] text-white border-none px-[18px] py-[10px] rounded-[10px] text-[13px] font-medium cursor-pointer transition-all hover:-translate-y-px whitespace-nowrap flex-shrink-0"
        >
          + Write story
        </Link>
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
          placeholder="Search by title or excerpt…"
          className="w-full bg-[#111620] border border-[#1c2333] rounded-[10px] pl-[38px] pr-4 py-[10px] text-[13px] text-[#eeeef0] placeholder-[#6b7280] outline-none transition-colors focus:border-[rgba(232,96,122,0.5)]"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="text-[12px] px-[14px] py-[6px] rounded-full border cursor-pointer transition-all duration-150 whitespace-nowrap flex-shrink-0"
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

      {/* Bulk actions bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-[#111620] border border-[#1c2333] rounded-[14px] px-5 py-3 flex items-center gap-4 mb-4 flex-wrap"
          >
            <span className="text-[13px] text-[#eeeef0] font-medium">{selected.size} selected</span>
            <button
              onClick={() => bulkAction('approve')}
              className="text-[12px] px-4 py-[6px] rounded-full cursor-pointer transition-all hover:opacity-80"
              style={{
                color: '#4ade80',
                background: 'rgba(74,222,128,0.08)',
                border: '1px solid rgba(74,222,128,0.30)',
              }}
            >
              Approve all
            </button>
            <button
              onClick={() => bulkAction('reject')}
              className="text-[12px] px-4 py-[6px] rounded-full cursor-pointer transition-all hover:opacity-80"
              style={{
                color: '#ef4444',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.30)',
              }}
            >
              Reject all
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-[12px] text-[#6b7280] px-4 py-[6px] rounded-full border border-[#1c2333] cursor-pointer transition-all hover:text-[#eeeef0]"
            >
              Clear selection
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story list */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div key="loading" className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#111620] border border-[#1c2333] rounded-[16px] p-5 animate-pulse h-[130px]"
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
            Nothing here yet. Your taste is still forming.
          </motion.div>
        ) : (
          <motion.div
            key={`${tab}-${debouncedSearch}-${page}`}
            variants={listContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-3"
          >
            {rows.map((story) => (
              <StoryItem
                key={story.id}
                story={story}
                selected={selected.has(story.id)}
                onSelect={toggleSelect}
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
