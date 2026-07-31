'use client'

import { useState, useRef } from 'react'
import { toJpeg } from 'html-to-image'
import { paginateText } from '@/lib/paginateText'

// ─── Constants — keep in sync with create/page.tsx ───────────────────────────

const GRADIENT_MAP: Record<string, string> = {
  Romantic: 'linear-gradient(180deg, #1c0c1e 0%, #07090f 35%, #07090f 65%, #120818 100%)',
  Intense: 'linear-gradient(180deg, #0e0b1e 0%, #07090f 35%, #07090f 65%, #10091a 100%)',
  Confessions: 'linear-gradient(180deg, #11101e 0%, #07090f 35%, #07090f 65%, #0d0a1a 100%)',
  'Dark Romance': 'linear-gradient(180deg, #1a0c1c 0%, #07090f 35%, #07090f 65%, #130818 100%)',
  BDSM: 'linear-gradient(180deg, #0e0b1e 0%, #07090f 35%, #07090f 65%, #100918 100%)',
  default: 'linear-gradient(180deg, #10101e 0%, #07090f 35%, #07090f 65%, #0d0b1c 100%)',
}

// story_category_id → category name for gradient lookup
const CATEGORY_ID_MAP: Record<number, string> = {
  45: 'Confessions',
  46: 'Intense', // Erotica
  47: 'Dark Romance', // Cheating & Affairs
  48: 'BDSM', // Taboo & Forbidden
  49: 'BDSM', // BDSM & Kink
  50: 'Dark Romance', // Incest & Step-Family
  51: 'Romantic', // Workplace & Office
  52: 'Romantic', // College & Campus
  53: 'Intense', // One Night Stand
  54: 'Intense', // Group Sex
  55: 'Dark Romance', // Cuckolding & Hotwife
  56: 'Intense', // Public & Exhibitionism
  57: 'Romantic', // Friends & Neighbors
  58: 'Dark Romance', // Revenge & Power
  59: 'Confessions', // Audio Script
  60: 'Romantic', // Slow Burn
  61: 'Intense', // Roleplay
  62: 'Romantic', // First Time
}

// ─── Image helpers — exact copy from create/page.tsx ─────────────────────────

