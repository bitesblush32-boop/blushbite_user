'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Check, X } from 'lucide-react'
import { ConfirmModal } from '../_components/AdminUtils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FantasyCategory {
  id: number
  name: string
  slug: string
  description: string | null
  sort_order: number
  is_active: boolean
  tag_count: number
}
interface FantasyTag {
  id: number
  category_id: number
  category_name: string | null
  name: string
  slug: string
  description: string | null
  is_active: boolean
  usage_count: number
}
interface VibeTag {
  id: number
  name: string
  slug: string
  emoji: string | null
  is_active: boolean
  usage_count: number
}
interface MoodTag {
  id: number
  name: string
  slug: string
  emoji: string | null
  is_active: boolean
  usage_count: number
}
interface OrientationTag {
  id: number
  name: string
  slug: string
  is_active: boolean
  usage_count: number
}
interface StoryCategory {
  id: number
  name: string
  slug: string
  description: string | null
  sort_order: number
  is_active: boolean
  story_count: number
}
interface TagsData {
  fantasy_categories: FantasyCategory[]
  fantasy_tags: FantasyTag[]
  vibe_tags: VibeTag[]
  mood_tags: MoodTag[]
  orientation_tags: OrientationTag[]
  story_categories: StoryCategory[]
}

type SectionKey =
  | 'fantasy_categories'
  | 'fantasy_tags'
  | 'vibe_tags'
  | 'mood_tags'
  | 'orientation_tags'
  | 'story_categories'
type TableKey =
  | 'fantasy_category'
  | 'fantasy_tag'
  | 'vibe_tag'
  | 'mood_tag'
  | 'orientation_tag'
  | 'story_category'

