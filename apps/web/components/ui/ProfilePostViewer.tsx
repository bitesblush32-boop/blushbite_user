'use client'

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MoreHorizontal, Heart } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useUIStore, type ProfileViewerStory } from '@/store/uiStore'
import { paginateText } from '@/lib/paginateText'
import { StoryPageContent } from './StoryPageContent'
import { ActionPill } from './ActionPill'
import { useLikeMutation } from '@/hooks/useLikeMutation'

// ── Gradient map (mirrors ConfessionCard) ─────────────────────────────────────

const GRADIENT_MAP: Record<string, string> = {
  Romantic:      'linear-gradient(180deg, #1c0c1e 0%, #07090f 35%, #07090f 65%, #120818 100%)',
  Intense:       'linear-gradient(180deg, #0e0b1e 0%, #07090f 35%, #07090f 65%, #10091a 100%)',
  Confessions:   'linear-gradient(180deg, #11101e 0%, #07090f 35%, #07090f 65%, #0d0a1a 100%)',
  'Dark Romance':'linear-gradient(180deg, #1a0c1c 0%, #07090f 35%, #07090f 65%, #130818 100%)',
  BDSM:          'linear-gradient(180deg, #0e0b1e 0%, #07090f 35%, #07090f 65%, #100918 100%)',
  default:       'linear-gradient(180deg, #10101e 0%, #07090f 35%, #07090f 65%, #0d0b1c 100%)',
}

// ── ViewerCard ────────────────────────────────────────────────────────────────

interface ViewerCardProps {
  story:      ProfileViewerStory
  onOpenMenu: (id: string) => void
  onClose:    () => void
}

