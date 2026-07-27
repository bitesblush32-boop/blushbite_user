'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from 'lucide-react'
import Link from 'next/link'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'new_today', label: 'New Today' },
  { key: 'live', label: 'Live' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'incomplete', label: 'Incomplete' },
]

interface CompanionRow {
  id: string
  email: string
  name: string | null
  full_name: string | null
  country: string | null
  companion_stage: number | null
  created_at: string
  profile_id: string | null
  city: string | null
  hourly_rate: string | null
  currency: string | null
  is_live: boolean | null
  is_verified: boolean | null
  approved_at: string | null
  liveness_check_passed: boolean | null
  provider_status: string | null
  photo_count: number
  video_count: number
}

interface Meta {
  total: number
  page: number
  limit: number
}

const stageLabel: Record<number, string> = {
  1: 'Identity',
  2: 'Verify',
  3: 'Review',
  4: 'Legal',
  5: 'Profile',
  6: 'Content',
  7: 'Complete',
}

function VerificationBadge({
  liveness,
  providerStatus,
}: {
  liveness: boolean | null
  providerStatus: string | null
}) {
  if (liveness === true) {
    return (
      <span
        className="text-[11px] px-[10px] py-1 rounded-full text-[#c9a96e]"
        style={{ background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(201,169,110,0.3)' }}
      >
        ✦ Verified
      </span>
    )
  }
  if (providerStatus === 'pending') {
    return (
      <span
        className="text-[11px] px-[10px] py-1 rounded-full text-[#6b7280]"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1c2333' }}
      >
        Pending
      </span>
    )
  }
  return (
    <span
      className="text-[11px] px-[10px] py-1 rounded-full text-[#6b7280]"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1c2333' }}
    >
      —
    </span>
  )
}

function LiveToggle({
  companionId,
  isLive,
  onToggle,
}: {
  companionId: string
  isLive: boolean | null
  onToggle: (id: string, val: boolean) => void
}) {
  const live = isLive === true
  return (
    <button
      onClick={() => onToggle(companionId, !live)}
      className="flex items-center gap-[6px] transition-all duration-150"
      title={live ? 'Set offline' : 'Set live'}
    >
      {live ? <ToggleRight size={20} color="#e8607a" /> : <ToggleLeft size={20} color="#6b7280" />}
      <span className="text-[12px]" style={{ color: live ? '#e8607a' : '#6b7280' }}>
        {live ? 'Live' : 'Off'}
      </span>
    </button>
  )
}

// ── Delete companion modal ──────────────────────────────────────────────────

function DeleteCompanionModal({
  name,
  onConfirm,
  onCancel,
  isPending,
}: {
  name: string | null
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
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
                Delete companion
              </h3>
            </div>
            <button
              onClick={onCancel}
              className="w-8 h-8 flex items-center justify-center rounded-full text-[#6b7280] hover:text-[#eeeef0] hover:bg-white/[0.06] transition-all"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-[13px] text-[#6b7280] leading-[1.6] mb-1">
            This will permanently delete{' '}
            <span className="text-[#eeeef0]">{name ?? 'this companion'}</span> and wipe all
            associated data:
          </p>
          <ul className="text-[12px] text-[#6b7280] leading-[1.7] mb-5 ml-2">
            <li>· Profile, photos, videos, and session cards</li>
            <li>· Verification, legal docs, and payment setup</li>
            <li>· All booking requests and analytics events</li>
            <li>· Authored stories and audio recordings</li>
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

function BulkDeleteCompanionsModal({
  count,
  onConfirm,
  onCancel,
  isPending,
}: {
  count: number
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
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
                Delete {count} companion{count !== 1 ? 's' : ''}
              </h3>
            </div>
            <button
              onClick={onCancel}
              className="w-8 h-8 flex items-center justify-center rounded-full text-[#6b7280] hover:text-[#eeeef0] hover:bg-white/[0.06] transition-all"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-[13px] text-[#6b7280] leading-[1.6] mb-1">
            This will permanently delete{' '}
            <span className="text-[#eeeef0]">
              {count} selected companion{count !== 1 ? 's' : ''}
            </span>{' '}
            and wipe all associated data:
          </p>
          <ul className="text-[12px] text-[#6b7280] leading-[1.7] mb-5 ml-2">
            <li>· Profiles, photos, videos, and session cards</li>
            <li>· Verification, legal docs, and payment setup</li>
            <li>· All booking requests and analytics events</li>
            <li>· Authored stories and audio recordings</li>
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
              {isPending ? 'Deleting…' : `Delete ${count} permanently`}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

const cardItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
}
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

export default function AdminCompanionsPage() {
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deleteCompanionId, setDeleteCompanionId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkModal, setShowBulkModal] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const queryClient = useQueryClient()

  const handleSearchChange = (val: string) => {
    setSearch(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(1)
    }, 300)
  }

  useEffect(() => {
    setPage(1)
  }, [tab])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [tab, page])

  const queryKey = ['admin', 'companions', tab, debouncedSearch, page]

  const { data, isLoading } = useQuery<{ data: CompanionRow[]; meta: Meta }>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ filter: tab, page: String(page), limit: '20' })
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await fetch(`/api/admin/companions?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    staleTime: 30_000,
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_live }: { id: string; is_live: boolean }) => {
      const res = await fetch(`/api/admin/companions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_live }),
      })
      if (!res.ok) throw new Error('Failed to update')
    },
    onMutate: async ({ id, is_live }) => {
      await queryClient.cancelQueries({ queryKey })
      const prev = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((c: CompanionRow) =>
            c.id === id
              ? { ...c, is_live, ...(is_live ? { approved_at: new Date().toISOString() } : {}) }
              : c
          ),
        }
      })
      return { prev }
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'companions'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/companions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
    },
    onSuccess: () => {
      setDeleteCompanionId(null)
      queryClient.invalidateQueries({ queryKey: ['admin', 'companions'] })
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch('/api/admin/companions/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) throw new Error('Failed')
    },
    onSuccess: () => {
      setSelectedIds(new Set())
      setShowBulkModal(false)
      queryClient.invalidateQueries({ queryKey: ['admin', 'companions'] })
    },
  })

  const rows = data?.data ?? []
  const meta = data?.meta
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1
  const deleteTarget = rows.find((r) => r.id === deleteCompanionId)

  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id))
  const toggleOne = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(rows.map((r) => r.id)))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="p-6 md:p-10 min-h-screen"
      style={{ background: '#07090f' }}
    >
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1
            style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#eeeef0' }}
            className="mb-1"
          >
            Companions
          </h1>
          <p className="text-[12px] text-[#6b7280]">{meta ? `${meta.total} total` : 'Loading…'}</p>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-[400px]">
          <Search
            size={14}
            color="#6b7280"
            className="absolute left-[14px] top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name, email, alias…"
            className="w-full bg-[#111620] border border-[#1c2333] rounded-[10px] pl-[38px] pr-4 py-[10px] text-[13px] text-[#eeeef0] placeholder-[#6b7280] outline-none transition-colors focus:border-[rgba(232,96,122,0.5)]"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
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
              <th className="px-4 py-3 w-[40px]">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-[14px] h-[14px] accent-[#e8607a] cursor-pointer"
                />
              </th>
              {[
                'Companion',
                'Country',
                'Stage',
                'Verification',
                'Photos',
                'Joined',
                'Status',
                '',
              ].map((h) => (
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
                    <td className="px-4 py-4 w-[40px]">
                      <div className="w-[14px] h-[14px] rounded bg-[#1c2333] animate-pulse" />
                    </td>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div
                          className="h-[14px] rounded-full bg-[#1c2333] animate-pulse"
                          style={{ width: j === 0 ? 120 : j === 7 ? 60 : 70 }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ) : (
              <motion.tbody
                key={`${tab}-${debouncedSearch}-${page}`}
                variants={container}
                initial="hidden"
                animate="show"
              >
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-[#6b7280] text-[13px] py-16">
                      Nothing here yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((c, idx) => (
                    <motion.tr
                      key={c.id}
                      variants={cardItem}
                      style={{
                        borderBottom: '1px solid #1c2333',
                        background: selectedIds.has(c.id)
                          ? 'rgba(239,68,68,0.05)'
                          : idx % 2 === 0
                            ? '#0d1117'
                            : '#07090f',
                      }}
                      className="hover:bg-[#111620] transition-colors group"
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-4 w-[40px]">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(c.id)}
                          onChange={() => toggleOne(c.id)}
                          className="w-[14px] h-[14px] accent-[#e8607a] cursor-pointer"
                        />
                      </td>
                      {/* Companion */}
                      <td className="px-4 py-4">
                        <div className="text-[13px] text-[#eeeef0] font-medium">
                          {c.full_name ?? c.name ?? '—'}
                        </div>
                        <div className="text-[11px] text-[#6b7280] mt-[2px]">{c.email}</div>
                      </td>
                      {/* Country */}
                      <td className="px-4 py-4 text-[12px] text-[#6b7280]">{c.country ?? '—'}</td>
                      {/* Stage */}
                      <td className="px-4 py-4">
                        <span className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">
                          {c.companion_stage != null
                            ? `${c.companion_stage} — ${stageLabel[c.companion_stage] ?? ''}`
                            : '—'}
                        </span>
                      </td>
                      {/* Verification */}
                      <td className="px-4 py-4">
                        <VerificationBadge
                          liveness={c.liveness_check_passed}
                          providerStatus={c.provider_status}
                        />
                      </td>
                      {/* Photos */}
                      <td className="px-4 py-4 text-[12px] text-[#6b7280]">{c.photo_count}</td>
                      {/* Joined */}
                      <td className="px-4 py-4 text-[12px] text-[#6b7280]">
                        {new Date(c.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: '2-digit',
                        })}
                      </td>
                      {/* Status toggle */}
                      <td className="px-4 py-4">
                        <LiveToggle
                          companionId={c.id}
                          isLive={c.is_live}
                          onToggle={(id, val) => toggleMutation.mutate({ id, is_live: val })}
                        />
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/admin/companions/${c.id}`}
                            className="flex items-center gap-1 text-[12px] text-[#e8607a]"
                          >
                            Review <ExternalLink size={11} />
                          </Link>
                          <button
                            onClick={() => setDeleteCompanionId(c.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-full border border-[#1c2333] text-[#6b7280] hover:text-[#ef4444] hover:border-[rgba(239,68,68,0.4)] transition-all"
                            title="Delete companion"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
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
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-3"
          >
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-[#111620] border border-[#1c2333] rounded-[14px] p-4 animate-pulse h-[100px]"
                  />
                ))
              : rows.map((c) => (
                  <motion.div key={c.id} variants={cardItem}>
                    <Link
                      href={`/admin/companions/${c.id}`}
                      className="block bg-[#111620] border border-[#1c2333] rounded-[14px] p-4 transition-all hover:border-[rgba(232,96,122,0.3)]"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-[13px] text-[#eeeef0] font-medium">
                            {c.full_name ?? c.name ?? '—'}
                          </div>
                          <div className="text-[11px] text-[#6b7280]">{c.email}</div>
                        </div>
                        <VerificationBadge
                          liveness={c.liveness_check_passed}
                          providerStatus={c.provider_status}
                        />
                      </div>
                      <div className="flex gap-2 flex-wrap mt-2">
                        {c.country && (
                          <span className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">
                            {c.country}
                          </span>
                        )}
                        {c.companion_stage != null && (
                          <span className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">
                            Stage {c.companion_stage}
                          </span>
                        )}
                        <span className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">
                          {c.photo_count} photos
                        </span>
                        <span
                          className="text-[11px] px-[10px] py-1 rounded-full"
                          style={
                            c.is_live
                              ? {
                                  color: '#e8607a',
                                  background: 'rgba(232,96,122,0.08)',
                                  border: '1px solid rgba(232,96,122,0.3)',
                                }
                              : {
                                  color: '#6b7280',
                                  background: 'rgba(255,255,255,0.04)',
                                  border: '1px solid #1c2333',
                                }
                          }
                        >
                          {c.is_live ? 'Live' : 'Off'}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
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

      {/* Bulk action bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="sticky bottom-6 flex items-center gap-3 mt-6 px-4 py-[10px] rounded-[12px] border border-[#1c2333] w-fit mx-auto"
            style={{ background: '#111620', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
          >
            <span className="text-[13px] text-[#eeeef0]">{selectedIds.size} selected</span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-[12px] text-[#6b7280] hover:text-[#eeeef0] transition-colors px-3 py-[6px] rounded-[8px] border border-[#1c2333] cursor-pointer"
            >
              Clear
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              className="text-[12px] text-white px-4 py-[6px] rounded-[8px] cursor-pointer font-medium flex items-center gap-[6px] transition-all hover:opacity-90"
              style={{ background: '#ef4444' }}
            >
              <Trash2 size={12} />
              Delete {selectedIds.size} companion{selectedIds.size !== 1 ? 's' : ''}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single delete modal */}
      <AnimatePresence>
        {deleteCompanionId && (
          <DeleteCompanionModal
            key="delete-companion"
            name={deleteTarget?.full_name ?? deleteTarget?.name ?? null}
            onConfirm={() => deleteMutation.mutate(deleteCompanionId!)}
            onCancel={() => setDeleteCompanionId(null)}
            isPending={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Bulk delete modal */}
      <AnimatePresence>
        {showBulkModal && (
          <BulkDeleteCompanionsModal
            key="bulk-delete-companions"
            count={selectedIds.size}
            onConfirm={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
            onCancel={() => setShowBulkModal(false)}
            isPending={bulkDeleteMutation.isPending}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