async function generatePageImage(pageText: string, gradient: string): Promise<string | null> {
  const container = document.createElement('div')
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:750px;height:1120px;overflow:hidden;'
  document.body.appendChild(container)

  const card = document.createElement('div')
  card.style.cssText = `position:relative;width:750px;height:1120px;background:#07090f;overflow:hidden;font-family:'DM Sans',sans-serif;`
  container.appendChild(card)

  const bgGradient = document.createElement('div')
  bgGradient.style.cssText = `position:absolute;inset:0;background:${gradient};`
  card.appendChild(bgGradient)

  const glow = document.createElement('div')
  glow.style.cssText = `position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 70% 35% at 50% 90%, rgba(232,96,122,0.10) 0%, transparent 70%);`
  card.appendChild(glow)

  const content = document.createElement('div')
  content.style.cssText = `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:72px;`
  card.appendChild(content)

  const text = document.createElement('p')
  text.style.cssText = `font-family:'Playfair Display',serif;font-size:26px;color:#eeeef0;line-height:2.0;letter-spacing:0.01em;text-align:left;width:100%;margin:0;white-space:pre-wrap;`
  text.textContent = pageText
  content.appendChild(text)

  try {
    const dataUrl = await toJpeg(card, {
      quality: 0.92,
      width: 750,
      height: 1120,
      pixelRatio: 2,
      backgroundColor: '#07090f',
      fontEmbedCSS: '',
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
    const blob = await fetch(dataUrl).then((r) => r.blob())
    const file = new File([blob], `confession-page-${n}.jpg`, { type: 'image/jpeg' })
    const res = await fetch('/api/upload/file', {
      method: 'PUT',
      headers: { 'Content-Type': 'image/jpeg' },
      body: file,
      credentials: 'include',
    })
    if (!res.ok) return null
    const { cdnUrl } = await res.json()
    return cdnUrl as string
  } catch {
    return null
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface NdjsonRecord {
  title: string
  body: string
  excerpt?: string
  story_category_ids?: number[]
  mood_tag_ids?: number[]
  orientation_tag_ids?: number[]
  fantasy_tag_ids?: number[]
  primary_category_id?: number | null
  created_at?: string
}

export default function AdminGeneratePage() {
  const [records, setRecords] = useState<NdjsonRecord[]>([])
  const [startFrom, setStartFrom] = useState(0)
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [processed, setProcessed] = useState(0)
  const [currentTitle, setCurrentTitle] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const pauseRef = useRef(false)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = text
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => JSON.parse(l) as NdjsonRecord)
      setRecords(parsed)
      setProcessed(0)
      setErrors([])
    }
    reader.readAsText(file)
  }

  async function start() {
    if (!records.length) return
    setRunning(true)
    setPaused(false)
    pauseRef.current = false
    setErrors([])

    const slice = records.slice(startFrom)

    for (let i = 0; i < slice.length; i++) {
      if (pauseRef.current) {
        setPaused(true)
        setRunning(false)
        return
      }

      const record = slice[i]
      const absoluteIdx = startFrom + i
      setCurrentTitle(record.title ?? `Record #${absoluteIdx}`)

      try {
        // Split body into pages, max 4
        const allPages = paginateText(record.body ?? '', 700)
        const pages = allPages.slice(0, 4)

        // Gradient from first category id
        const firstCatId = record.story_category_ids?.[0]
        const catName = firstCatId != null ? (CATEGORY_ID_MAP[firstCatId] ?? 'default') : 'default'
        const gradient = GRADIENT_MAP[catName] ?? GRADIENT_MAP['default']

        // Generate + upload each page image
        const pageImageUrls: string[] = []
        for (let p = 0; p < pages.length; p++) {
          const dataUrl = await generatePageImage(pages[p], gradient)
          if (dataUrl) {
            const cdnUrl = await uploadImageDataUrl(dataUrl, p + 1)
            pageImageUrls.push(cdnUrl ?? dataUrl)
          }
        }

        // POST to single endpoint
        const res = await fetch('/api/admin/stories/single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: record.title,
            body: record.body,
            excerpt: record.excerpt ?? record.body?.slice(0, 280) ?? '',
            pageImageUrls,
            story_category_ids: record.story_category_ids ?? [],
            mood_tag_ids: record.mood_tag_ids ?? [],
            orientation_tag_ids: record.orientation_tag_ids ?? [],
            fantasy_tag_ids: record.fantasy_tag_ids ?? [],
            primary_category_id: record.primary_category_id ?? null,
            created_at: record.created_at ?? new Date().toISOString(),
          }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }))
          setErrors((prev) => [
            ...prev,
            `#${absoluteIdx} "${record.title}": ${err.error ?? 'failed'}`,
          ])
        }
      } catch (err) {
        setErrors((prev) => [
          ...prev,
          `#${absoluteIdx} "${record.title}": ${err instanceof Error ? err.message : 'unknown error'}`,
        ])
      }

      setProcessed(absoluteIdx + 1)

      // 300ms cooldown between stories
      await new Promise((res) => setTimeout(res, 300))
    }

    setRunning(false)
    setCurrentTitle('')
  }

  function pause() {
    pauseRef.current = true
  }

  const total = records.length
  const progressPct = total > 0 ? Math.round((processed / total) * 100) : 0

  return (
    <div
      style={{
        background: '#07090f',
        minHeight: '100vh',
        color: '#eeeef0',
        padding: '40px',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 28,
          marginBottom: 8,
          color: '#eeeef0',
        }}
      >
        Admin — Generate Story Images
      </h1>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 32 }}>
        Reads scraped_stories_remapped.ndjson, renders page images, uploads to R2, inserts stories.
      </p>

      {/* File input */}
      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            display: 'block',
            fontSize: 12,
            color: '#6b7280',
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          NDJSON file
        </label>
        <input
          type="file"
          accept=".ndjson,.jsonl,.json"
          onChange={handleFile}
          style={{
            background: '#111620',
            border: '1px solid #1c2333',
            borderRadius: 10,
            padding: '10px 14px',
            color: '#eeeef0',
            fontSize: 13,
            cursor: 'pointer',
            width: '100%',
            maxWidth: 480,
          }}
        />
        {total > 0 && (
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
            {total.toLocaleString()} records loaded
          </p>
        )}
      </div>

      {/* Start from */}
      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: 'block',
            fontSize: 12,
            color: '#6b7280',
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Start from record #
        </label>
        <input
          type="number"
          min={0}
          max={total > 0 ? total - 1 : 0}
          value={startFrom}
          onChange={(e) => setStartFrom(Number(e.target.value))}
          placeholder="0"
          style={{
            background: '#111620',
            border: '1px solid #1c2333',
            borderRadius: 10,
            padding: '10px 14px',
            color: '#eeeef0',
            fontSize: 13,
            width: 160,
            outline: 'none',
          }}
        />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <button
          onClick={start}
          disabled={running || total === 0}
          style={{
            background: running || total === 0 ? 'rgba(232,96,122,0.4)' : '#e8607a',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '12px 24px',
            fontSize: 13.5,
            fontWeight: 500,
            cursor: running || total === 0 ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {running ? 'Running…' : paused ? 'Resume' : 'Start Generating'}
        </button>

        {running && (
          <button
            onClick={pause}
            style={{
              background: 'transparent',
              color: '#6b7280',
              border: '1px solid #1c2333',
              borderRadius: 10,
              padding: '12px 24px',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Pause
          </button>
        )}
      </div>

      {/* Progress */}
      {(running || processed > 0) && (
        <div style={{ marginBottom: 24, maxWidth: 560 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
              fontSize: 12,
              color: '#6b7280',
            }}
          >
            <span>
              {processed.toLocaleString()} / {total.toLocaleString()} stories processed
            </span>
            <span>{progressPct}%</span>
          </div>
          <div style={{ height: 6, background: '#1c2333', borderRadius: 99, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #e8607a, #c4485e)',
                borderRadius: 99,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          {currentTitle && (
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8, fontStyle: 'italic' }}>
              Processing: {currentTitle}
            </p>
          )}
        </div>
      )}

      {/* Error log */}
      {errors.length > 0 && (
        <div style={{ maxWidth: 700 }}>
          <p style={{ fontSize: 12, color: '#e8607a', marginBottom: 8 }}>
            {errors.length} error{errors.length !== 1 ? 's' : ''}:
          </p>
          <pre
            style={{
              background: '#0d1117',
              border: '1px solid #1c2333',
              borderRadius: 10,
              padding: '16px',
              fontSize: 11,
              color: '#e8607a',
              overflowX: 'auto',
              maxHeight: 320,
              overflowY: 'auto',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {errors.join('\n')}
          </pre>
        </div>
      )}
    </div>
  )
}
