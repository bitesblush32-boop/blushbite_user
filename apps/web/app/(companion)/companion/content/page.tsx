'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Upload, Film, ChevronLeft, ChevronRight } from 'lucide-react'
import { useUploadToR2 } from '@/hooks/useUploadToR2'

// ── Types ──────────────────────────────────────────────────────────────────────

type Tab = 'confessions' | 'stories' | 'photos' | 'videos'

interface StoryItem {
  id: string
  title: string
  excerpt: string | null
  is_published: boolean
  moderation_status: string
  view_count: number
  like_count: number
  created_at: string
}

interface PhotoItem {
  id: string
  url: string
  alt_text: string | null
  is_primary: boolean
  is_approved: boolean
  created_at: string
}

interface VideoItem {
  id: string
  url: string
  duration_seconds: number | null
  thumbnail_url: string | null
  is_approved: boolean
  created_at: string
}

// ── Constants ──────────────────────────────────────────────────────────────────

const MAX_CHARS = 700
const MAX_PAGES = 8

const CATEGORIES = [
  'Romantic', 'Curious', 'Dominant', 'Submissive', 'Experimental',
  'Soft & Gentle', 'Intense', 'Forbidden', 'Dark Romance', 'Slow Burn',
  'Power Dynamic', 'BDSM', 'Confessions', 'Voyeur', 'Sensual',
  'Taboo', 'First Time', 'Roleplay', 'Age Gap', 'Polyamory',
]