const SECTIONS: {
  key: SectionKey
  table: TableKey
  label: string
  hasEmoji: boolean
  hasDescription: boolean
  hasSortOrder: boolean
  hasCategory: boolean
}[] = [
  {
    key: 'fantasy_categories',
    table: 'fantasy_category',
    label: 'Fantasy Categories',
    hasEmoji: false,
    hasDescription: true,
    hasSortOrder: true,
    hasCategory: false,
  },
  {
    key: 'fantasy_tags',
    table: 'fantasy_tag',
    label: 'Fantasy Tags',
    hasEmoji: false,
    hasDescription: true,
    hasSortOrder: false,
    hasCategory: true,
  },
  {
    key: 'vibe_tags',
    table: 'vibe_tag',
    label: 'Vibe Tags',
    hasEmoji: true,
    hasDescription: false,
    hasSortOrder: false,
    hasCategory: false,
  },
  {
    key: 'mood_tags',
    table: 'mood_tag',
    label: 'Mood Tags',
    hasEmoji: true,
    hasDescription: false,
    hasSortOrder: false,
    hasCategory: false,
  },
  {
    key: 'orientation_tags',
    table: 'orientation_tag',
    label: 'Orientation Tags',
    hasEmoji: false,
    hasDescription: false,
    hasSortOrder: false,
    hasCategory: false,
  },
  {
    key: 'story_categories',
    table: 'story_category',
    label: 'Story Categories',
    hasEmoji: false,
    hasDescription: true,
    hasSortOrder: true,
    hasCategory: false,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function singularize(label: string): string {
  if (label.endsWith('ies')) return label.slice(0, -3) + 'y'
  if (label.endsWith('ses')) return label.slice(0, -2)
  if (label.endsWith('s')) return label.slice(0, -1)
  return label
}

// ─── Inline edit row ──────────────────────────────────────────────────────────

function EditRow({
  item,
  table,
  hasEmoji,
  hasDescription,
  hasSortOrder,
  categories,
  onSave,
  onCancel,
}: {
  item: Record<string, unknown>
  table: TableKey
  hasEmoji: boolean
  hasDescription: boolean
  hasSortOrder: boolean
  categories?: FantasyCategory[]
  onSave: (fields: Record<string, unknown>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(String(item.name ?? ''))
  const [emoji, setEmoji] = useState(String(item.emoji ?? ''))
  const [description, setDescription] = useState(String(item.description ?? ''))
  const [sortOrder, setSortOrder] = useState(Number(item.sort_order ?? 0))

  return (
    <tr style={{ background: 'rgba(232,96,122,0.04)' }}>
      <td className="px-4 py-3" colSpan={6}>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                fontSize: 13,
                color: '#eeeef0',
                background: '#161d2a',
                border: '1px solid #1c2333',
                borderRadius: 6,
                padding: '6px 10px',
                width: 200,
              }}
            />
          </div>
          {hasEmoji && (
            <div>
              <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>
                Emoji
              </label>
              <input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                style={{
                  fontSize: 13,
                  color: '#eeeef0',
                  background: '#161d2a',
                  border: '1px solid #1c2333',
                  borderRadius: 6,
                  padding: '6px 10px',
                  width: 60,
                }}
              />
            </div>
          )}
          {hasDescription && (
            <div>
              <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>
                Description
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  fontSize: 13,
                  color: '#eeeef0',
                  background: '#161d2a',
                  border: '1px solid #1c2333',
                  borderRadius: 6,
                  padding: '6px 10px',
                  width: 260,
                }}
              />
            </div>
          )}
          {hasSortOrder && (
            <div>
              <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>
                Order
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                style={{
                  fontSize: 13,
                  color: '#eeeef0',
                  background: '#161d2a',
                  border: '1px solid #1c2333',
                  borderRadius: 6,
                  padding: '6px 10px',
                  width: 70,
                }}
              />
            </div>
          )}
          <div className="flex items-end gap-2">
            <button
              onClick={() =>
                onSave({
                  name: name.trim(),
                  emoji: emoji || undefined,
                  description: description || undefined,
                  sort_order: hasSortOrder ? sortOrder : undefined,
                })
              }
              style={{
                background: '#e8607a',
                border: 'none',
                borderRadius: 6,
                padding: '7px 14px',
                fontSize: 12,
                color: '#fff',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Check size={12} /> Save
            </button>
            <button
              onClick={onCancel}
              style={{
                background: 'transparent',
                border: '1px solid #1c2333',
                borderRadius: 6,
                padding: '7px 14px',
                fontSize: 12,
                color: '#6b7280',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      </td>
    </tr>
  )
}

// ─── Create row ───────────────────────────────────────────────────────────────

function CreateRow({
  table,
  hasEmoji,
  hasDescription,
  hasSortOrder,
  hasCategory,
  categories,
  onSave,
  onCancel,
}: {
  table: TableKey
  hasEmoji: boolean
  hasDescription: boolean
  hasSortOrder: boolean
  hasCategory: boolean
  categories?: FantasyCategory[]
  onSave: (fields: Record<string, unknown>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [description, setDescription] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [categoryId, setCategoryId] = useState<number | ''>(categories?.[0]?.id ?? '')

  return (
    <tr style={{ background: 'rgba(232,96,122,0.04)', border: '1px solid rgba(232,96,122,0.15)' }}>
      <td className="px-4 py-3" colSpan={6}>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label style={{ fontSize: 11, color: '#e8607a', display: 'block', marginBottom: 4 }}>
              Name *
            </label>
            <input
              placeholder="Tag name…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                fontSize: 13,
                color: '#eeeef0',
                background: '#161d2a',
                border: '1px solid rgba(232,96,122,0.3)',
                borderRadius: 6,
                padding: '6px 10px',
                width: 200,
              }}
            />
          </div>
          {hasCategory && categories && (
            <div>
              <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                style={{
                  fontSize: 13,
                  color: '#eeeef0',
                  background: '#161d2a',
                  border: '1px solid #1c2333',
                  borderRadius: 6,
                  padding: '6px 10px',
                  width: 180,
                }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {hasEmoji && (
            <div>
              <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>
                Emoji
              </label>
              <input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                style={{
                  fontSize: 13,
                  color: '#eeeef0',
                  background: '#161d2a',
                  border: '1px solid #1c2333',
                  borderRadius: 6,
                  padding: '6px 10px',
                  width: 60,
                }}
              />
            </div>
          )}
          {hasDescription && (
            <div>
              <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>
                Description
              </label>
              <input
                placeholder="Optional…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  fontSize: 13,
                  color: '#eeeef0',
                  background: '#161d2a',
                  border: '1px solid #1c2333',
                  borderRadius: 6,
                  padding: '6px 10px',
                  width: 260,
                }}
              />
            </div>
          )}
          {hasSortOrder && (
            <div>
              <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>
                Order
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                style={{
                  fontSize: 13,
                  color: '#eeeef0',
                  background: '#161d2a',
                  border: '1px solid #1c2333',
                  borderRadius: 6,
                  padding: '6px 10px',
                  width: 70,
                }}
              />
            </div>
          )}
          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                if (!name.trim()) return
                onSave({
                  name: name.trim(),
                  emoji: emoji || undefined,
                  description: description || undefined,
                  sort_order: hasSortOrder ? sortOrder : undefined,
                  category_id: hasCategory ? categoryId || undefined : undefined,
                })
              }}
              style={{
                background: '#e8607a',
                border: 'none',
                borderRadius: 6,
                padding: '7px 14px',
                fontSize: 12,
                color: '#fff',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Plus size={12} /> Create
            </button>
            <button
              onClick={onCancel}
              style={{
                background: 'transparent',
                border: '1px solid #1c2333',
                borderRadius: 6,
                padding: '7px 14px',
                fontSize: 12,
                color: '#6b7280',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      </td>
    </tr>
  )
}

// ─── TagTable ─────────────────────────────────────────────────────────────────

function TagTable({
  sectionKey,
  table,
  rows,
  hasEmoji,
  hasDescription,
  hasSortOrder,
  hasCategory,
  categories,
  onToggle,
  onUpdate,
  onDelete,
  onCreate,
}: {
  sectionKey: SectionKey
  table: TableKey
  rows: Record<string, unknown>[]
  hasEmoji: boolean
  hasDescription: boolean
  hasSortOrder: boolean
  hasCategory: boolean
  categories?: FantasyCategory[]
  onToggle: (id: number) => void
  onUpdate: (id: number, fields: Record<string, unknown>) => void
  onDelete: (id: number) => void
  onCreate: (fields: Record<string, unknown>) => void
}) {
  const [editId, setEditId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)

  const usageKey =
    sectionKey === 'fantasy_categories'
      ? 'tag_count'
      : sectionKey === 'story_categories'
        ? 'story_count'
        : 'usage_count'

  return (
    <>
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete tag"
        body={`Delete "${deleteTarget?.name}"? This cannot be undone. Tags with any usage cannot be deleted.`}
        confirmLabel="Delete"
        confirmColor="#f87171"
        onConfirm={() => {
          if (deleteTarget) {
            onDelete(deleteTarget.id)
            setDeleteTarget(null)
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="overflow-x-auto rounded-[12px]" style={{ border: '1px solid #1c2333' }}>
        <table className="w-full border-collapse" style={{ minWidth: 600 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1c2333' }}>
              <th
                style={{
                  fontSize: 11,
                  color: '#6b7280',
                  textAlign: 'left',
                  padding: '10px 16px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                }}
              >
                Name
              </th>
              {hasEmoji && (
                <th
                  style={{
                    fontSize: 11,
                    color: '#6b7280',
                    textAlign: 'left',
                    padding: '10px 16px',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    fontWeight: 500,
                  }}
                >
                  Emoji
                </th>
              )}
              {hasCategory && (
                <th
                  style={{
                    fontSize: 11,
                    color: '#6b7280',
                    textAlign: 'left',
                    padding: '10px 16px',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    fontWeight: 500,
                  }}
                >
                  Category
                </th>
              )}
              {hasSortOrder && (
                <th
                  style={{
                    fontSize: 11,
                    color: '#6b7280',
                    textAlign: 'left',
                    padding: '10px 16px',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    fontWeight: 500,
                  }}
                >
                  Order
                </th>
              )}
              <th
                style={{
                  fontSize: 11,
                  color: '#6b7280',
                  textAlign: 'right',
                  padding: '10px 16px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                }}
              >
                Usage
              </th>
              <th
                style={{
                  fontSize: 11,
                  color: '#6b7280',
                  textAlign: 'right',
                  padding: '10px 16px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                }}
              >
                Status
              </th>
              <th
                style={{
                  fontSize: 11,
                  color: '#6b7280',
                  textAlign: 'right',
                  padding: '10px 16px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const id = row.id as number
              if (editId === id) {
                return (
                  <EditRow
                    key={id}
                    item={row}
                    table={table}
                    hasEmoji={hasEmoji}
                    hasDescription={hasDescription}
                    hasSortOrder={hasSortOrder}
                    categories={categories}
                    onSave={(fields) => {
                      onUpdate(id, fields)
                      setEditId(null)
                    }}
                    onCancel={() => setEditId(null)}
                  />
                )
              }
              return (
                <tr
                  key={id}
                  style={{
                    borderBottom: idx < rows.length - 1 ? '1px solid #1c2333' : 'none',
                    opacity: row.is_active ? 1 : 0.45,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 13, color: '#eeeef0', fontWeight: 500 }}>
                        {String(row.name)}
                      </span>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>{String(row.slug)}</span>
                    </div>
                    {row.description ? (
                      <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                        {String(row.description)}
                      </p>
                    ) : null}
                  </td>
                  {hasEmoji && (
                    <td className="px-4 py-3">
                      <span style={{ fontSize: 18 }}>{String(row.emoji ?? '')}</span>
                    </td>
                  )}
                  {hasCategory && (
                    <td className="px-4 py-3">
                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                        {String(row.category_name ?? '—')}
                      </span>
                    </td>
                  )}
                  {hasSortOrder && (
                    <td className="px-4 py-3">
                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                        {String(row.sort_order ?? 0)}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3 text-right">
                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                      {String((row as any)[usageKey] ?? (row as any).usage_count ?? 0)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onToggle(id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                      }}
                    >
                      {row.is_active ? (
                        <ToggleRight size={18} color="#4ade80" />
                      ) : (
                        <ToggleLeft size={18} color="#6b7280" />
                      )}
                      <span style={{ color: row.is_active ? '#4ade80' : '#6b7280' }}>
                        {row.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setEditId(id)}
                        title="Edit"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid #1c2333',
                          borderRadius: 6,
                          padding: '5px 8px',
                          cursor: 'pointer',
                          color: '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        onMouseEnter={(e) => {
                          ;(e.currentTarget as HTMLElement).style.color = '#eeeef0'
                        }}
                        onMouseLeave={(e) => {
                          ;(e.currentTarget as HTMLElement).style.color = '#6b7280'
                        }}
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id, name: String(row.name) })}
                        title="Delete"
                        style={{
                          background: 'rgba(248,113,113,0.06)',
                          border: '1px solid rgba(248,113,113,0.2)',
                          borderRadius: 6,
                          padding: '5px 8px',
                          cursor: 'pointer',
                          color: '#f87171',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        onMouseEnter={(e) => {
                          ;(e.currentTarget as HTMLElement).style.background =
                            'rgba(248,113,113,0.14)'
                        }}
                        onMouseLeave={(e) => {
                          ;(e.currentTarget as HTMLElement).style.background =
                            'rgba(248,113,113,0.06)'
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {creating && (
              <CreateRow
                table={table}
                hasEmoji={hasEmoji}
                hasDescription={hasDescription}
                hasSortOrder={hasSortOrder}
                hasCategory={hasCategory}
                categories={categories}
                onSave={(fields) => {
                  onCreate(fields)
                  setCreating(false)
                }}
                onCancel={() => setCreating(false)}
              />
            )}
          </tbody>
        </table>
      </div>

      {!creating && (
        <button
          onClick={() => setCreating(true)}
          className="mt-3 flex items-center gap-2 transition-all duration-150"
          style={{
            background: 'transparent',
            border: '1px dashed rgba(232,96,122,0.3)',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 12,
            color: '#e8607a',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLElement).style.background = 'rgba(232,96,122,0.06)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.background = 'transparent'
          }}
        >
          <Plus size={13} /> Add{' '}
          {singularize(SECTIONS.find((s) => s.key === sectionKey)?.label ?? '')}
        </button>
      )}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}
const listItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as any } },
}

export default function AdminTagsPage() {
  const queryClient = useQueryClient()
  const [activeSection, setActiveSection] = useState<SectionKey>('fantasy_categories')

  const { data: tagsRes, isLoading } = useQuery<{ data: TagsData }>({
    queryKey: ['admin', 'tags'],
    queryFn: () => fetch('/api/admin/tags').then((r) => r.json()),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const patchMutation = useMutation<
    void,
    Error,
    {
      id: number
      table: TableKey
      action: 'toggle_active' | 'update'
      fields?: Record<string, unknown>
    }
  >({
    mutationFn: ({ id, table, action, fields }) =>
      fetch(`/api/admin/tags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, action, ...fields }),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] }),
  })

  const deleteMutation = useMutation<void, Error, { id: number; table: TableKey }>({
    mutationFn: ({ id, table }) =>
      fetch(`/api/admin/tags/${id}?table=${table}`, { method: 'DELETE' }).then(async (r) => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error ?? 'Delete failed')
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] }),
    onError: (err) => alert(err.message),
  })

  const createMutation = useMutation<
    void,
    Error,
    { table: TableKey; fields: Record<string, unknown> }
  >({
    mutationFn: ({ table, fields }) =>
      fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, ...fields }),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] }),
  })

  const d = tagsRes?.data
  const section = SECTIONS.find((s) => s.key === activeSection)!

  const rows: Record<string, unknown>[] = d ? ((d[activeSection] as any[]) ?? []) : []

  // Count for each tab
  const counts: Record<SectionKey, number> = {
    fantasy_categories: d?.fantasy_categories.length ?? 0,
    fantasy_tags: d?.fantasy_tags.length ?? 0,
    vibe_tags: d?.vibe_tags.length ?? 0,
    mood_tags: d?.mood_tags.length ?? 0,
    orientation_tags: d?.orientation_tags.length ?? 0,
    story_categories: d?.story_categories.length ?? 0,
  }

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

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 26,
              color: '#eeeef0',
              marginBottom: 4,
            }}
          >
            Tag Library
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            Manage all taxonomy tags — fantasy, vibe, mood, orientation, and story categories.
          </p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {SECTIONS.map((s) => {
          const active = activeSection === s.key
          return (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className="transition-all duration-150"
              style={{
                fontSize: 12,
                padding: '6px 14px',
                borderRadius: 99,
                border: active ? '1px solid rgba(232,96,122,0.4)' : '1px solid #1c2333',
                color: active ? '#e8607a' : '#6b7280',
                background: active ? 'rgba(232,96,122,0.08)' : 'transparent',
                cursor: 'pointer',
                fontWeight: active ? 500 : 400,
              }}
            >
              {s.label}
              {counts[s.key] > 0 && (
                <span
                  style={{ marginLeft: 6, fontSize: 10, color: active ? '#e8607a' : '#6b7280' }}
                >
                  {counts[s.key]}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-3"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              variants={listItem}
              className="h-[52px] rounded-[10px] animate-pulse"
              style={{ background: '#111620' }}
            />
          ))}
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <TagTable
              sectionKey={activeSection}
              table={section.table}
              rows={rows}
              hasEmoji={section.hasEmoji}
              hasDescription={section.hasDescription}
              hasSortOrder={section.hasSortOrder}
              hasCategory={section.hasCategory}
              categories={d?.fantasy_categories}
              onToggle={(id) =>
                patchMutation.mutate({ id, table: section.table, action: 'toggle_active' })
              }
              onUpdate={(id, fields) =>
                patchMutation.mutate({ id, table: section.table, action: 'update', fields })
              }
              onDelete={(id) => deleteMutation.mutate({ id, table: section.table })}
              onCreate={(fields) => createMutation.mutate({ table: section.table, fields })}
            />
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  )
}
