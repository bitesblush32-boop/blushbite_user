'use client'

import { useState } from 'react'
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
  layout?:      'vertical' | 'horizontal'
  // Optional overrides — pass these when the feed uses a different mutation cache
  // (e.g. StoryFeedCard uses useStoryLikeMutation / useStorySaveMutation)
  onLike?:      () => void
  onSave?:      () => void
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
  horizontal,
}: {
  children:    React.ReactNode
  onTap:       () => void
  label:       string
  horizontal?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onTap}
      className="flex flex-col items-center"
      style={{
        gap:        horizontal ? 4 : 6,
        minWidth:   horizontal ? 44 : 48,
        minHeight:  horizontal ? 44 : 48,
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
  layout = 'vertical', onLike, onSave,
}: Props) {
  const { openComments, toggleMute, isMuted } = useUIStore()
  const muted        = isMuted(storyId)
  const likeAnim     = useAnimation()
  const saveAnim     = useAnimation()
  // Fallback mutations — used when no override is passed (confessions feed)
  const likeMutation = useLikeMutation()
  const saveMutation = useSaveMutation()

  // Phase 2 audio stub — local state for horizontal layout
  const [audioOn, setAudioOn] = useState(true)

  const springTap = { scale: [1, 1.35, 0.9, 1] as number[], transition: { type: 'spring' as const, stiffness: 400, damping: 12 } }

  const handleLike = () => {
    likeAnim.start(springTap)
    if (onLike) {
      onLike()
    } else {
      likeMutation.mutate({ storyId, currentlyLiked: userHasLiked })
    }
  }
  const handleSave = () => {
    saveAnim.start(springTap)
    if (onSave) {
      onSave()
    } else {
      saveMutation.mutate({ storyId, currentlySaved: userHasSaved })
    }
  }
  const handleOpenComments = () => {
    // Prevent focused background control from remaining active while dialog applies aria-hidden.
    if (typeof document !== 'undefined') {
      const active = document.activeElement
      if (active instanceof HTMLElement) active.blur()
    }
    openComments(storyId)
  }

  const iconSize  = layout === 'horizontal' ? 22 : 26
  const countStyle: React.CSSProperties = layout === 'horizontal'
    ? { fontSize: 11, color: '#9ca3af' }
    : { fontSize: 12, color: '#eeeef0' }

  const isHorizontal = layout === 'horizontal'

  const buttons = (
    <>
      {/* Like */}
      <ActionBtn onTap={handleLike} label="Like" horizontal={isHorizontal}>
        <motion.div animate={likeAnim}>
          <Heart
            size={iconSize}
            strokeWidth={1.8}
            style={{
              color: userHasLiked ? '#e8607a' : '#eeeef0',
              fill:  userHasLiked ? '#e8607a' : 'none',
            }}
          />
        </motion.div>
        <span className="font-semibold drop-shadow-sm" style={countStyle}>
          {fmt(likeCount)}
        </span>
      </ActionBtn>

      {/* Comment */}
      <ActionBtn onTap={handleOpenComments} label="Comments" horizontal={isHorizontal}>
        <MessageCircle size={iconSize} strokeWidth={1.8} style={{ color: '#eeeef0' }} />
        <span className="font-semibold drop-shadow-sm" style={countStyle}>
          {fmt(commentCount)}
        </span>
      </ActionBtn>

      {/* Save */}
      <ActionBtn onTap={handleSave} label="Save" horizontal={isHorizontal}>
        <motion.div animate={saveAnim}>
          <Bookmark
            size={iconSize}
            strokeWidth={1.8}
            style={{
              color: userHasSaved ? '#c9a96e' : '#eeeef0',
              fill:  userHasSaved ? '#c9a96e' : 'none',
            }}
          />
        </motion.div>
        <span className="font-semibold drop-shadow-sm" style={countStyle}>
          {fmt(saveCount)}
        </span>
      </ActionBtn>

      {/* Mute / audio toggle */}
      {isHorizontal ? (
        <ActionBtn onTap={() => setAudioOn(v => !v)} label={audioOn ? 'Mute' : 'Unmute'} horizontal>
          {audioOn
            ? <Volume2 size={iconSize} strokeWidth={1.8} style={{ color: '#eeeef0' }} />
            : <VolumeX size={iconSize} strokeWidth={1.8} style={{ color: '#eeeef0' }} />
          }
        </ActionBtn>
      ) : (
        <ActionBtn onTap={() => toggleMute(storyId)} label={muted ? 'Unmute' : 'Mute'}>
          {muted
            ? <VolumeX size={iconSize} strokeWidth={1.8} style={{ color: '#eeeef0' }} />
            : <Volume2 size={iconSize} strokeWidth={1.8} style={{ color: '#eeeef0' }} />
          }
        </ActionBtn>
      )}
    </>
  )

  if (isHorizontal) {
    return (
      <div
        style={{
          display:        'flex',
          flexDirection:  'row',
          justifyContent: 'space-around',
          width:          '100%',
        }}
      >
        {buttons}
      </div>
    )
  }

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ right: 12, bottom: 120, zIndex: 20, gap: 24 }}
    >
      {buttons}
    </div>
  )
}
