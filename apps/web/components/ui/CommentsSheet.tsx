'use client'

import { useState, useRef } from 'react'
import { Drawer } from 'vaul'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Send, X, Heart, Pencil, Trash2, Copy } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommentData {
  id: string
  body: string
  is_anonymous: boolean
  like_count: number
  created_at: string | null
  user_id: string
  parent_id: string | null
  author_alias: string | null
  user_has_liked: boolean
  replies: CommentData[]
}

interface Props {
  storyId: string | null
  onClose: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

// ─── CommentItem ──────────────────────────────────────────────────────────────

function CommentItem({
  comment,
  storyId,
  currentUserId,
  onReply,
  depth = 0,
}: {
  comment: CommentData
  storyId: string
  currentUserId: string
  onReply: (id: string, alias: string) => void
  depth?: number
}) {
  const queryClient = useQueryClient()
  const [liked, setLiked] = useState(comment.user_has_liked)
  const [likeCount, setLikeCount] = useState(comment.like_count)
  const [actionOpen, setActionOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editBody, setEditBody] = useState(comment.body)
  const [body, setBody] = useState(comment.body)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isOwner = comment.user_id === currentUserId

  const handleLike = async () => {
    const next = !liked
    setLiked(next)
    setLikeCount((c) => c + (next ? 1 : -1))
    try {
      const res = await fetch(`/api/stories/${storyId}/comments/${comment.id}/like`, {
        method: next ? 'POST' : 'DELETE',
      })
      if (res.ok) {
        const { likeCount: serverCount } = await res.json()
        setLikeCount(serverCount)
      } else {
        // revert on API error
        setLiked(!next)
        setLikeCount((c) => c + (next ? -1 : 1))
      }
    } catch {
      setLiked(!next)
      setLikeCount((c) => c + (next ? -1 : 1))
    }
  }

  async function handleSaveEdit() {
    const trimmed = editBody.trim()
    if (!trimmed || trimmed === body) {
      setEditMode(false)
      return
    }
    const prev = body
    setBody(trimmed)
    setEditMode(false)
    try {
      await fetch(`/api/stories/${storyId}/comments/${comment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: trimmed }),
      })
      queryClient.invalidateQueries({ queryKey: ['comments', storyId] })
    } catch {
      setBody(prev)
    }
  }

  async function handleDelete() {
    setActionOpen(false)
    queryClient.setQueryData<{ comments: CommentData[] }>(['comments', storyId], (old) => {
      if (!old) return old
      return {
        comments: old.comments
          .filter((c) => c.id !== comment.id)
          .map((c) => ({ ...c, replies: c.replies?.filter((r) => r.id !== comment.id) ?? [] })),
      }
    })
    await fetch(`/api/stories/${storyId}/comments/${comment.id}`, { method: 'DELETE' })
  }

  return (
    <div style={{ paddingLeft: depth > 0 ? 20 : 0 }}>
      <div
        className="flex items-start justify-between gap-3 py-3"
        onTouchStart={() => {
          longPressTimer.current = setTimeout(() => setActionOpen(true), 600)
        }}
        onTouchEnd={() => {
          if (longPressTimer.current) clearTimeout(longPressTimer.current)
        }}
        onTouchMove={() => {
          if (longPressTimer.current) clearTimeout(longPressTimer.current)
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          setActionOpen(true)
        }}
      >
        <div className="flex-1 min-w-0">
          <span style={{ fontSize: 12, color: '#e8607a', fontWeight: 500 }}>
            {comment.author_alias ?? 'anonymous'}
          </span>

          {editMode ? (
            <>
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                autoFocus
                rows={3}
                style={{
                  width: '100%',
                  background: '#161d2a',
                  border: '1px solid #e8607a',
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontSize: 13,
                  color: '#eeeef0',
                  caretColor: '#e8607a',
                  resize: 'none',
                  outline: 'none',
                  lineHeight: 1.6,
                  marginTop: 4,
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  style={{
                    fontSize: 12,
                    color: 'white',
                    background: '#e8607a',
                    border: 'none',
                    borderRadius: 999,
                    padding: '5px 14px',
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false)
                    setEditBody(body)
                  }}
                  style={{
                    fontSize: 12,
                    color: '#6b7280',
                    background: 'none',
                    border: '1px solid #1c2333',
                    borderRadius: 999,
                    padding: '5px 14px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, color: '#eeeef0', lineHeight: 1.65, marginTop: 4 }}>{body}</p>
          )}

          <div className="flex items-center gap-3 mt-1">
            <span style={{ fontSize: 10, color: '#4b5563' }}>{timeAgo(comment.created_at)}</span>
            {depth === 0 && (
              <button
                type="button"
                onClick={() => onReply(comment.id, comment.author_alias ?? 'anonymous')}
                style={{
                  fontSize: 11,
                  color: '#6b7280',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Reply
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleLike}
          className="flex flex-col items-center flex-shrink-0"
          style={{
            minWidth: 32,
            minHeight: 32,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            gap: 3,
          }}
        >
          <Heart
            size={14}
            strokeWidth={1.8}
            style={{ color: liked ? '#e8607a' : '#6b7280', fill: liked ? '#e8607a' : 'none' }}
          />
          {likeCount > 0 && <span style={{ fontSize: 10, color: '#6b7280' }}>{likeCount}</span>}
        </button>
      </div>

      {/* Action sheet — backdrop + bottom sheet */}
      {actionOpen && (
        <>
          <div
            onClick={() => setActionOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 960,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(4px)',
            }}
          />
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 970,
              background: '#0d1117',
              borderTop: '1px solid #1c2333',
              borderRadius: '20px 20px 0 0',
              paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
            }}
          >
            {/* Handle bar */}
            <div
              style={{
                width: 32,
                height: 4,
                borderRadius: 999,
                background: '#1c2333',
                margin: '12px auto 4px',
              }}
            />

            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActionOpen(false)
                    setEditMode(true)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    width: '100%',
                    height: 52,
                    padding: '0 24px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 15,
                    color: '#eeeef0',
                  }}
                >
                  <Pencil size={18} color="#6b7280" /> Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    width: '100%',
                    height: 52,
                    padding: '0 24px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 15,
                    color: '#e8607a',
                  }}
                >
                  <Trash2 size={18} color="#e8607a" /> Delete
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(body)
                setActionOpen(false)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                width: '100%',
                height: 52,
                padding: '0 24px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 15,
                color: '#eeeef0',
              }}
            >
              <Copy size={18} color="#6b7280" /> Copy
            </button>

            <div style={{ height: 1, background: '#1c2333', margin: '4px 0' }} />

            <button
              type="button"
              onClick={() => setActionOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: 52,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 15,
                color: '#6b7280',
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {comment.replies?.map((r) => (
        <CommentItem
          key={r.id}
          comment={r}
          storyId={storyId}
          currentUserId={currentUserId}
          onReply={onReply}
          depth={1}
        />
      ))}
    </div>
  )
}

// ─── CommentsSheet ────────────────────────────────────────────────────────────

export function CommentsSheet({ storyId, onClose }: Props) {
  const BOTTOM_NAV_OFFSET = 52
  const [inputValue, setInputValue] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; alias: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const currentUserId = session?.user?.id ?? ''

  const { data, isLoading } = useQuery<{ comments: CommentData[] }>({
    queryKey: ['comments', storyId],
    queryFn: async () => {
      const res = await fetch(`/api/stories/${storyId}/comments`)
      if (!res.ok) throw new Error('Failed to load comments')
      return res.json()
    },
    enabled: !!storyId,
    staleTime: 30_000,
  })

  const handleSend = async () => {
    if (!inputValue.trim() || !storyId || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/stories/${storyId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: inputValue.trim(), parentId: replyTo?.id }),
      })
      if (res.ok) {
        const { comment } = (await res.json()) as { comment: CommentData }
        queryClient.setQueryData<{ comments: CommentData[] }>(['comments', storyId], (old) => {
          if (!old) return { comments: [comment] }
          if (replyTo) {
            return {
              comments: old.comments.map((c) =>
                c.id === replyTo.id ? { ...c, replies: [...(c.replies ?? []), comment] } : c
              ),
            }
          }
          return { comments: [comment, ...old.comments] }
        })
        setInputValue('')
        setReplyTo(null)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const commentList = data?.comments ?? []
  const open = storyId !== null

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
      shouldScaleBackground={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 z-[80]"
          style={{ background: 'rgba(0,0,0,0.65)', bottom: BOTTOM_NAV_OFFSET }}
        />
        <Drawer.Content
          className="flex flex-col fixed bottom-0 left-0 right-0 z-[90] outline-none"
          style={{
            bottom: BOTTOM_NAV_OFFSET,
            background: '#0d1117',
            borderTop: '1px solid #1c2333',
            borderRadius: '20px 20px 0 0',
            maxHeight: '85vh',
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
          }}
        >
          <Drawer.Title className="sr-only">Comments</Drawer.Title>
          <Drawer.Description className="sr-only">
            Read comments and add your comment for this confession.
          </Drawer.Description>

          {/* Handle bar */}
          <div
            className="mx-auto mt-3 rounded-full flex-shrink-0"
            style={{ width: 32, height: 4, background: '#1c2333' }}
          />

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#eeeef0' }}>
              {commentList.length} {commentList.length === 1 ? 'comment' : 'comments'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center rounded-full transition-colors duration-150"
              style={{
                width: 28,
                height: 28,
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280',
              }}
            >
              <X size={14} />
            </button>
          </div>
          <div style={{ height: 1, background: '#1c2333' }} />

          {/* Comment list */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain px-4"
            data-vaul-no-drag
            style={{ minHeight: 0 }}
          >
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div
                  className="rounded-full border-2 animate-spin"
                  style={{
                    width: 24,
                    height: 24,
                    borderColor: '#1c2333',
                    borderTopColor: '#e8607a',
                  }}
                />
              </div>
            ) : commentList.length === 0 ? (
              <p
                className="text-center py-12"
                style={{ fontSize: 13, color: '#4b5563', fontStyle: 'italic' }}
              >
                Be the first to confess a reaction.
              </p>
            ) : (
              commentList.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  storyId={storyId!}
                  currentUserId={currentUserId}
                  onReply={(id, alias) => {
                    setReplyTo({ id, alias })
                    setTimeout(() => inputRef.current?.focus(), 50)
                  }}
                />
              ))
            )}
          </div>

          {/* Reply banner */}
          {replyTo && (
            <div
              className="flex items-center justify-between px-4 py-2"
              style={{ background: '#161d2a', borderTop: '1px solid #1c2333' }}
            >
              <span style={{ fontSize: 12, color: '#6b7280' }}>Replying to {replyTo.alias}</span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                style={{
                  fontSize: 11,
                  color: '#e8607a',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Input row */}
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ borderTop: '1px solid #1c2333' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Write something..."
              className="flex-1 outline-none transition-colors duration-200"
              style={{
                background: '#161d2a',
                border: '1px solid #1c2333',
                borderRadius: 9999,
                padding: '10px 16px',
                fontSize: 13,
                color: '#eeeef0',
                caretColor: '#e8607a',
              }}
              onFocus={(e) => {
                ;(e.target as HTMLInputElement).style.borderColor = '#e8607a'
              }}
              onBlur={(e) => {
                ;(e.target as HTMLInputElement).style.borderColor = '#1c2333'
              }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputValue.trim() || submitting}
              className="flex items-center justify-center rounded-full flex-shrink-0 transition-opacity duration-150"
              style={{
                width: 36,
                height: 36,
                background: '#e8607a',
                border: 'none',
                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                opacity: inputValue.trim() ? 1 : 0.35,
              }}
            >
              <Send size={16} color="white" />
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
