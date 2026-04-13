'use client'

import { useState, useRef, useCallback, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { toJpeg } from 'html-to-image'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_CHARS = 700
const MAX_PAGES = 100

const PLACEHOLDERS = [
  "There's something I've never told anyone...",
  "I keep coming back to that night...",
  "What I want, but never say out loud...",
  "It started so quietly. Then it didn't.",
]

// Keep in sync with ConfessionCard.tsx GRADIENT_MAP — same gradient renders
// in the card and is baked into the image so the body zone looks seamless.
const GRADIENT_MAP: Record<string, string> = {
  Romantic:     'linear-gradient(180deg, #1c0c1e 0%, #07090f 35%, #07090f 65%, #120818 100%)',
  Intense:      'linear-gradient(180deg, #0e0b1e 0%, #07090f 35%, #07090f 65%, #10091a 100%)',
  Confessions:  'linear-gradient(180deg, #11101e 0%, #07090f 35%, #07090f 65%, #0d0a1a 100%)',
  'Dark Romance':'linear-gradient(180deg, #1a0c1c 0%, #07090f 35%, #07090f 65%, #130818 100%)',
  BDSM:         'linear-gradient(180deg, #0e0b1e 0%, #07090f 35%, #07090f 65%, #100918 100%)',
  default:      'linear-gradient(180deg, #10101e 0%, #07090f 35%, #07090f 65%, #0d0b1c 100%)',
}

const LOADING_PHRASES = [
  'Sealing your confession...',
  'Pressing it into the dark...',
  'Almost there...',
]

const CONFESSION_CATEGORIES = [
  // — from onboarding vibes —
  'Romantic', 'Curious', 'Dominant', 'Submissive', 'Experimental',
  'Soft & Gentle', 'Mischievous', 'Strict', 'Wild', 'Elegant',
  'Sensual', 'Bratty', 'Intense', 'Flirty', 'Mysterious',
  'Nurturing', 'Cerebral', 'Radiant', 'Demanding', 'Spontaneous',
  // — extended adult fiction categories —
  'Forbidden', 'Taboo', 'Dark Romance', 'Slow Burn', 'Enemies to Lovers',
  'Friends to Lovers', 'Second Chance', 'Age Gap', 'Power Dynamic',
  'Office Romance', 'Arranged', 'Mafia', 'Royal', 'Vampire', 'Werewolf',
  'Paranormal', 'Fantasy', 'Historical', 'First Time', 'Teacher',
  'Stepfamily', 'Incest', 'Voyeur', 'Public', 'BDSM', 'Pet Play',
  'Daddy', 'Mommy', 'Forbidden Love', 'Blackmail', 'Obsession',
  'Stalker', 'Reverse Harem', 'Polyamory', 'Threesome', 'Group',
  'Alpha', 'Omega', 'Rivals', 'Revenge', 'Corruption',
]

const ALL_SUGGESTIONS = [
  ...CONFESSION_CATEGORIES,
  'Innocent', 'Infidelity', 'Interracial', 'Indulgence',
  'Stepbrother', 'Stepsister', 'Stepfather', 'Stepmother',
  'Boss', 'Secretary', 'Professor', 'Student', 'Doctor', 'Patient',
  'Bodyguard', 'Celebrity', 'Billionaire', 'Nanny', 'Neighbour',
  'Childhood Sweetheart', 'Forbidden Fruit', 'Late Night', 'Midnight',
  'Confession', 'Secret', 'Hidden', 'Unspoken', 'Silent', 'Whisper',
  'Lust', 'Longing', 'Ache', 'Hunger', 'Craving', 'Possession',
  'Obsessive', 'Protective', 'Jealous', 'Toxic', 'Dark', 'Twisted',
  'Gentle', 'Rough', 'Tender', 'Raw', 'Honest', 'Private',
  'Humiliation', 'Praise Kink', 'Size Difference', 'Somnophilia',
  'Exhibitionism', 'Bondage', 'Discipline', 'Sadism', 'Masochism',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toTitleCase(s: string): string {
  return s.trim().replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const lower = text.toLowerCase()
  const idx   = lower.indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: '#e8607a' }}>{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  )
}

