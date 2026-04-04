'use client'

import { motion, useAnimation } from 'framer-motion'
import { Heart, MessageCircle, Bookmark, Volume2, VolumeX } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useLikeMutation } from '@/hooks/useLikeMutation'
import { useSaveMutation } from '@/hooks/useSaveMutation'

interface Props {
  storyId:      string
  likeCount:    number
  saveCount:    number
  commentCount: number
  userHasLiked: boolean
  userHasSaved: boolean
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function ActionBtn({
  children,
  onTap,
  label,
}: {
  children: React.ReactNode
  onTap: () => void
  label: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onTap}
      className="flex flex-col items-center"
      style={{
        gap:        6,
        minWidth:   48,
        minHeight:  48,
        background: 'transparent',
        border:     'none',
        cursor:     'pointer',
        padding:    '2px 0',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  )
}

export function ActionPill({
  storyId, likeCount, saveCount, commentCount, userHasLiked, userHasSaved,
}: Props) {
  const { openComments, toggleMute, isMuted } = useUIStore()
  const muted        = isMuted(storyId)
  const likeAnim     = useAnimation()
  const saveAnim     = useAnimation()
  const likeMutation = useLikeMutation()
  const saveMutation = useSaveMutation()

  const springTap = { scale: [1, 1.35, 0.9, 1] as number[], transition: { type: 'spring' as const, stiffness: 400, damping: 12 } }

  const handleLike = () => {
    likeAnim.start(springTap)
    likeMutation.mutate({ storyId, currentlyLiked: userHasLiked })
  }
  const handleSave = () => {
    saveAnim.start(springTap)
    saveMutation.mutate({ storyId, currentlySaved: userHasSaved })
  }

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ right: 12, bottom: 120, zIndex: 20, gap: 24 }}
    >
      {/* Like */}
      <ActionBtn onTap={handleLike} label="Like">
        <motion.div animate={likeAnim}>
          <Heart
            size={26}
            strokeWidth={1.8}
            style={{
              color: userHasLiked ? '#e8607a' : '#eeeef0',
              fill:  userHasLiked ? '#e8607a' : 'none',
            }}
          />
        </motion.div>
        <span
          className="font-semibold drop-shadow-sm"
          style={{ fontSize: 12, color: '#eeeef0' }}
        >
          {fmt(likeCount)}
        </span>
      </ActionBtn>

      {/* Comment */}
      <ActionBtn onTap={() => openComments(storyId)} label="Comments">
        <MessageCircle size={26} strokeWidth={1.8} style={{ color: '#eeeef0' }} />
        <span
          className="font-semibold drop-shadow-sm"
          style={{ fontSize: 12, color: '#eeeef0' }}
        >
          {fmt(commentCount)}
        </span>
      </ActionBtn>

      {/* Save */}
      <ActionBtn onTap={handleSave} label="Save">
        <motion.div animate={saveAnim}>
          <Bookmark
            size={26}
            strokeWidth={1.8}
            style={{
              color: userHasSaved ? '#c9a96e' : '#eeeef0',
              fill:  userHasSaved ? '#c9a96e' : 'none',
            }}
          />
        </motion.div>
        <span
          className="font-semibold drop-shadow-sm"
          style={{ fontSize: 12, color: '#eeeef0' }}
        >
          {fmt(saveCount)}
        </span>
      </ActionBtn>

      {/* Mute toggle (Phase 2 audio placeholder) */}
      <ActionBtn onTap={() => toggleMute(storyId)} label={muted ? 'Unmute' : 'Mute'}>
        {muted
          ? <VolumeX size={26} strokeWidth={1.8} style={{ color: '#eeeef0' }} />
          : <Volume2 size={26} strokeWidth={1.8} style={{ color: '#eeeef0' }} />
        }
      </ActionBtn>
    </div>
  )
}
