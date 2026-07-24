'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link2, Check, X } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Bridge {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  approved_at: string | null
  created_at: string
  profile_id: string
  companion_name: string | null
  story_id: string
  story_title: string
  story_excerpt: string | null
  story_author_type: string
}

type Filter = 'all' | 'pending' | 'approved' | 'rejected'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

// ── Stagger ────────────────────────────────────────────────────────────────────

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }
const cardItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
}

// ── Bridge card ────────────────────────────────────────────────────────────────

function BridgeCard({
  bridge,
  onAction,
}: {
  bridge: Bridge
  onAction: (id: string, action: 'approve' | 'reject', note?: string) => void
}) {
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote] = useState('')

  const initials = (bridge.companion_name ?? '?')[0].toUpperCase()

  return (
    <motion.div
      variants={cardItem}
      style={{
        background: '#111620',
        border: '1px solid #1c2333',
        borderRadius: 16,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Top row: companion ← → story */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Companion */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 140 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#e8607a,#9b5fe0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#eeeef0' }}>
              {bridge.companion_name ?? '—'}
            </div>
            {bridge.companion_name && (
              <div style={{ fontSize: 11, color: '#6b7280' }}>{bridge.companion_name}</div>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            color: '#6b7280',
            fontSize: 11,
            gap: 6,
            paddingTop: 8,
          }}
        >
          <Link2 size={12} />
          <span>wants to link to</span>
        </div>

        {/* Story */}
        <div style={{ flex: 1, minWidth: 180 }}>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 14,
              color: '#eeeef0',
              marginBottom: 4,
            }}
          >
            {bridge.story_title}
          </div>
          {bridge.story_excerpt && (
            <div
              style={{
                fontSize: 12,
                color: '#6b7280',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {bridge.story_excerpt}
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 9999,
                background: 'rgba(232,96,122,0.08)',
                border: '1px solid rgba(232,96,122,0.2)',
                color: '#e8607a',
                textTransform: 'capitalize',
              }}
            >
              {bridge.story_author_type}
            </span>
          </div>
        </div>

        {/* Status chip or action buttons */}
        <div style={{ flexShrink: 0, paddingTop: 4 }}>
          {bridge.status === 'approved' && (
            <div>
              <span
                style={{
                  fontSize: 11,
                  padding: '4px 12px',
                  borderRadius: 9999,
                  background: 'rgba(52,211,153,0.1)',
                  border: '1px solid rgba(52,211,153,0.3)',
                  color: '#34d399',
                }}
              >
                Approved ✓
              </span>
              {bridge.approved_at && (
                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4, textAlign: 'right' }}>
                  {new Date(bridge.approved_at).toLocaleDateString('en-GB')}
                </div>
              )}
              <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2, textAlign: 'right' }}>
                Showing to dreamers
              </div>
            </div>
          )}
          {bridge.status === 'rejected' && (
            <div>
              <span
                style={{
                  fontSize: 11,
                  padding: '4px 12px',
                  borderRadius: 9999,
                  background: 'rgba(232,96,122,0.08)',
                  border: '1px solid rgba(232,96,122,0.3)',
                  color: '#e8607a',
                }}
              >
                Rejected
              </span>
              {bridge.admin_note && (
                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4, maxWidth: 200 }}>
                  {bridge.admin_note}
                </div>
              )}
            </div>
          )}
          {bridge.status === 'pending' && (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => onAction(bridge.id, 'approve')}
                  style={{
                    width: 90,
                    padding: '7px 0',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 500,
                    background: 'rgba(52,211,153,0.1)',
                    border: '1px solid rgba(52,211,153,0.35)',
                    color: '#34d399',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(52,211,153,0.18)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(52,211,153,0.1)'
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => setNoteOpen((v) => !v)}
                  style={{
                    width: 90,
                    padding: '7px 0',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 500,
                    background: 'rgba(232,96,122,0.08)',
                    border: '1px solid rgba(232,96,122,0.3)',
                    color: '#e8607a',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(232,96,122,0.15)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(232,96,122,0.08)'
                  }}
                >
                  Reject
                </button>
              </div>

              {/* Collapsible note + reject confirm */}
              <AnimatePresence>
                {noteOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden', width: '100%', minWidth: 220 }}
                  >
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Optional note to companion…"
                      rows={2}
                      style={{
                        width: '100%',
                        background: '#0d1117',
                        border: '1px solid #1c2333',
                        borderRadius: 10,
                        padding: '10px 12px',
                        fontSize: 12,
                        color: '#eeeef0',
                        outline: 'none',
                        resize: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      onClick={() => {
                        onAction(bridge.id, 'reject', note)
                        setNoteOpen(false)
                      }}
                      style={{
                        marginTop: 6,
                        width: '100%',
                        padding: '7px 0',
                        borderRadius: 10,
                        fontSize: 12,
                        background: 'rgba(239,68,68,0.15)',
                        border: '1px solid rgba(239,68,68,0.35)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      Confirm Reject
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Footer: date */}
      <div style={{ fontSize: 10, color: '#4b5563' }}>
        Submitted{' '}
        {new Date(bridge.created_at).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </div>
    </motion.div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminBridgesPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<Filter>('pending')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery<{ bridges: Bridge[]; total: number; pages: number }>({
    queryKey: ['admin', 'bridges', filter, page],
    queryFn: () => fetch(`/api/admin/bridges?filter=${filter}&page=${page}`).then((r) => r.json()),
    staleTime: 30_000,
  })

  const bridgeMutation = useMutation({
    mutationFn: ({ id, action, admin_note }: { id: string; action: string; admin_note?: string }) =>
      fetch(`/api/admin/bridges/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, admin_note }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bridges'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'counts'] })
    },
  })

  const bridges = data?.bridges ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="px-6 md:px-10 py-8 md:py-10"
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Link2 size={20} color="#e8607a" />
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 24,
              color: '#eeeef0',
              margin: 0,
            }}
          >
            Story Bridge Queue
          </h1>
        </div>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
          Review companion-to-story links before they go live.
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => {
              setFilter(f.key)
              setPage(1)
            }}
            style={{
              fontSize: 12,
              padding: '6px 16px',
              borderRadius: 9999,
              cursor: 'pointer',
              border: `1px solid ${filter === f.key ? '#e8607a' : '#1c2333'}`,
              background: filter === f.key ? 'rgba(232,96,122,0.08)' : 'transparent',
              color: filter === f.key ? '#e8607a' : '#6b7280',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="shimmer"
              style={{ height: 120, borderRadius: 16, background: '#111620' }}
            />
          ))}
        </div>
      ) : bridges.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '56px 24px',
            background: '#111620',
            border: '1px solid #1c2333',
            borderRadius: 16,
          }}
        >
          <Link2 size={28} color="#6b7280" style={{ margin: '0 auto 12px' }} />
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              fontSize: 16,
              color: '#eeeef0',
              marginBottom: 8,
            }}
          >
            No bridges waiting for review.
          </p>
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            Companions can link their profile to stories from their dashboard.
          </p>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          {bridges.map((bridge) => (
            <BridgeCard
              key={bridge.id}
              bridge={bridge}
              onAction={(id, action, note) =>
                bridgeMutation.mutate({ id, action, admin_note: note })
              }
            />
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {(data?.pages ?? 0) > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          {Array.from({ length: data!.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                fontSize: 12,
                cursor: 'pointer',
                border: `1px solid ${p === page ? '#e8607a' : '#1c2333'}`,
                background: p === page ? 'rgba(232,96,122,0.1)' : 'transparent',
                color: p === page ? '#e8607a' : '#6b7280',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
