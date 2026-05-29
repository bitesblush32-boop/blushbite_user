'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'

interface FantasyTag {
  id:          number
  name:        string
  slug:        string
  category:    string
}

interface UserTag {
  fantasy_tag_id: number
  intensity:      'curious' | 'into_it' | 'love_it'
}

interface DesiresDrawerProps {
  open:    boolean
  onClose: () => void
}

const INTENSITY_LABELS: Record<string, string> = {
  curious: 'Curious',
  into_it: 'Into it',
  love_it: 'Love it',
}

const INTENSITY_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  curious: {
    border: 'rgba(201,169,110,0.35)',
    bg:     'rgba(201,169,110,0.08)',
    text:   '#c9a96e',
  },
  into_it: {
    border: 'rgba(232,96,122,0.35)',
    bg:     'rgba(232,96,122,0.10)',
    text:   '#e8607a',
  },
  love_it: {
    border: 'rgba(232,96,122,0.60)',
    bg:     'rgba(232,96,122,0.18)',
    text:   '#e8607a',
  },
}

export default function DesiresDrawer({ open, onClose }: DesiresDrawerProps) {
  const queryClient = useQueryClient()

  const [allTags, setAllTags]       = useState<FantasyTag[]>([])
  const [selected, setSelected]     = useState<Map<number, UserTag['intensity']>>(new Map())
  const [saving, setSaving]         = useState(false)
  const [loading, setLoading]       = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // Load tags + current user selection on open
  useEffect(() => {
    if (!open) return
    setLoading(true)

    Promise.all([
      fetch('/api/tags').then(r => r.json()),
      fetch('/api/users/profile').then(r => r.json()),
    ]).then(([tagsRes, profileRes]) => {
      if (tagsRes.data) {
        setAllTags(tagsRes.data)
        if (!activeCategory && tagsRes.data.length > 0) {
          setActiveCategory(tagsRes.data[0].category ?? null)
        }
      }
      if (profileRes.data?.fantasy_tags) {
        const map = new Map<number, UserTag['intensity']>()
        for (const t of profileRes.data.fantasy_tags as UserTag[]) {
          map.set(t.fantasy_tag_id, t.intensity)
        }
        setSelected(map)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Group tags by category
  const categories = Array.from(new Set(allTags.map(t => t.category))).filter(Boolean)
  const tagsByCategory = categories.reduce<Record<string, FantasyTag[]>>((acc, cat) => {
    acc[cat] = allTags.filter(t => t.category === cat)
    return acc
  }, {})

  const displayCategory = activeCategory ?? categories[0]

  function toggleTag(tagId: number) {
    setSelected(prev => {
      const next = new Map(prev)
      if (next.has(tagId)) {
        // Cycle: curious → into_it → love_it → remove
        const cur = next.get(tagId)!
        if (cur === 'curious')  next.set(tagId, 'into_it')
        else if (cur === 'into_it') next.set(tagId, 'love_it')
        else next.delete(tagId)
      } else {
        next.set(tagId, 'curious')
      }
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const fantasy_tags = Array.from(selected.entries()).map(([fantasy_tag_id, intensity]) => ({
        fantasy_tag_id,
        intensity,
      }))
      await fetch('/api/users/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ section: 'fantasy_tags', fantasy_tags }),
      })
      // Invalidate feed so it re-ranks with new tags
      queryClient.invalidateQueries({ queryKey: ['companions', 'feed'] })
      onClose()
    } catch { /* silent */ }
    finally { setSaving(false) }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[750] bg-black/70"
            style={{ backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Drawer — slides from bottom */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 left-0 right-0 z-[760] rounded-t-[20px] flex flex-col"
            style={{
              background:  '#0d1117',
              border:      '1px solid #1c2333',
              borderBottom: 'none',
              maxHeight:   '85vh',
            }}
          >
            {/* Top accent line */}
            <div className="h-[2px] rounded-t-[20px]" style={{ background: 'linear-gradient(90deg,transparent,#e8607a,transparent)' }} />

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-[36px] h-[4px] rounded-full bg-[#1c2333]" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-2 pb-4">
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif" }} className="text-[22px] text-[#eeeef0] mb-1">
                  Your desires
                </div>
                <p className="text-[12px] text-[#6b7280] leading-[1.5]">
                  Tap once = Curious · Twice = Into it · Three times = Love it
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[#6b7280] transition-colors hover:text-[#eeeef0] mt-1"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                ×
              </button>
            </div>

            {/* Category tabs */}
            {categories.length > 0 && (
              <div className="flex gap-2 px-6 pb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="text-[11px] px-[12px] py-[5px] rounded-full border cursor-pointer whitespace-nowrap flex-shrink-0 transition-all duration-150"
                    style={{
                      borderColor: displayCategory === cat ? '#e8607a' : '#1c2333',
                      color:       displayCategory === cat ? '#e8607a' : '#6b7280',
                      background:  displayCategory === cat ? 'rgba(232,96,122,0.08)' : 'transparent',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Tags grid — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 pb-2" style={{ minHeight: 0 }}>
              {loading ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="h-[32px] rounded-full" style={{ width: `${60 + (i % 4) * 20}px`, background: '#111620', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 pt-2">
                  {(tagsByCategory[displayCategory] ?? []).map(tag => {
                    const intensity = selected.get(tag.id)
                    const colors = intensity ? INTENSITY_COLORS[intensity] : null

                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className="text-[12px] px-[12px] py-[6px] rounded-full border cursor-pointer transition-all duration-150"
                        style={{
                          borderColor: colors?.border ?? '#1c2333',
                          background:  colors?.bg ?? 'transparent',
                          color:       colors?.text ?? '#6b7280',
                        }}
                      >
                        {tag.name}
                        {intensity && (
                          <span className="ml-[6px] text-[10px] opacity-75">
                            {INTENSITY_LABELS[intensity]}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-[#1c2333] flex items-center justify-between gap-4">
              <p className="text-[11px] text-[#6b7280]">
                {selected.size} {selected.size === 1 ? 'desire' : 'desires'} selected
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="bg-transparent text-[#6b7280] border border-[#1c2333] px-[18px] py-[9px] rounded-[10px] text-[13px] cursor-pointer transition-all duration-200 hover:border-white/20 hover:text-[#eeeef0]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-white border-none px-[22px] py-[9px] rounded-[10px] text-[13.5px] font-medium cursor-pointer transition-all duration-200 disabled:opacity-60"
                  style={{ background: saving ? '#c4485e' : '#e8607a' }}
                >
                  {saving ? 'Saving…' : 'Save my desires'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
