'use client'

import { Suspense, useState, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Search, Heart, Eye, Loader2, CheckCircle2 } from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BridgeStory {
  id:            string
  title:         string
  excerpt:       string | null
  author_type:   string
  like_count:    number
  view_count:    number
  category_name: string | null
  mood_tags:     string[]
}

interface MyLink {
  bridge_id:     string
  story_id:      string
  status:        'pending' | 'approved' | 'rejected'
  admin_note:    string | null
  story_title:   string
  story_excerpt: string | null
  category_name: string | null
}

// ─── Inner page (uses useSearchParams — must be inside Suspense) ───────────────

function BridgePageInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const tab          = (searchParams.get('tab') ?? 'find') as 'find' | 'mine'

  // ── Find tab state ──
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('')
  const [linking,  setLinking]  = useState<Record<string, boolean>>({})
  const [linked,   setLinked]   = useState<Record<string, boolean>>({})
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── My links tab state ──
  const [removing, setRemoving] = useState<Record<string, boolean>>({})

  // Debounced search term fed into query key
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const handleSearchChange = useCallback((val: string) => {
    setSearch(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 400)
  }, [])

  // ── Fetch categories (cached, rarely changes) ──────────────────────────────
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn:  () => fetch('/api/tags').then(r => r.json()),
    staleTime: 60 * 60 * 1000, // tags change very rarely
  })
  const categories: string[] = tagsData?.storyCategories?.map((c: { name: string }) => c.name) ?? []

  // ── Fetch bridge stories (find tab) ───────────────────────────────────────
  const { data: bridgeStoriesData, isFetching: fetching } = useQuery({
    queryKey: ['companion', 'bridge', 'stories', debouncedSearch, category],
    queryFn:  () => {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search',   debouncedSearch)
      if (category)        params.set('category', category)
      return fetch(`/api/companion/bridge/stories?${params}`).then(r => r.json()).then(d => d.data ?? [])
    },
    enabled:   tab === 'find',
    staleTime: 30 * 1000,
  })
  const stories: BridgeStory[] = bridgeStoriesData ?? []

  // ── Fetch my links (mine tab) ──────────────────────────────────────────────
  const { data: myLinksData, isFetching: myFetching, refetch: refetchMyLinks } = useQuery({
    queryKey: ['companion', 'bridge', 'my-links'],
    queryFn:  () => fetch('/api/companion/bridge/my-links').then(r => r.json()).then(d => d.data ?? []),
    enabled:   tab === 'mine',
    staleTime: 30 * 1000,
  })
  const myLinks: MyLink[] = myLinksData ?? []

  // ── Link to story ──
  async function handleLink(storyId: string) {
    setLinking(p => ({ ...p, [storyId]: true }))
    try {
      const res = await fetch('/api/companion/bridge/link', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ story_id: storyId }),
      })
      if (res.ok) setLinked(p => ({ ...p, [storyId]: true }))
    } finally {
      setLinking(p => ({ ...p, [storyId]: false }))
    }
  }

  // ── Remove link ──
  async function handleRemove(storyId: string) {
    setRemoving(p => ({ ...p, [storyId]: true }))
    try {
      const res = await fetch(`/api/companion/bridge/${storyId}`, { method: 'DELETE' })
      if (res.ok) refetchMyLinks()
    } finally {
      setRemoving(p => ({ ...p, [storyId]: false }))
    }
  }

  const setTab = (t: 'find' | 'mine') => {
    const url = new URL(window.location.href)
    url.searchParams.set('tab', t)
    router.push(url.pathname + url.search)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/companion/dashboard')}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        6,
            fontSize:   12.5,
            color:      '#6b7280',
            background: 'none',
            border:     'none',
            cursor:     'pointer',
            padding:    0,
            marginBottom: 14,
          }}
        >
          <ArrowLeft size={14} /> Back to dashboard
        </button>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#eeeef0', marginBottom: 6 }}>
          Story Bridge
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
          Connect your profile to content you relate with.
        </p>
      </div>

      {/* ── Tab row ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          display:      'flex',
          gap:          4,
          background:   '#111620',
          border:       '1px solid #1c2333',
          borderRadius: 12,
          padding:      4,
          marginBottom: 20,
        }}
      >
        {(['find', 'mine'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex:         1,
              padding:      '9px 0',
              borderRadius: 9,
              fontSize:     13,
              fontWeight:   500,
              border:       'none',
              cursor:       'pointer',
              transition:   'all 0.15s',
              background:   tab === t ? 'rgba(232,96,122,0.12)' : 'transparent',
              color:        tab === t ? '#e8607a' : '#6b7280',
            }}
          >
            {t === 'find' ? 'Find Stories' : 'My Links'}
          </button>
        ))}
      </div>

      {/* ══ TAB: FIND STORIES ══════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {tab === 'find' && (
          <motion.div
            key="find"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{    opacity: 0, x: -10 }}
            transition={{ duration: 0.25 }}
          >
            {/* Search bar */}
            <div
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          10,
                background:   '#111620',
                border:       '1px solid #1c2333',
                borderRadius: 12,
                padding:      '10px 14px',
                marginBottom: 12,
              }}
            >
              <Search size={15} color="#6b7280" style={{ flexShrink: 0 }} />
              <input
                type="text"
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Search by keyword or theme..."
                style={{
                  flex:       1,
                  background: 'transparent',
                  border:     'none',
                  outline:    'none',
                  fontSize:   14,
                  color:      '#eeeef0',
                  minWidth:   0,
                }}
              />
            </div>

            {/* Category filter pills */}
            {categories.length > 0 && (
              <div
                className="flex gap-2 mb-4 overflow-x-auto pb-1"
                style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
              >
                {['All', ...categories].map(cat => {
                  const active = cat === 'All' ? category === '' : category === cat
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat === 'All' ? '' : cat)}
                      style={{
                        flexShrink:   0,
                        fontSize:     12,
                        padding:      '6px 14px',
                        borderRadius: 9999,
                        border:       `1px solid ${active ? '#e8607a' : '#1c2333'}`,
                        background:   active ? 'rgba(232,96,122,0.08)' : 'transparent',
                        color:        active ? '#e8607a' : '#6b7280',
                        cursor:       'pointer',
                        transition:   'all 0.15s',
                        whiteSpace:   'nowrap',
                      }}
                    >
                      {cat}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Story list */}
            {fetching ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <Loader2 size={22} color="#e8607a" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : stories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280', fontSize: 13 }}>
                No stories found. Try a different search.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stories.map(story => {
                  const isLinking   = linking[story.id]
                  const isLinked    = linked[story.id]
                  return (
                    <div
                      key={story.id}
                      style={{
                        background:   '#111620',
                        border:       '1px solid #1c2333',
                        borderRadius: 16,
                        padding:      16,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize:   15,
                            color:      '#eeeef0',
                            marginBottom: 6,
                            lineHeight: 1.35,
                          }}>
                            {story.title}
                          </p>
                          {story.excerpt && (
                            <p style={{
                              fontSize:   13,
                              color:      '#6b7280',
                              lineHeight: 1.5,
                              marginBottom: 10,
                              display:    '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow:   'hidden',
                            }}>
                              {story.excerpt}
                            </p>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {story.category_name && (
                              <span style={{
                                fontSize: 10, padding: '3px 9px', borderRadius: 999,
                                color: '#e8607a', background: 'rgba(232,96,122,0.1)',
                                border: '1px solid rgba(232,96,122,0.25)',
                              }}>
                                {story.category_name}
                              </span>
                            )}
                            <span style={{
                              fontSize: 10, padding: '3px 9px', borderRadius: 999,
                              color: '#6b7280', background: 'rgba(255,255,255,0.03)',
                              border: '1px solid #1c2333',
                            }}>
                              {story.author_type}
                            </span>
                            <span style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Heart size={11} /> {story.like_count}
                            </span>
                            <span style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Eye size={11} /> {story.view_count}
                            </span>
                          </div>
                        </div>

                        {/* Link button */}
                        <button
                          onClick={() => !isLinked && !isLinking && handleLink(story.id)}
                          disabled={isLinked || isLinking}
                          style={{
                            flexShrink:   0,
                            width:        110,
                            padding:      '9px 12px',
                            borderRadius: 9999,
                            fontSize:     12,
                            fontWeight:   500,
                            border:       isLinked
                              ? '1px solid rgba(201,169,110,0.4)'
                              : '1px solid rgba(232,96,122,0.35)',
                            background:   isLinked
                              ? 'rgba(201,169,110,0.08)'
                              : 'rgba(232,96,122,0.08)',
                            color:        isLinked ? '#c9a96e' : '#e8607a',
                            cursor:       isLinked || isLinking ? 'default' : 'pointer',
                            display:      'flex',
                            alignItems:   'center',
                            justifyContent: 'center',
                            gap:          5,
                            transition:   'all 0.15s',
                          }}
                        >
                          {isLinking ? (
                            <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : isLinked ? (
                            <><CheckCircle2 size={13} /> Pending ✓</>
                          ) : (
                            'This is me →'
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ══ TAB: MY LINKS ════════════════════════════════════════════════════ */}
        {tab === 'mine' && (
          <motion.div
            key="mine"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{    opacity: 0, x: -10 }}
            transition={{ duration: 0.25 }}
          >
            {myFetching ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <Loader2 size={22} color="#e8607a" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : myLinks.length === 0 ? (
              <div
                style={{
                  textAlign:    'center',
                  padding:      '48px 24px',
                  background:   '#111620',
                  border:       '1px solid #1c2333',
                  borderRadius: 16,
                }}
              >
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
                  You haven&apos;t linked to any stories yet.
                  <br />
                  <span style={{ fontSize: 13, color: '#4b5563' }}>
                    Browse the Find tab to connect with content you relate with.
                  </span>
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {myLinks.map(link => (
                  <div
                    key={link.bridge_id}
                    style={{
                      background:   '#111620',
                      border:       '1px solid #1c2333',
                      borderRadius: 16,
                      padding:      16,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: 15, color: '#eeeef0', marginBottom: 4, lineHeight: 1.35,
                        }}>
                          {link.story_title}
                        </p>
                        {link.category_name && (
                          <span style={{
                            fontSize: 10, padding: '3px 9px', borderRadius: 999,
                            color: '#6b7280', background: 'rgba(255,255,255,0.03)',
                            border: '1px solid #1c2333',
                          }}>
                            {link.category_name}
                          </span>
                        )}
                      </div>

                      {/* Status badge */}
                      <span style={{
                        flexShrink:   0,
                        fontSize:     10,
                        padding:      '4px 10px',
                        borderRadius: 9999,
                        fontWeight:   500,
                        ...(link.status === 'approved'
                          ? { color: '#34d399', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }
                          : link.status === 'rejected'
                            ? { color: '#e8607a', background: 'rgba(232,96,122,0.08)', border: '1px solid rgba(232,96,122,0.25)' }
                            : { color: '#c9a96e', background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.3)' }),
                      }}>
                        {link.status === 'approved' ? 'Approved' : link.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </div>

                    {/* Status sub-text */}
                    {link.status === 'approved' && (
                      <p style={{ fontSize: 11, color: '#34d399', marginTop: 6 }}>
                        Your profile appears on this story for dreamers ✓
                      </p>
                    )}
                    {link.status === 'rejected' && (
                      <p style={{ fontSize: 11, color: '#e8607a', marginTop: 6 }}>
                        Not approved. Try a different story.
                        {link.admin_note && <> &mdash; {link.admin_note}</>}
                      </p>
                    )}
                    {link.status === 'pending' && (
                      <button
                        onClick={() => handleRemove(link.story_id)}
                        disabled={removing[link.story_id]}
                        style={{
                          marginTop:  8,
                          fontSize:   12,
                          color:      removing[link.story_id] ? '#4b5563' : '#6b7280',
                          background: 'none',
                          border:     'none',
                          cursor:     removing[link.story_id] ? 'default' : 'pointer',
                          padding:    0,
                          textDecoration: 'underline',
                          display:    'flex',
                          alignItems: 'center',
                          gap:        5,
                        }}
                      >
                        {removing[link.story_id]
                          ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Removing…</>
                          : 'Remove'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Default export wrapped in Suspense (required for useSearchParams) ─────────

export default function BridgePage() {
  return (
    <Suspense fallback={null}>
      <BridgePageInner />
    </Suspense>
  )
}