const CONF_PLACEHOLDERS = [
  "There's something I've never told anyone...",
  "I keep coming back to that night...",
  "What I want, but never say out loud...",
  "It started so quietly. Then it didn't.",
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: string }) {
  const isApproved = status === 'approved'
  const isPending  = status === 'pending'
  return (
    <span style={{
      fontSize: 10, padding: '2px 8px', borderRadius: 999,
      color:       isApproved ? '#34d399' : isPending ? '#c9a96e' : '#e8607a',
      background:  isApproved ? 'rgba(52,211,153,0.1)' : isPending ? 'rgba(201,169,110,0.1)' : 'rgba(232,96,122,0.1)',
      border:      isApproved ? '1px solid rgba(52,211,153,0.3)' : isPending ? '1px solid rgba(201,169,110,0.3)' : '1px solid rgba(232,96,122,0.3)',
    }}>
      {status}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function CategoryChips({
  selected, onToggle,
}: {
  selected: string[]
  onToggle: (cat: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-[6px]">
      {CATEGORIES.map(cat => {
        const active = selected.includes(cat)
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onToggle(cat)}
            style={{
              fontSize: 11, padding: '4px 12px', borderRadius: 999, cursor: 'pointer',
              border:      active ? '1px solid rgba(232,96,122,0.45)' : '1px solid #1c2333',
              color:       active ? '#e8607a' : '#6b7280',
              background:  active ? 'rgba(232,96,122,0.08)' : 'transparent',
              transition:  'all 0.15s',
            }}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState<Tab>('confessions')

  // ── Fetched content ──
  const [confessions, setConfessions]   = useState<StoryItem[]>([])
  const [storiesList, setStoriesList]   = useState<StoryItem[]>([])
  const [photos, setPhotos]             = useState<PhotoItem[]>([])
  const [videos, setVideos]             = useState<VideoItem[]>([])
  const [loadingContent, setLoadingContent] = useState(true)

  // ── Confession composer ──
  const [confPages, setConfPages]         = useState<string[]>([''])
  const [confPageIdx, setConfPageIdx]     = useState(0)
  const [confCats, setConfCats]           = useState<string[]>([])
  const [publishingConf, setPublishingConf] = useState(false)
  const [confError, setConfError]         = useState<string | null>(null)
  const confPlaceholder = CONF_PLACEHOLDERS[0]

  // ── Story composer ──
  const [storyTitle, setStoryTitle]     = useState('')
  const [storyBody, setStoryBody]       = useState('')
  const [storyExcerpt, setStoryExcerpt] = useState('')
  const [storyCats, setStoryCats]       = useState<string[]>([])
  const [publishingStory, setPublishingStory] = useState(false)
  const [storyError, setStoryError]     = useState<string | null>(null)

  // ── Photo upload ──
  const { uploadFile: uploadPhoto, uploading: uploadingPhoto } = useUploadToR2({ contentFor: 'companion_photo' })
  const photoInputRef = useRef<HTMLInputElement>(null)

  // ── Video upload ──
  const { uploadFile: uploadVideo, uploading: uploadingVideo } = useUploadToR2({ contentFor: 'companion_video' })
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [videoError, setVideoError] = useState<string | null>(null)

  // ── Load content ──
  function refreshContent() {
    return fetch('/api/companions/content', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (!d.error) {
          setConfessions(d.confessions ?? [])
          setStoriesList(d.stories ?? [])
          setPhotos(d.photos ?? [])
          setVideos(d.videos ?? [])
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    refreshContent().finally(() => setLoadingContent(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Confession text handler ──
  const currentConfText  = confPages[confPageIdx] ?? ''
  const confCharCount    = currentConfText.length

  function handleConfTextChange(val: string) {
    const newPages = [...confPages]
    if (val.length > MAX_CHARS) {
      newPages[confPageIdx] = val.slice(0, MAX_CHARS)
      if (confPageIdx + 1 < MAX_PAGES) {
        const overflow = val.slice(MAX_CHARS)
        if (confPageIdx + 1 >= newPages.length) newPages.push(overflow)
        else newPages[confPageIdx + 1] = overflow + newPages[confPageIdx + 1]
        setConfPages(newPages)
        setConfPageIdx(confPageIdx + 1)
        return
      }
    } else {
      newPages[confPageIdx] = val
      // Trim empty trailing pages (keep at least 1)
      while (newPages.length > 1 && !newPages[newPages.length - 1].trim()) newPages.pop()
      if (confPageIdx >= newPages.length) setConfPageIdx(newPages.length - 1)
    }
    setConfPages(newPages)
  }

  function goConfPage(i: number) {
    if (i < 0 || i >= confPages.length) return
    setConfPageIdx(i)
  }

  // ── Publish confession ──
  const handlePublishConf = useCallback(async () => {
    const body = confPages.filter(p => p.trim()).join('\n\n')
    if (!body) { setConfError('Write something first.'); return }
    if (confCats.length === 0) { setConfError('Select at least one category.'); return }
    setPublishingConf(true)
    setConfError(null)
    try {
      const res = await fetch('/api/companions/content/story', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:    JSON.stringify({ type: 'confession', storyBody: body, categories: confCats }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Something went wrong')
      setConfPages([''])
      setConfPageIdx(0)
      setConfCats([])
      await refreshContent()
    } catch (err) {
      setConfError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPublishingConf(false)
    }
  }, [confPages, confCats]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Publish story ──
  const handlePublishStory = useCallback(async () => {
    if (!storyTitle.trim()) { setStoryError('Title is required.'); return }
    if (!storyBody.trim())  { setStoryError('Body is required.'); return }
    if (storyCats.length === 0) { setStoryError('Select at least one category.'); return }
    setPublishingStory(true)
    setStoryError(null)
    try {
      const res = await fetch('/api/companions/content/story', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:    JSON.stringify({
          type:       'story',
          title:      storyTitle.trim(),
          storyBody:  storyBody.trim(),
          excerpt:    storyExcerpt.trim() || null,
          categories: storyCats,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Something went wrong')
      setStoryTitle('')
      setStoryBody('')
      setStoryExcerpt('')
      setStoryCats([])
      await refreshContent()
    } catch (err) {
      setStoryError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPublishingStory(false)
    }
  }, [storyTitle, storyBody, storyExcerpt, storyCats]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Upload photos ──
  async function handlePhotoFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    for (const file of Array.from(files)) {
      const result = await uploadPhoto(file)
      if (result) {
        await fetch('/api/companions/content/photo', {
          method:      'POST',
          headers:     { 'Content-Type': 'application/json' },
          credentials: 'include',
          body:        JSON.stringify({ url: result.cdnUrl, storage_key: result.s3Key }),
        })
      }
    }
    await refreshContent()
  }

  // ── Upload video ──
  async function handleVideoFile(files: FileList | null) {
    if (!files || files.length === 0) return
    setVideoError(null)
    if (videos.length >= 3) { setVideoError('Maximum 3 videos allowed.'); return }
    const result = await uploadVideo(files[0])
    if (result) {
      const res = await fetch('/api/companions/content/video', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ url: result.cdnUrl, storage_key: result.s3Key }),
      })
      if (!res.ok) {
        const json = await res.json()
        setVideoError(json.error ?? 'Upload failed')
        return
      }
      await refreshContent()
    }
  }

  // ── Toggle category ──
  function toggleCat(cats: string[], setCats: (v: string[]) => void, cat: string) {
    setCats(cats.includes(cat) ? cats.filter(c => c !== cat) : [...cats, cat])
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Page heading */}
      <div className="mb-6">
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: '#eeeef0', marginBottom: 6 }}>
          My Content
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280' }}>Write, upload, and manage everything you share on the platform.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-8 p-1 rounded-[12px]" style={{ background: '#111620', border: '1px solid #1c2333', width: 'fit-content' }}>
        {(['confessions', 'stories', 'photos', 'videos'] as Tab[]).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              fontSize: 12.5, fontWeight: activeTab === tab ? 500 : 400,
              color:       activeTab === tab ? '#eeeef0' : '#6b7280',
              background:  activeTab === tab ? 'rgba(232,96,122,0.12)' : 'transparent',
              border:      activeTab === tab ? '1px solid rgba(232,96,122,0.25)' : '1px solid transparent',
              borderRadius: 8, padding: '7px 18px', cursor: 'pointer', transition: 'all 0.15s',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">

        {/* ── CONFESSIONS TAB ────────────────────────────────────────────── */}
        {activeTab === 'confessions' && (
          <motion.div
            key="confessions"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {/* Canvas composer card */}
            <div style={{ background: '#0d1117', border: '1px solid #1c2333', borderRadius: 16, overflow: 'hidden', marginBottom: 28 }}>
              <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(232,96,122,0.35), transparent)' }} />
              <div style={{ padding: '28px 32px' }}>

                <p style={{ fontSize: 10, color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20, fontWeight: 500 }}>
                  Write a confession
                </p>

                {/* Page navigation arrows + textarea */}
                <div className="relative">
                  {confPageIdx > 0 && (
                    <button
                      type="button"
                      onClick={() => goConfPage(confPageIdx - 1)}
                      className="absolute left-[-28px] top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center"
                      style={{ color: '#2a3040', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <ChevronLeft size={18} />
                    </button>
                  )}

                  <textarea
                    value={currentConfText}
                    onChange={e => handleConfTextChange(e.target.value)}
                    placeholder={confPlaceholder}
                    className="w-full bg-transparent border-none outline-none resize-none"
                    rows={9}
                    style={{
                      fontFamily:    "'Playfair Display', serif",
                      fontSize:      17,
                      color:         '#eeeef0',
                      lineHeight:    1.9,
                      letterSpacing: '0.01em',
                      caretColor:    '#e8607a',
                    }}
                  />

                  {confPageIdx < confPages.length - 1 && (
                    <button
                      type="button"
                      onClick={() => goConfPage(confPageIdx + 1)}
                      className="absolute right-[-28px] top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center"
                      style={{ color: '#2a3040', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <ChevronRight size={18} />
                    </button>
                  )}
                </div>

                {/* Char count + page dots */}
                <div className="flex items-center justify-between mt-2 mb-6">
                  <div className="flex gap-[6px] items-center">
                    {confPages.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => goConfPage(i)}
                        style={{
                          width: i === confPageIdx ? 18 : 6, height: 6,
                          borderRadius: 999, padding: 0, border: 'none', cursor: 'pointer',
                          background: i === confPageIdx ? '#e8607a' : '#1c2333',
                          transition: 'all 0.15s',
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: '#2a3040' }}>{confCharCount} / {MAX_CHARS}</span>
                </div>

                {/* Category chips */}
                <div className="mb-6">
                  <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 10 }}>What is this about?</p>
                  <CategoryChips
                    selected={confCats}
                    onToggle={cat => toggleCat(confCats, setConfCats, cat)}
                  />
                </div>

                {confError && <p style={{ fontSize: 12, color: '#e8607a', marginBottom: 12 }}>{confError}</p>}

                <button
                  type="button"
                  onClick={handlePublishConf}
                  disabled={publishingConf || !confPages.some(p => p.trim())}
                  className="flex items-center gap-2 rounded-[10px] text-white font-medium transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(232,96,122,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{ background: '#e8607a', border: 'none', padding: '10px 22px', fontSize: 13, cursor: 'pointer' }}
                >
                  {publishingConf
                    ? <><Loader2 size={14} className="animate-spin" />Publishing…</>
                    : 'Publish confession →'}
                </button>
              </div>
            </div>

            {/* Existing confessions list */}
            {confessions.length > 0 && (
              <>
                <p style={{ fontSize: 10, color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 500 }}>
                  Your confessions ({confessions.length})
                </p>
                <div className="flex flex-col gap-3">
                  {confessions.map(c => (
                    <div key={c.id} style={{ background: '#111620', border: '1px solid #1c2333', borderRadius: 12, padding: '14px 18px' }}>
                      <div className="flex items-center justify-between gap-3">
                        <p style={{ fontSize: 13, color: '#eeeef0', flex: 1 }}>{c.title || 'Untitled confession'}</p>
                        <StatusChip status={c.moderation_status} />
                      </div>
                      <p style={{ fontSize: 11, color: '#6b7280', marginTop: 5 }}>
                        {formatDate(c.created_at)} · {c.view_count} views · {c.like_count} likes
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!loadingContent && confessions.length === 0 && (
              <p style={{ fontSize: 13, color: '#6b7280', fontStyle: 'italic' }}>Nothing here yet. Your first confession awaits.</p>
            )}
          </motion.div>
        )}

        {/* ── STORIES TAB ────────────────────────────────────────────────── */}
        {activeTab === 'stories' && (
          <motion.div
            key="stories"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <div style={{ background: '#111620', border: '1px solid #1c2333', borderRadius: 16, padding: '28px 32px', marginBottom: 28 }}>
              <p style={{ fontSize: 10, color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 24, fontWeight: 500 }}>New story</p>

              {/* Title */}
              <div className="mb-5">
                <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>Title *</p>
                <input
                  type="text"
                  value={storyTitle}
                  onChange={e => setStoryTitle(e.target.value.slice(0, 200))}
                  placeholder="Give your story a name..."
                  className="w-full bg-[#161d2a] border border-[#1c2333] rounded-[10px] px-4 text-[14px] text-[#eeeef0] outline-none"
                  style={{ paddingTop: 11, paddingBottom: 11, transition: 'border-color 0.15s, box-shadow 0.15s' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#e8607a'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,96,122,0.1)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#1c2333'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>

              {/* Excerpt */}
              <div className="mb-5">
                <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
                  Excerpt <span style={{ color: '#4b5563' }}>(optional)</span>
                </p>
                <input
                  type="text"
                  value={storyExcerpt}
                  onChange={e => setStoryExcerpt(e.target.value.slice(0, 300))}
                  placeholder="A one-line tease to draw readers in..."
                  className="w-full bg-[#161d2a] border border-[#1c2333] rounded-[10px] px-4 text-[13px] text-[#eeeef0] outline-none"
                  style={{ paddingTop: 10, paddingBottom: 10, transition: 'border-color 0.15s, box-shadow 0.15s' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#e8607a'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,96,122,0.1)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#1c2333'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>

              {/* Body */}
              <div className="mb-6">
                <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>Story body *</p>
                <textarea
                  value={storyBody}
                  onChange={e => setStoryBody(e.target.value)}
                  placeholder="Begin your story here..."
                  rows={10}
                  className="w-full bg-[#161d2a] border border-[#1c2333] rounded-[10px] px-4 text-[14px] text-[#eeeef0] outline-none resize-none"
                  style={{
                    paddingTop: 12, paddingBottom: 12,
                    fontFamily: "'Playfair Display', serif",
                    lineHeight: 1.8,
                    caretColor: '#e8607a',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#e8607a'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,96,122,0.1)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#1c2333'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>

              {/* Categories */}
              <div className="mb-6">
                <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 10 }}>Categories *</p>
                <CategoryChips
                  selected={storyCats}
                  onToggle={cat => toggleCat(storyCats, setStoryCats, cat)}
                />
              </div>

              {storyError && <p style={{ fontSize: 12, color: '#e8607a', marginBottom: 12 }}>{storyError}</p>}

              <button
                type="button"
                onClick={handlePublishStory}
                disabled={publishingStory || !storyTitle.trim() || !storyBody.trim()}
                className="flex items-center gap-2 rounded-[10px] text-white font-medium transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(232,96,122,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{ background: '#e8607a', border: 'none', padding: '10px 22px', fontSize: 13, cursor: 'pointer' }}
              >
                {publishingStory
                  ? <><Loader2 size={14} className="animate-spin" />Publishing…</>
                  : 'Publish story →'}
              </button>
            </div>

            {/* Stories list */}
            {storiesList.length > 0 && (
              <>
                <p style={{ fontSize: 10, color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 500 }}>
                  Your stories ({storiesList.length})
                </p>
                <div className="flex flex-col gap-3">
                  {storiesList.map(s => (
                    <div key={s.id} style={{ background: '#111620', border: '1px solid #1c2333', borderRadius: 12, padding: '14px 18px' }}>
                      <div className="flex items-center justify-between gap-3">
                        <p style={{ fontSize: 13, color: '#eeeef0', fontFamily: "'Playfair Display', serif", flex: 1 }}>{s.title}</p>
                        <StatusChip status={s.moderation_status} />
                      </div>
                      {s.excerpt && (
                        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 1.5 }}>{s.excerpt}</p>
                      )}
                      <p style={{ fontSize: 11, color: '#4b5563', marginTop: 5 }}>
                        {formatDate(s.created_at)} · {s.view_count} views · {s.like_count} likes
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!loadingContent && storiesList.length === 0 && (
              <p style={{ fontSize: 13, color: '#6b7280', fontStyle: 'italic' }}>Nothing here yet. Your taste is still forming.</p>
            )}
          </motion.div>
        )}

        {/* ── PHOTOS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'photos' && (
          <motion.div
            key="photos"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {/* Upload zone */}
            <div
              style={{
                background: '#111620', border: '2px dashed #1c2333', borderRadius: 16,
                padding: '40px 24px', textAlign: 'center', marginBottom: 28,
                cursor: uploadingPhoto ? 'default' : 'pointer', transition: 'border-color 0.15s',
              }}
              onClick={() => !uploadingPhoto && photoInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); if (!uploadingPhoto) e.currentTarget.style.borderColor = 'rgba(232,96,122,0.4)' }}
              onDragLeave={e => { e.currentTarget.style.borderColor = '#1c2333' }}
              onDrop={async e => {
                e.preventDefault()
                e.currentTarget.style.borderColor = '#1c2333'
                await handlePhotoFiles(e.dataTransfer.files)
              }}
              onMouseEnter={e => { if (!uploadingPhoto) e.currentTarget.style.borderColor = 'rgba(232,96,122,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1c2333' }}
            >
              {uploadingPhoto
                ? <Loader2 size={24} color="#e8607a" className="animate-spin" style={{ margin: '0 auto 12px' }} />
                : <Upload size={24} color="#6b7280" style={{ margin: '0 auto 12px' }} />
              }
              <p style={{ fontSize: 13, color: '#eeeef0', marginBottom: 4 }}>
                {uploadingPhoto ? 'Uploading...' : 'Drop photos here, or click to browse'}
              </p>
              <p style={{ fontSize: 11, color: '#6b7280' }}>JPEG · PNG · WebP · Max 10MB each</p>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                style={{ display: 'none' }}
                onChange={e => handlePhotoFiles(e.target.files)}
              />
            </div>

            {/* Photo grid */}
            {photos.length > 0 && (
              <>
                <p style={{ fontSize: 10, color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 500 }}>
                  Your photos ({photos.length})
                </p>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {photos.map(photo => (
                    <div
                      key={photo.id}
                      className="relative aspect-[3/4] rounded-[10px] overflow-hidden"
                      style={{ background: 'linear-gradient(135deg,#1a1228,#2a1535)' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.alt_text ?? 'Photo'}
                        className="w-full h-full object-cover"
                      />
                      {photo.is_primary && (
                        <div className="absolute top-2 left-2" style={{ background: 'rgba(201,169,110,0.9)', borderRadius: 5, padding: '2px 6px', fontSize: 9, color: '#07090f', fontWeight: 700 }}>
                          PRIMARY
                        </div>
                      )}
                      {!photo.is_approved && (
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <span style={{ display: 'block', textAlign: 'center', background: 'rgba(7,9,15,0.8)', borderRadius: 6, padding: '3px 6px', fontSize: 9, color: '#c9a96e', fontWeight: 600 }}>
                            Pending review
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {!loadingContent && photos.length === 0 && (
              <p style={{ fontSize: 13, color: '#6b7280', fontStyle: 'italic' }}>No photos yet. Upload your first to bring your profile to life.</p>
            )}
          </motion.div>
        )}

        {/* ── VIDEOS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'videos' && (
          <motion.div
            key="videos"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p style={{ fontSize: 13, color: '#eeeef0', fontWeight: 500 }}>Short clips</p>
                <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                  Up to 3 clips · Max 15 seconds each · These appear on your profile.
                </p>
              </div>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{videos.length} / 3</span>
            </div>

            {/* Upload zone */}
            {videos.length < 3 && (
              <div
                style={{
                  background: '#111620', border: '2px dashed #1c2333', borderRadius: 16,
                  padding: '40px 24px', textAlign: 'center', marginBottom: 24, marginTop: 16,
                  cursor: uploadingVideo ? 'default' : 'pointer', transition: 'border-color 0.15s',
                }}
                onClick={() => !uploadingVideo && videoInputRef.current?.click()}
                onMouseEnter={e => { if (!uploadingVideo) e.currentTarget.style.borderColor = 'rgba(232,96,122,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1c2333' }}
              >
                {uploadingVideo
                  ? <Loader2 size={24} color="#e8607a" className="animate-spin" style={{ margin: '0 auto 12px' }} />
                  : <Film size={24} color="#6b7280" style={{ margin: '0 auto 12px' }} />
                }
                <p style={{ fontSize: 13, color: '#eeeef0', marginBottom: 4 }}>
                  {uploadingVideo ? 'Uploading...' : 'Upload a clip'}
                </p>
                <p style={{ fontSize: 11, color: '#6b7280' }}>MP4 · Max 15 seconds · Max 100MB</p>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  style={{ display: 'none' }}
                  onChange={e => handleVideoFile(e.target.files)}
                />
              </div>
            )}

            {videoError && <p style={{ fontSize: 12, color: '#e8607a', marginBottom: 12 }}>{videoError}</p>}

            {/* Videos list */}
            {videos.length > 0 && (
              <div className="flex flex-col gap-3">
                {videos.map((video, i) => (
                  <div key={video.id} style={{ background: '#111620', border: '1px solid #1c2333', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 8, flexShrink: 0,
                      background: 'linear-gradient(135deg,#16101e,#2a1040)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Film size={18} color="#e8607a" />
                    </div>
                    <div className="flex-1">
                      <p style={{ fontSize: 13, color: '#eeeef0' }}>Clip {i + 1}</p>
                      <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                        {video.duration_seconds != null ? `${video.duration_seconds}s` : 'Duration unknown'}
                        {' · '}
                        {video.is_approved
                          ? <span style={{ color: '#34d399' }}>Approved</span>
                          : <span style={{ color: '#c9a96e' }}>Pending review</span>
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loadingContent && videos.length === 0 && (
              <p style={{ fontSize: 13, color: '#6b7280', fontStyle: 'italic' }}>No clips yet. A 15-second glimpse can say everything.</p>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  )
}