const ViewerCard = memo(function ViewerCard({ story, onOpenMenu, onClose }: ViewerCardProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const pages    = paginateText(story.rawBody ?? '')
  const gradient = GRADIENT_MAP[story.categoryName] ?? GRADIENT_MAP['default']

  const lastTapRef    = useRef<number>(0)
  const touchFiredRef = useRef(false)
  const [heartVisible, setHeartVisible] = useState(false)
  const [heartPos, setHeartPos]         = useState({ x: 0, y: 0 })

  const likeMutation   = useLikeMutation()
  const secondaryChips = story.moodTags.slice(0, 3)

  function handleTap(e: React.TouchEvent | React.MouseEvent) {
    if ('touches' in e) {
      touchFiredRef.current = true
    } else {
      if (touchFiredRef.current) {
        touchFiredRef.current = false
        return
      }
    }
    const now   = Date.now()
    const delta = now - lastTapRef.current
    lastTapRef.current = now

    if (delta < 300 && delta > 0) {
      const rect    = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const clientX = 'touches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX
      const clientY = 'touches' in e ? e.changedTouches[0].clientY : (e as React.MouseEvent).clientY
      setHeartPos({ x: clientX - rect.left, y: clientY - rect.top })
      setHeartVisible(true)
      setTimeout(() => setHeartVisible(false), 900)
      if (!story.userHasLiked) {
        likeMutation.mutate({ storyId: story.id, currentlyLiked: false })
      }
    }
  }

  return (
    <div style={{
      height:          '100dvh',
      scrollSnapAlign: 'start',
      scrollSnapStop:  'always',
      position:        'relative',
      display:         'flex',
      flexDirection:   'column',
      overflow:        'hidden',
      background:      '#07090f',
    }}>
      {/* Mood gradient */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: gradient }} />
      {/* Rose brand glow */}
      <div style={{
        position:      'absolute',
        inset:         0,
        pointerEvents: 'none',
        zIndex:        1,
        background:    'radial-gradient(ellipse 70% 35% at 50% 90%, rgba(232,96,122,0.10) 0%, transparent 70%)',
      }} />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{
        flexShrink:    0,
        zIndex:        20,
        paddingTop:    'max(14px, env(safe-area-inset-top))',
        paddingLeft:   16,
        paddingRight:  16,
        paddingBottom: 12,
        background:    '#111620',
        borderBottom:  '1px solid #1c2333',
        position:      'relative',
      }}>
        {/* Rose accent line */}
        <div style={{
          position:   'absolute',
          top:        0,
          left:       0,
          right:      0,
          height:     2,
          background: 'linear-gradient(90deg, transparent, #e8607a, transparent)',
        }} />

        {/* Top row: close | title | ⋯ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClose}
            style={{
              width:           36,
              height:          36,
              borderRadius:    '50%',
              background:      'rgba(255,255,255,0.06)',
              border:          'none',
              color:           '#eeeef0',
              cursor:          'pointer',
              flexShrink:      0,
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
            }}
          >
            <X size={18} />
          </motion.button>

          {story.title ? (
            <p style={{
              fontFamily:   "'Playfair Display', serif",
              fontSize:     16,
              color:        '#eeeef0',
              fontStyle:    'italic',
              margin:       0,
              flex:         1,
              textAlign:    'center',
              whiteSpace:   'nowrap',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              maxWidth:     200,
            }}>
              {story.title}
            </p>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          <button
            onClick={() => onOpenMenu(story.id)}
            style={{
              width:          36,
              height:         36,
              borderRadius:   '50%',
              background:     'rgba(255,255,255,0.06)',
              border:         'none',
              color:          '#eeeef0',
              cursor:         'pointer',
              flexShrink:     0,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
            }}
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Category chips */}
        {(story.categoryName || secondaryChips.length > 0) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
            {story.categoryName && (
              <span style={{
                fontSize:     10,
                fontWeight:   500,
                color:        '#e8607a',
                background:   'rgba(232,96,122,0.12)',
                border:       '1px solid rgba(232,96,122,0.3)',
                padding:      '3px 9px',
                borderRadius: 999,
              }}>
                {story.categoryName}
              </span>
            )}
            {secondaryChips.map(t => (
              <span key={t} style={{
                fontSize:     10,
                color:        '#6b7280',
                background:   'rgba(255,255,255,0.03)',
                border:       '1px solid #1c2333',
                padding:      '3px 9px',
                borderRadius: 999,
              }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── BODY ───────────────────────────────────────────────────────────── */}
      <div
        style={{ flex: 1, position: 'relative', overflow: 'hidden', zIndex: 10 }}
        onTouchEnd={handleTap}
        onClick={handleTap}
      >
        <StoryPageContent
          pages={pages}
          pageImageUrls={story.pageImageUrls}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />

        <AnimatePresence>
          {heartVisible && (
            <motion.div
              key="double-tap-heart"
              initial={{ scale: 0, opacity: 0.9 }}
              animate={{ scale: [0, 1.4, 1.1], opacity: [0.9, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
              style={{
                position:       'absolute',
                left:           heartPos.x - 40,
                top:            heartPos.y - 40,
                width:          80,
                height:         80,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                pointerEvents:  'none',
                zIndex:         25,
              }}
            >
              <Heart
                size={72}
                fill="#e8607a"
                color="#e8607a"
                strokeWidth={0}
                style={{ filter: 'drop-shadow(0 0 16px rgba(232,96,122,0.7))' }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <div style={{
        flexShrink:    0,
        zIndex:        20,
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        paddingLeft:   16,
        paddingRight:  16,
        paddingTop:    10,
        background:    '#111620',
        borderTop:     '1px solid #1c2333',
        display:       'flex',
        flexDirection: 'column',
        gap:           8,
      }}>
        {/* Page progress dots */}
        {pages.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, alignItems: 'center' }}>
            {pages.map((_, i) => (
              <div key={i} style={{
                width:        i === currentPage ? 18 : 5,
                height:       5,
                borderRadius: 999,
                background:   i === currentPage ? '#e8607a' : '#1c2333',
                transition:   'width 0.2s ease, background 0.2s ease',
              }} />
            ))}
          </div>
        )}

        <ActionPill
          storyId={story.id}
          likeCount={story.likeCount}
          saveCount={story.saveCount}
          commentCount={story.commentCount}
          userHasLiked={story.userHasLiked}
          userHasSaved={story.userHasSaved}
          layout="horizontal"
        />

        <span style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>
          {story.isAnonymous || !story.authorAlias ? 'anonymous' : story.authorAlias}
        </span>
      </div>
    </div>
  )
})

// ── ProfilePostViewer ─────────────────────────────────────────────────────────

export default function ProfilePostViewer() {
  const profileViewerStories = useUIStore(s => s.profileViewerStories)
  const profileViewerIndex   = useUIStore(s => s.profileViewerIndex)
  const profileViewerMode    = useUIStore(s => s.profileViewerMode)
  const closeProfileViewer   = useUIStore(s => s.closeProfileViewer)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [menuOpenId, setMenuOpenId]     = useState<string | null>(null)
  const [toast, setToast]               = useState<string | null>(null)
  const [actionPending, setActionPending] = useState(false)
  const queryClient = useQueryClient()

  // Scroll to initial index when viewer opens
  useEffect(() => {
    if (profileViewerMode === null) return
    const container = scrollContainerRef.current
    if (!container) return
    const target = container.children[profileViewerIndex] as HTMLElement | undefined
    if (target) {
      target.scrollIntoView({ behavior: 'instant' as ScrollBehavior })
    }
  }, [profileViewerMode, profileViewerIndex])

  const handleOpenMenu = useCallback((id: string) => setMenuOpenId(id), [])
  const handleClose    = useCallback(() => closeProfileViewer(), [closeProfileViewer])

  // ── Delete (own mode) ────────────────────────────────────────────────────
  async function handleDelete(storyId: string) {
    setActionPending(true)
    try {
      const res = await fetch(`/api/users/posts/${storyId}`, {
        method: 'DELETE', credentials: 'include',
      })
      if (res.ok) {
        setMenuOpenId(null)
        closeProfileViewer()
        queryClient.invalidateQueries({ queryKey: ['user-posts'] })
      }
    } catch {}
    finally { setActionPending(false) }
  }

  // ── Unlike (liked mode) — optimistic on success ──────────────────────────
  async function handleUnlike(storyId: string) {
    setActionPending(true)
    try {
      const res = await fetch(`/api/stories/${storyId}/like`, {
        method: 'DELETE', credentials: 'include',
      })
      if (res.ok) {
        useUIStore.setState(s => ({
          profileViewerStories: s.profileViewerStories.map(st =>
            st.id === storyId
              ? { ...st, userHasLiked: false, likeCount: Math.max(0, st.likeCount - 1) }
              : st
          ),
        }))
        setMenuOpenId(null)
        queryClient.invalidateQueries({ queryKey: ['liked'] })
      }
    } catch {}
    finally { setActionPending(false) }
  }

  // ── Unsave (saved mode) — remove from list on success ────────────────────
  async function handleUnsave(storyId: string) {
    setActionPending(true)
    try {
      const res = await fetch(`/api/stories/${storyId}/save`, {
        method: 'DELETE', credentials: 'include',
      })
      if (res.ok) {
        useUIStore.setState(s => ({
          profileViewerStories: s.profileViewerStories.filter(st => st.id !== storyId),
        }))
        setMenuOpenId(null)
        queryClient.invalidateQueries({ queryKey: ['saved', 'confessions'] })
      }
    } catch {}
    finally { setActionPending(false) }
  }

  // ── Share stub ────────────────────────────────────────────────────────────
  function handleShare() {
    setMenuOpenId(null)
    setToast('Coming soon')
    setTimeout(() => setToast(null), 1500)
  }

  const menuStory = menuOpenId
    ? profileViewerStories.find(s => s.id === menuOpenId) ?? null
    : null

  if (profileViewerMode === null) return null

  return (
    <>
      {/* ── Full-screen scroll container ──────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        style={{
          position:               'fixed',
          inset:                  0,
          zIndex:                 999,
          background:             '#07090f',
          overflowY:              'scroll',
          scrollSnapType:         'y mandatory',
          overscrollBehaviorY:    'contain',
          height:                 '100dvh',
        }}
      >
        {profileViewerStories.map(story => (
          <ViewerCard
            key={story.id}
            story={story}
            onOpenMenu={handleOpenMenu}
            onClose={handleClose}
          />
        ))}
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'tween', duration: 0.2 }}
            style={{
              position:       'fixed',
              top:            80,
              left:           '50%',
              transform:      'translateX(-50%)',
              zIndex:         1100,
              background:     '#161d2a',
              border:         '1px solid #1c2333',
              borderRadius:   20,
              padding:        '8px 16px',
              fontSize:       12,
              color:          '#eeeef0',
              whiteSpace:     'nowrap',
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Context menu sheet ────────────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpenId && menuStory && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'tween', duration: 0.2 }}
              style={{
                position:   'fixed',
                inset:      0,
                zIndex:     1050,
                background: 'rgba(0,0,0,0.5)',
              }}
              onClick={() => setMenuOpenId(null)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              style={{
                position:     'fixed',
                bottom:       0,
                left:         0,
                right:        0,
                zIndex:       1051,
                background:   '#0d1117',
                borderRadius: '20px 20px 0 0',
                borderTop:    '1px solid #1c2333',
                padding:      'max(20px, env(safe-area-inset-bottom))',
                paddingTop:   20,
                paddingLeft:  20,
                paddingRight: 20,
              }}
            >
              {/* Drag handle */}
              <div style={{
                width:        36,
                height:       4,
                borderRadius: 2,
                background:   '#1c2333',
                margin:       '0 auto 16px',
              }} />

              {/* Mode-specific actions */}
              {profileViewerMode === 'own' && (
                <MenuBtn
                  onClick={() => !actionPending && handleDelete(menuStory.id)}
                  disabled={actionPending}
                  color="#e87070"
                  hoverBg="rgba(232,96,122,0.06)"
                >
                  🗑 Delete this confession
                </MenuBtn>
              )}

              {profileViewerMode === 'liked' && (
                <MenuBtn
                  onClick={() => !actionPending && handleUnlike(menuStory.id)}
                  disabled={actionPending}
                  color="#e87070"
                  hoverBg="rgba(232,96,122,0.06)"
                >
                  ♥ Unlike this confession
                </MenuBtn>
              )}

              {profileViewerMode === 'saved' && (
                <MenuBtn
                  onClick={() => !actionPending && handleUnsave(menuStory.id)}
                  disabled={actionPending}
                  color="#6b7280"
                  hoverBg="rgba(255,255,255,0.04)"
                >
                  🔖 Unsave this confession
                </MenuBtn>
              )}

              {/* Share — all modes */}
              <MenuBtn
                onClick={handleShare}
                color="#6b7280"
                hoverBg="rgba(255,255,255,0.04)"
              >
                ↗ Share
              </MenuBtn>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// ── MenuBtn helper ────────────────────────────────────────────────────────────

function MenuBtn({
  children,
  onClick,
  disabled,
  color,
  hoverBg,
}: {
  children: React.ReactNode
  onClick:  () => void
  disabled?: boolean
  color:    string
  hoverBg:  string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width:          '100%',
        height:         52,
        borderRadius:   12,
        paddingLeft:    14,
        display:        'flex',
        alignItems:     'center',
        gap:            12,
        background:     'transparent',
        border:         'none',
        cursor:         disabled ? 'not-allowed' : 'pointer',
        color,
        fontSize:       13,
        opacity:        disabled ? 0.5 : 1,
        marginBottom:   4,
      }}
      onMouseEnter={e => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = hoverBg
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )
}