// ─── Page dots ────────────────────────────────────────────────────────────────

function PageDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-[6px]">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-200"
          style={{
            width:      i === current ? 18 : 6,
            height:     6,
            background: i === current ? '#e8607a' : '#1c2333',
          }}
        />
      ))}
    </div>
  )
}

// ─── Top bar ──────────────────────────────────────────────────────────────────

function TopBar({
  onClose,
  step,
  totalSteps,
  rightLabel,
  onRight,
  rightDisabled,
  leftLabel,
  onLeft,
  centerLabel,
}: {
  onClose:        () => void
  step:           number
  totalSteps:     number
  rightLabel:     string
  onRight:        () => void
  rightDisabled?: boolean
  leftLabel?:     string
  onLeft?:        () => void
  centerLabel?:   string
}) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-[950] flex items-center justify-between px-5 md:px-8"
      style={{ height: 56, background: 'rgba(7,9,15,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #1c2333' }}
    >
      {/* Left */}
      <div className="flex items-center" style={{ minWidth: 72 }}>
        {onLeft ? (
          <button
            type="button"
            onClick={onLeft}
            className="flex items-center gap-1 transition-colors duration-150"
            style={{ color: '#6b7280', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#eeeef0' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280' }}
          >
            <ChevronLeft size={16} />
            {leftLabel ?? 'Back'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center rounded-full transition-colors duration-150"
            style={{ width: 32, height: 32, color: '#4b5563', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#eeeef0' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#4b5563' }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Center */}
      {centerLabel ? (
        <span style={{ fontSize: 11, color: '#4b5563', letterSpacing: '0.06em' }}>{centerLabel}</span>
      ) : (
        <PageDots total={totalSteps} current={step} />
      )}

      {/* Right */}
      <div className="flex items-center justify-end" style={{ minWidth: 72 }}>
        {rightLabel && (
          <button
            type="button"
            onClick={onRight}
            disabled={rightDisabled}
            style={{
              fontSize: 13,
              color:    '#e8607a',
              opacity:  rightDisabled ? 0.35 : 1,
              cursor:   rightDisabled ? 'not-allowed' : 'pointer',
              background: 'none',
              border:     'none',
            }}
          >
            {rightLabel}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Noise + glow ─────────────────────────────────────────────────────────────

function NoisGlow() {
  return (
    <>
      <div
        className="fixed inset-0 pointer-events-none z-[1000] opacity-60"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(232,96,122,0.06) 0%, transparent 70%)' }}
      />
    </>
  )
}

// ─── STEP 1 — Canvas ──────────────────────────────────────────────────────────

function StepCanvas({
  pages,
  setPages,
  pageIndex,
  setPageIndex,
  onClose,
  onNext,
  maxChars,
}: {
  pages:        string[]
  setPages:     (p: string[]) => void
  pageIndex:    number
  setPageIndex: (i: number) => void
  onClose:      () => void
  onNext:       () => void
  maxChars?:    number
}) {
  const textareaRef                       = useRef<HTMLTextAreaElement>(null)
  const [dragStart, setDragStart]         = useState<number | null>(null)
  const [placeholder]                     = useState(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)])
  const [direction, setDirection]         = useState(0)
  const CHAR_LIMIT                        = maxChars ?? MAX_CHARS

  // Lock page scroll while composing
  useEffect(() => {
    document.body.classList.add('canvas-mode')
    return () => document.body.classList.remove('canvas-mode')
  }, [])

  const currentText = pages[pageIndex] ?? ''
  const charCount   = currentText.length
  const hasContent  = pages.some(p => p.trim().length > 0)

  useEffect(() => { textareaRef.current?.focus() }, [pageIndex])

  const goToPage = useCallback((idx: number) => {
    if (idx < 0 || idx >= pages.length) return
    setDirection(idx > pageIndex ? 1 : -1)
    setPageIndex(idx)
  }, [pages.length, pageIndex, setPageIndex])

  const handleTextChange = (val: string) => {
    const newPages = [...pages]
    if (val.length <= CHAR_LIMIT) {
      newPages[pageIndex] = val
      setPages(newPages)
    } else {
      if (pages.length < MAX_PAGES) {
        newPages[pageIndex] = val.slice(0, CHAR_LIMIT)
        const overflow = val.slice(CHAR_LIMIT)
        if (pageIndex === pages.length - 1) {
          newPages.push(overflow)
        } else {
          newPages[pageIndex + 1] = overflow + (newPages[pageIndex + 1] ?? '')
        }
        setPages(newPages)
        setDirection(1)
        setPageIndex(pageIndex + 1)
      }
    }
  }

  const handleBlur = () => {
    if (pageIndex > 0 && currentText.trim() === '') {
      const newPages = [...pages]
      newPages.splice(pageIndex, 1)
      setPages(newPages)
      setDirection(-1)
      setPageIndex(pageIndex - 1)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => { setDragStart(e.touches[0].clientX) }
  const handleTouchEnd   = (e: React.TouchEvent) => {
    if (dragStart === null) return
    const diff = dragStart - e.changedTouches[0].clientX
    if (diff > 80 && pageIndex < pages.length - 1) goToPage(pageIndex + 1)
    else if (diff < -80 && pageIndex > 0) goToPage(pageIndex - 1)
    setDragStart(null)
  }

  const pageVariants = {
    enter:  (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit:   (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
  }

  return (
    <div
      className="flex flex-col items-center w-full"
      style={{ paddingTop: 56, height: '100dvh', overflow: 'hidden', background: '#07090f' }}
    >
      <NoisGlow />

      <div className="w-full max-w-[640px] px-5 md:px-6 py-8 flex flex-col items-center">
        <div className="relative w-full max-w-[580px]" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {pageIndex > 0 && (
            <button
              type="button"
              onClick={() => goToPage(pageIndex - 1)}
              className="absolute left-[-32px] top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center"
              style={{ color: '#2a3040', zIndex: 2, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={pageIndex}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="w-full rounded-[16px] border border-[#1c2333] relative"
              style={{ background: '#0d1117', padding: '40px 44px', minHeight: 480 }}
            >
              <textarea
                ref={textareaRef}
                value={currentText}
                onChange={e => handleTextChange(e.target.value)}
                onBlur={handleBlur}
                placeholder={placeholder}
                className="confession-textarea w-full bg-transparent border-none outline-none resize-none"
                style={{
                  fontFamily:    "'Playfair Display', serif",
                  fontSize:      18,
                  color:         '#eeeef0',
                  lineHeight:    1.9,
                  letterSpacing: '0.01em',
                  minHeight:     400,
                  caretColor:    '#e8607a',
                }}
              />
            </motion.div>
          </AnimatePresence>

          {pageIndex < pages.length - 1 && (
            <button
              type="button"
              onClick={() => goToPage(pageIndex + 1)}
              className="absolute right-[-32px] top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center"
              style={{ color: '#2a3040', zIndex: 2, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        <div className="w-full max-w-[580px] mt-2 flex flex-col items-end gap-[2px]">
          <span style={{ fontSize: 11, color: '#2a3040' }}>{charCount} / {CHAR_LIMIT}</span>
          {pages.length > 1 && (
            <span style={{ fontSize: 11, color: '#2a3040' }}>Page {pageIndex + 1} of {pages.length}</span>
          )}
        </div>

        {pages.length > 1 && (
          <div className="flex gap-[6px] mt-3">
            {pages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToPage(i)}
                className="rounded-full transition-all duration-150"
                style={{ width: i === pageIndex ? 18 : 6, height: 6, background: i === pageIndex ? '#e8607a' : '#1c2333', border: 'none', cursor: 'pointer', padding: 0 }}
              />
            ))}
          </div>
        )}
      </div>

      <TopBar
        onClose={onClose}
        step={0}
        totalSteps={2}
        rightLabel="Next →"
        onRight={onNext}
        rightDisabled={!hasContent}
      />
    </div>
  )
}

// ─── STEP 2 — Title + Category selector ───────────────────────────────────────

function StepMeta({
  title,
  setTitle,
  selectedCategories,
  setSelectedCategories,
  onBack,
  onNext,
  isStoryMode,
}: {
  title:                  string
  setTitle:               (v: string) => void
  selectedCategories:     string[]
  setSelectedCategories:  (v: string[]) => void
  onBack:                 () => void
  onNext:                 () => void
  isStoryMode?:           boolean
}) {
  const [titleFocused, setTitleFocused]   = useState(false)
  const [query, setQuery]                 = useState('')
  const [dropdownOpen, setDropdownOpen]   = useState(false)
  const inputRef                          = useRef<HTMLInputElement>(null)
  const dropdownRef                       = useRef<HTMLDivElement>(null)
  const wrapperRef                        = useRef<HTMLDivElement>(null)

  const canContinue = selectedCategories.length > 0

  // Close dropdown on outside click
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  // Build suggestions: deduplicate ALL_SUGGESTIONS, sort startsWith first then includes
  const suggestions: string[] = (() => {
    if (!query.trim()) return []
    const q    = query.toLowerCase()
    const seen = new Set<string>()
    const pool = ALL_SUGGESTIONS.filter(s => { if (seen.has(s)) return false; seen.add(s); return !selectedCategories.includes(s) })
    const sw   = pool.filter(s => s.toLowerCase().startsWith(q))
    const inc  = pool.filter(s => !s.toLowerCase().startsWith(q) && s.toLowerCase().includes(q))
    return [...sw, ...inc].slice(0, 8)
  })()

  const showCustomAdd = query.trim().length > 0 && suggestions.length === 0

  const addCategory = (cat: string) => {
    const trimmed = cat.trim()
    if (!trimmed || selectedCategories.includes(trimmed)) return
    setSelectedCategories([...selectedCategories, trimmed])
    setQuery('')
    setDropdownOpen(false)
    inputRef.current?.focus()
  }

  const removeCategory = (cat: string) => {
    setSelectedCategories(selectedCategories.filter(c => c !== cat))
  }

  const toggleGridChip = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      removeCategory(cat)
    } else {
      setSelectedCategories([...selectedCategories, cat])
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setDropdownOpen(false)
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions.length > 0) {
        addCategory(suggestions[0])
      } else if (query.trim()) {
        addCategory(toTitleCase(query))
      }
    }
  }

  // First 20 for the chip grid
  const gridChips = CONFESSION_CATEGORIES.slice(0, 20)

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
      style={{ background: '#07090f', minHeight: '100vh', paddingTop: 56 }}
    >
      <NoisGlow />

      <div className="w-full max-w-[640px] mx-auto px-5 md:px-6 py-8">

        {/* Heading */}
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#eeeef0', marginBottom: 4, lineHeight: 1.3 }}>
          Give it a name.
        </h1>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#e8607a', fontStyle: 'italic', marginBottom: 32, lineHeight: 1.4 }}>
          And tell us where it lives.
        </p>

        {/* ── Section A — Title ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <p style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 500 }}>Title</p>
          <div className="relative">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value.slice(0, 120))}
              placeholder={isStoryMode ? 'Give your story a title...' : 'e.g. The night I said nothing...'}
              onFocus={() => setTitleFocused(true)}
              onBlur={() => setTitleFocused(false)}
              className="w-full bg-[#161d2a] border border-[#1c2333] rounded-[10px] px-4 text-[14px] text-[#eeeef0] outline-none"
              style={{
                paddingTop:    13,
                paddingBottom: 13,
                borderColor:   titleFocused ? '#e8607a' : '#1c2333',
                boxShadow:     titleFocused ? '0 0 0 3px rgba(232,96,122,0.1)' : 'none',
                transition:    'border-color 0.15s, box-shadow 0.15s',
              }}
            />
            <span className="absolute bottom-[10px] right-3" style={{ fontSize: 10, color: '#4b5563', pointerEvents: 'none' }}>
              {title.length}/120
            </span>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="h-px my-6" style={{ background: '#1c2333' }} />

        {/* ── Section B — Category ── */}
        <div>
          {/* Label row */}
          <div className="flex items-center justify-between mb-1">
            <p style={{ fontSize: 10, color: '#e8607a', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>
              {isStoryMode ? 'Story themes *' : 'What is this about? *'}
            </p>
            <span style={{ fontSize: 10, color: '#4b5563' }}>
              {selectedCategories.length} selected
            </span>
          </div>
          <p style={{ fontSize: 11, color: '#4b5563', fontStyle: 'italic', marginBottom: 16 }}>
            Required — pick at least one.
          </p>

          {/* Chip grid — first 20 */}
          <div className="flex flex-wrap gap-2 mb-5">
            {gridChips.map(cat => {
              const selected = selectedCategories.includes(cat)
              return (
                <motion.button
                  key={cat}
                  type="button"
                  onClick={() => toggleGridChip(cat)}
                  whileTap={{ scale: 0.95 }}
                  className="text-[12px] px-[14px] py-[7px] rounded-full border transition-all duration-150"
                  style={{
                    borderColor: selected ? 'rgba(232,96,122,0.45)' : '#1c2333',
                    color:       selected ? '#e8607a' : '#6b7280',
                    background:  selected ? 'rgba(232,96,122,0.1)' : 'transparent',
                    cursor:      'pointer',
                  }}
                >
                  {cat}
                </motion.button>
              )
            })}
          </div>

          {/* Autocomplete input */}
          <div ref={wrapperRef} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => {
                setQuery(e.target.value)
                setDropdownOpen(true)
              }}
              onFocus={() => { if (query.trim()) setDropdownOpen(true) }}
              onKeyDown={handleInputKeyDown}
              placeholder="Type to add more..."
              className="w-full bg-[#161d2a] border border-[#1c2333] rounded-[10px] px-4 outline-none text-[#eeeef0]"
              style={{
                paddingTop:    11,
                paddingBottom: 11,
                fontSize:      13,
                borderColor:   dropdownOpen && (suggestions.length > 0 || showCustomAdd) ? '#e8607a' : '#1c2333',
                boxShadow:     dropdownOpen && (suggestions.length > 0 || showCustomAdd) ? '0 0 0 3px rgba(232,96,122,0.1)' : 'none',
                transition:    'border-color 0.15s, box-shadow 0.15s',
              }}
            />

            {/* Dropdown */}
            {dropdownOpen && (suggestions.length > 0 || showCustomAdd) && (
              <div
                ref={dropdownRef}
                className="absolute left-0 right-0 z-[50] overflow-y-auto"
                style={{
                  top:          'calc(100% + 4px)',
                  background:   '#161d2a',
                  border:       '1px solid #1c2333',
                  borderRadius: 10,
                  maxHeight:    200,
                  boxShadow:    '0 8px 24px rgba(0,0,0,0.5)',
                }}
              >
                {suggestions.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addCategory(s)}
                    className="w-full text-left border-b border-[#1c2333] last:border-0 transition-colors duration-100"
                    style={{ padding: '10px 16px', fontSize: 13, color: '#eeeef0', background: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,96,122,0.08)'
                      ;(e.currentTarget as HTMLButtonElement).style.color = '#e8607a'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'none'
                      ;(e.currentTarget as HTMLButtonElement).style.color = '#eeeef0'
                    }}
                  >
                    <HighlightMatch text={s} query={query} />
                  </button>
                ))}
                {showCustomAdd && (
                  <button
                    type="button"
                    onClick={() => addCategory(toTitleCase(query))}
                    className="w-full text-left transition-colors duration-100"
                    style={{ padding: '10px 16px', fontSize: 12, color: '#6b7280', fontStyle: 'italic', background: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,96,122,0.05)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
                  >
                    Add &ldquo;{toTitleCase(query)}&rdquo;
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Selected chips (all, including custom) */}
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <AnimatePresence>
                {selectedCategories.map(cat => (
                  <motion.span
                    key={cat}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex items-center text-[12px] px-[14px] py-[7px] rounded-full"
                    style={{
                      borderColor: 'rgba(232,96,122,0.45)',
                      color:       '#e8607a',
                      background:  'rgba(232,96,122,0.1)',
                      border:      '1px solid rgba(232,96,122,0.45)',
                    }}
                  >
                    {cat}
                    <button
                      type="button"
                      onClick={() => removeCategory(cat)}
                      style={{ marginLeft: 6, fontSize: 10, color: 'rgba(232,96,122,0.7)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: 0 }}
                      aria-label={`Remove ${cat}`}
                    >
                      ×
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="h-24" />
      </div>

      <TopBar
        onClose={() => {}}
        step={1}
        totalSteps={2}
        centerLabel="2 of 2"
        leftLabel="Back"
        onLeft={onBack}
        rightLabel="Done →"
        onRight={onNext}
        rightDisabled={!canContinue}
      />
    </motion.div>
  )
}

// ─── Image generation ─────────────────────────────────────────────────────────

async function generatePageImage(
  pageText:   string,
  gradient:   string,
): Promise<string | null> {
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:750px;height:1120px;overflow:hidden;'
  document.body.appendChild(container)

  const card = document.createElement('div')
  card.style.cssText = `position:relative;width:750px;height:1120px;background:#07090f;overflow:hidden;font-family:'DM Sans',sans-serif;`
  container.appendChild(card)

  const bgGradient = document.createElement('div')
  bgGradient.style.cssText = `position:absolute;inset:0;background:${gradient};`
  card.appendChild(bgGradient)

  // Rose brand glow — lower-centre, matches ConfessionCard rose glow
  const glow = document.createElement('div')
  glow.style.cssText = `position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 70% 35% at 50% 90%, rgba(232,96,122,0.10) 0%, transparent 70%);`
  card.appendChild(glow)

  // Equal 72px margins on all four sides
  const content = document.createElement('div')
  content.style.cssText = `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:72px;`
  card.appendChild(content)

  const text = document.createElement('p')
  text.style.cssText = `font-family:'Playfair Display',serif;font-size:26px;color:#eeeef0;line-height:2.0;letter-spacing:0.01em;text-align:left;width:100%;margin:0;white-space:pre-wrap;`
  text.textContent = pageText
  content.appendChild(text)

  try {
    const dataUrl = await toJpeg(card, {
      quality:         0.92,
      width:           750,
      height:          1120,
      pixelRatio:      2,
      backgroundColor: '#07090f',
      fontEmbedCSS:    '',
    })
    return dataUrl
  } catch {
    return null
  } finally {
    document.body.removeChild(container)
  }
}

async function uploadImageDataUrl(dataUrl: string, n: number): Promise<string | null> {
  try {
    const blob = await fetch(dataUrl).then(r => r.blob())
    const file = new File([blob], `confession-page-${n}.jpg`, { type: 'image/jpeg' })
    const res  = await fetch('/api/upload/file', {
      method:      'PUT',
      headers:     { 'Content-Type': 'image/jpeg' },
      body:        file,
      credentials: 'include',
    })
    if (!res.ok) return null
    const { cdnUrl } = await res.json()
    return cdnUrl as string
  } catch {
    return null
  }
}

// ─── STEP 3 — Generating overlay ──────────────────────────────────────────────

function StepGenerating({ progress }: { progress: number }) {
  const [phraseIdx, setPhraseIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setPhraseIdx(i => (i + 1) % LOADING_PHRASES.length)
    }, 1200)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center" style={{ background: '#07090f' }}>
      <div className="fixed inset-0 pointer-events-none z-[1000] opacity-60" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")` }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(232,96,122,0.08) 0%, transparent 70%)' }} />

      <div className="relative z-10 flex flex-col items-center gap-6 px-8 max-w-[360px] w-full">
        <AnimatePresence mode="wait">
          <motion.p
            key={phraseIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#eeeef0', textAlign: 'center', lineHeight: 1.4 }}
          >
            {LOADING_PHRASES[phraseIdx]}
          </motion.p>
        </AnimatePresence>

        <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center' }}>This takes just a moment.</p>

        <div className="w-full rounded-full overflow-hidden" style={{ height: 3, background: '#1c2333' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: '#e8607a' }}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── STEP 3 — Preview & Publish ───────────────────────────────────────────────

function StepPreview({
  pageImageUrls,
  title,
  alias,
  selectedCategories,
  onBack,
  onPublish,
  publishing,
  publishError,
}: {
  pageImageUrls:       string[]
  title:               string
  alias:               string
  selectedCategories:  string[]
  onBack:              () => void
  onPublish:           () => void
  publishing:          boolean
  publishError:        string | null
}) {
  const [currentPage, setCurrentPage] = useState(0)
  const [direction, setDirection]     = useState(0)
  const touchRef = useRef({ startX: 0 })

  const goTo = (i: number) => {
    if (i < 0 || i >= pageImageUrls.length) return
    setDirection(i > currentPage ? 1 : -1)
    setCurrentPage(i)
  }

  const handleTouchStart = (e: React.TouchEvent) => { touchRef.current.startX = e.touches[0].clientX }
  const handleTouchEnd   = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchRef.current.startX
    if (dx < -50) goTo(currentPage + 1)
    else if (dx > 50) goTo(currentPage - 1)
  }

  const imgVariants = {
    enter:  (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
      style={{ background: '#07090f', minHeight: '100vh', paddingTop: 56 }}
    >
      <NoisGlow />

      <div className="w-full max-w-[480px] mx-auto px-5 py-8 flex flex-col items-center">

        {/* Title */}
        {title && (
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#eeeef0', fontStyle: 'italic', textAlign: 'center', marginBottom: 12 }}>
            {title}
          </p>
        )}

        {/* Category chips */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5 justify-center">
            {selectedCategories.slice(0, 4).map(cat => (
              <span
                key={cat}
                className="text-[11px] px-[10px] py-1 rounded-full text-[#e8607a]"
                style={{ border: '1px solid rgba(232,96,122,0.3)', background: 'rgba(232,96,122,0.08)' }}
              >
                {cat}
              </span>
            ))}
            {selectedCategories.length > 4 && (
              <span className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">
                +{selectedCategories.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Image carousel */}
        <div
          className="relative w-full overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ minHeight: '55vh' }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentPage}
              custom={direction}
              variants={imgVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <img
                src={pageImageUrls[currentPage]}
                alt={`Confession page ${currentPage + 1}`}
                style={{ maxWidth: 380, width: '100%', borderRadius: 12, display: 'block', margin: '0 auto' }}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Page dots */}
        {pageImageUrls.length > 1 && (
          <div className="flex gap-[6px] mt-4">
            {pageImageUrls.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className="rounded-full transition-all duration-150"
                style={{ width: i === currentPage ? 18 : 6, height: 6, background: i === currentPage ? '#e8607a' : '#1c2333', border: 'none', cursor: 'pointer', padding: 0 }}
              />
            ))}
          </div>
        )}

        {/* Author */}
        <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', marginTop: 10 }}>{alias}</p>

        {/* Error */}
        {publishError && (
          <div className="w-full mt-5 rounded-[10px] px-4 py-3" style={{ background: 'rgba(232,96,122,0.1)', border: '1px solid rgba(232,96,122,0.3)', color: '#e8607a', fontSize: 13 }}>
            {publishError}
          </div>
        )}

        {/* Publish CTA */}
        <button
          type="button"
          onClick={onPublish}
          disabled={publishing}
          className="w-full mt-6 mb-10 flex items-center justify-center gap-3 rounded-[10px] text-white font-medium transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(232,96,122,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          style={{ background: '#e8607a', border: 'none', padding: '14px 22px', fontSize: 14, cursor: publishing ? 'not-allowed' : 'pointer' }}
        >
          {publishing ? (
            <>
              <Loader2 size={16} color="white" className="animate-spin" style={{ opacity: 0.8 }} />
              Sending into the dark…
            </>
          ) : (
            'Publish my confession →'
          )}
        </button>
      </div>

      <TopBar
        onClose={() => {}}
        step={1}
        totalSteps={2}
        centerLabel="Preview"
        leftLabel="Back"
        onLeft={onBack}
        rightLabel=""
        onRight={() => {}}
      />
    </motion.div>
  )
}

// ─── Main composer ────────────────────────────────────────────────────────────

type ComposerStep = 'canvas' | 'meta' | 'generating' | 'preview'

function CreatePageInner() {
  const router            = useRouter()
  const searchParams      = useSearchParams()
  const { data: session } = useSession()
  const isStoryMode       = searchParams.get('type') === 'story'
  const MAX_CHARS_CURRENT = isStoryMode ? 1500 : MAX_CHARS

  // Replace the current history entry so back-nav from / never returns here
  useEffect(() => { router.replace(isStoryMode ? '/create?type=story' : '/create') }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [step, setStep]                           = useState<ComposerStep>('canvas')
  const [pages, setPages]                         = useState<string[]>([''])
  const [pageIndex, setPageIndex]                 = useState(0)
  const [title, setTitle]                         = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [generatedImages, setGeneratedImages]     = useState<string[]>([])
  const [genProgress, setGenProgress]             = useState(0)
  const [publishing, setPublishing]               = useState(false)
  const [publishError, setPublishError]           = useState<string | null>(null)

  const alias = session?.user?.alias ?? '@you'

  // ─── Image generation ───────────────────────────────────────────────────────

  const runGeneration = useCallback(async () => {
    setStep('generating')
    setGenProgress(0)

    const filledPages  = pages.filter(p => p.trim().length > 0)
    const primaryCat   = selectedCategories[0] ?? 'default'
    const gradient     = GRADIENT_MAP[primaryCat] ?? GRADIENT_MAP['default']
    const urls: string[] = []
    const total        = filledPages.length

    for (let i = 0; i < total; i++) {
      const dataUrl = await generatePageImage(filledPages[i], gradient)
      if (dataUrl) {
        const cdnUrl = await uploadImageDataUrl(dataUrl, i + 1)
        urls.push(cdnUrl ?? dataUrl)
      } else {
        urls.push('')
      }
      setGenProgress(Math.round(((i + 1) / total) * 100))
    }

    setGeneratedImages(urls)
    setStep('preview')
  }, [pages, selectedCategories])

  // ─── Publish ────────────────────────────────────────────────────────────────

  const handlePublish = useCallback(async () => {
    setPublishing(true)
    setPublishError(null)
    try {
      const filledPages = pages.filter(p => p.trim().length > 0)
      const res = await fetch('/api/stories', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          pages:         filledPages,
          pageImageUrls: generatedImages,
          title:         title || '',
          categories:    selectedCategories,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Something went wrong.')
      setTimeout(() => router.replace('/'), 600)
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Something slipped. Try again.')
      setPublishing(false)
    }
  }, [pages, generatedImages, title, selectedCategories, router])

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ minHeight: '100vh', background: '#07090f' }}
    >
      <AnimatePresence mode="wait">
        {step === 'canvas' && (
          <StepCanvas
            key="canvas"
            pages={pages}
            setPages={setPages}
            pageIndex={pageIndex}
            setPageIndex={setPageIndex}
            onClose={() => router.push('/')}
            onNext={() => setStep('meta')}
            maxChars={MAX_CHARS_CURRENT}
          />
        )}

        {step === 'meta' && (
          <StepMeta
            key="meta"
            title={title}
            setTitle={setTitle}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            onBack={() => setStep('canvas')}
            onNext={runGeneration}
            isStoryMode={isStoryMode}
          />
        )}

        {step === 'generating' && (
          <StepGenerating key="generating" progress={genProgress} />
        )}

        {step === 'preview' && (
          <StepPreview
            key="preview"
            pageImageUrls={generatedImages}
            title={title}
            alias={alias}
            selectedCategories={selectedCategories}
            onBack={() => setStep('meta')}
            onPublish={handlePublish}
            publishing={publishing}
            publishError={publishError}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function CreatePage() {
  return (
    <Suspense>
      <CreatePageInner />
    </Suspense>
  )
}
