'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import { Upload, Loader2, Check } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface TagsData {
  moodTags: Array<{ id: number; name: string; slug: string; emoji: string | null }>
  orientationTags: Array<{ id: number; name: string; slug: string }>
  fantasyTags: Array<{ id: number; name: string; slug: string; category_id: number }>
  storyCategories: Array<{ id: number; name: string; slug: string }>
}

interface ImportItem {
  title?: string
  body?: string
  raw_text?: string
  categories?: string[]
  mood_tags?: string[]
  orientation_tags?: string[]
  fantasy_tags?: string[]
  source_url?: string
}

// ── Multi-select chips ─────────────────────────────────────────────────────

function MultiChips<T extends { id: number; name: string; emoji?: string | null }>({
  label,
  items,
  selected,
  max,
  onChange,
}: {
  label: string
  items: T[]
  selected: number[]
  max: number
  onChange: (ids: number[]) => void
}) {
  const toggle = (id: number) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id))
    } else if (selected.length < max) {
      onChange([...selected, id])
    }
  }
  return (
    <div className="mb-4">
      <div className="text-[11px] text-[#6b7280] uppercase tracking-[0.05em] mb-2">
        {label} (max {max})
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((t) => {
          const active = selected.includes(t.id)
          return (
            <button
              key={t.id}
              onClick={() => toggle(t.id)}
              className="text-[11px] px-[10px] py-1 rounded-full cursor-pointer transition-all duration-150"
              style={{
                borderColor: active ? '#e8607a' : '#1c2333',
                color: active ? '#e8607a' : '#6b7280',
                background: active ? 'rgba(232,96,122,0.08)' : 'transparent',
                border: `1px solid ${active ? '#e8607a' : '#1c2333'}`,
              }}
            >
              {t.emoji ? `${t.emoji} ` : ''}
              {t.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Toggle switch ──────────────────────────────────────────────────────────

function Toggle({
  value,
  onChange,
  label,
  color = '#e8607a',
}: {
  value: boolean
  onChange: (v: boolean) => void
  label: string
  color?: string
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full py-3 border-b border-[#1c2333] last:border-0"
    >
      <span className="text-[13px] text-[#eeeef0]">{label}</span>
      <div
        className="relative w-10 h-5 rounded-full transition-all"
        style={{ background: value ? color : '#1c2333' }}
      >
        <div
          className="absolute top-[3px] w-[14px] h-[14px] rounded-full bg-white transition-all"
          style={{ left: value ? '22px' : '3px' }}
        />
      </div>
    </button>
  )
}

// ── WRITE MODE ─────────────────────────────────────────────────────────────

function WriteMode({ tagsData }: { tagsData: TagsData | undefined }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [moodIds, setMoodIds] = useState<number[]>([])
  const [orientIds, setOrientIds] = useState<number[]>([])
  const [fantasyIds, setFantasyIds] = useState<number[]>([])
  const [autoPublish, setAutoPublish] = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length
  const isValid = title.trim().length > 0 && wordCount >= 50

  const handleSubmit = async (publish: boolean) => {
    if (!isValid || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/content/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body,
          excerpt: excerpt.trim() || undefined,
          category_id: categoryId,
          mood_tag_ids: moodIds,
          orientation_tag_ids: orientIds,
          fantasy_tag_ids: fantasyIds,
          is_featured: isFeatured,
          auto_publish: publish,
          is_anonymous: isAnonymous,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      setSuccess(true)
      setTimeout(() => router.push('/admin/content'), 1200)
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 max-w-[1040px] pb-32">
      {/* Left: editor */}
      <div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your story a title..."
          className="w-full bg-transparent border-0 border-b border-[#1c2333] focus:border-[#e8607a] outline-none pb-3 mb-6 text-[28px] text-[#eeeef0] placeholder-[#6b7280] transition-colors"
          style={{ fontFamily: "'Playfair Display', serif" }}
        />

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your story here. Use the full emotional range of the genre."
          className="w-full bg-[#0d1117] border border-[#1c2333] rounded-[16px] p-6 text-[16px] text-[#eeeef0] placeholder-[#6b7280] outline-none resize-none focus:border-[rgba(232,96,122,0.5)] transition-colors leading-[1.8]"
          style={{ fontFamily: "'Playfair Display', serif", minHeight: 480 }}
        />
        <div className="text-right text-[11px] text-[#6b7280] mt-2">{wordCount} / 2000 words</div>

        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Short excerpt (optional — used in feeds & cards)..."
          rows={3}
          className="w-full bg-[#0d1117] border border-[#1c2333] rounded-[12px] px-4 py-3 mt-4 text-[13px] text-[#eeeef0] placeholder-[#6b7280] outline-none resize-none focus:border-[rgba(232,96,122,0.5)] transition-colors"
        />
      </div>

      {/* Right: metadata panel */}
      <div className="bg-[#111620] border border-[#1c2333] rounded-[16px] p-5 h-fit">
        {/* Category */}
        <div className="mb-4">
          <div className="text-[11px] text-[#6b7280] uppercase tracking-[0.05em] mb-2">
            Category
          </div>
          <select
            value={categoryId ?? ''}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
            className="w-full bg-[#161d2a] border border-[#1c2333] rounded-[8px] px-3 py-2 text-[13px] text-[#eeeef0] outline-none focus:border-[rgba(232,96,122,0.5)] transition-colors"
          >
            <option value="">— No category —</option>
            {tagsData?.storyCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {tagsData && (
          <>
            <MultiChips
              label="Mood tags"
              items={tagsData.moodTags}
              selected={moodIds}
              max={5}
              onChange={setMoodIds}
            />
            <MultiChips
              label="Orientation tags"
              items={tagsData.orientationTags}
              selected={orientIds}
              max={3}
              onChange={setOrientIds}
            />
            <MultiChips
              label="Fantasy tags"
              items={tagsData.fantasyTags}
              selected={fantasyIds}
              max={5}
              onChange={setFantasyIds}
            />
          </>
        )}

        {/* Toggles */}
        <div className="border-t border-[#1c2333] pt-4 mt-2">
          <Toggle
            value={autoPublish}
            onChange={setAutoPublish}
            label="Auto-publish"
            color="#4ade80"
          />
          <Toggle
            value={isFeatured}
            onChange={setIsFeatured}
            label="Feature this story"
            color="#c9a96e"
          />
          <Toggle
            value={isAnonymous}
            onChange={setIsAnonymous}
            label="Mark as anonymous"
            color="#6b7280"
          />
        </div>
      </div>

      {/* Sticky submit bar */}
      <div
        className="fixed bottom-0 left-0 right-0 md:left-[240px] z-[600] border-t border-[#1c2333] px-6 py-4 flex items-center justify-between gap-4"
        style={{ background: 'rgba(13,17,23,0.96)', backdropFilter: 'blur(20px)' }}
      >
        <div className="text-[12px] text-[#6b7280] hidden sm:block">
          {!title.trim() && <span className="mr-3">Title required</span>}
          {wordCount < 50 && <span>Min 50 words ({wordCount} so far)</span>}
          {isValid && <span className="text-[#4ade80]">Ready to publish</span>}
        </div>
        <div className="flex gap-3 ml-auto">
          <button
            onClick={() => handleSubmit(false)}
            disabled={!isValid || submitting}
            className="bg-transparent text-[#6b7280] border border-[#1c2333] px-5 py-[10px] rounded-[10px] text-[13px] cursor-pointer transition-all hover:border-white/20 hover:text-[#eeeef0] disabled:opacity-40"
          >
            Save as draft
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={!isValid || submitting}
            className="bg-[#e8607a] hover:bg-[#c4485e] text-white border-none px-5 py-[10px] rounded-[10px] text-[13px] font-medium cursor-pointer transition-all hover:-translate-y-px disabled:opacity-40 inline-flex items-center gap-2"
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : success ? (
              <Check size={14} />
            ) : null}
            {success ? 'Published ✓' : 'Publish now'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── IMPORT MODE ────────────────────────────────────────────────────────────

function ImportMode() {
  const [parsedItems, setParsedItems] = useState<ImportItem[]>([])
  const [fileName, setFileName] = useState('')
  const [parseError, setParseError] = useState('')
  const [batchSize, setBatchSize] = useState(100)
  const [autoPublish] = useState(true)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    setParseError('')
    setParsedItems([])
    setResult(null)
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter((l) => l.trim())
      const items: ImportItem[] = []
      const errors: string[] = []
      lines.forEach((line, i) => {
        try {
          items.push(JSON.parse(line))
        } catch {
          errors.push(`Line ${i + 1}: invalid JSON`)
        }
      })
      if (errors.length > 3) {
        setParseError(`${errors.length} parse errors. First: ${errors[0]}`)
      } else if (errors.length > 0) {
        setParseError(errors.join(', '))
      }
      setParsedItems(items)
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleImport = async () => {
    if (!parsedItems.length || importing) return
    setImporting(true)
    setResult(null)
    let totalImported = 0
    let totalSkipped = 0
    const batches: ImportItem[][] = []
    for (let i = 0; i < parsedItems.length; i += batchSize) {
      batches.push(parsedItems.slice(i, i + batchSize))
    }
    setProgress({ current: 0, total: parsedItems.length })

    for (const batch of batches) {
      try {
        const res = await fetch('/api/admin/content/bulk-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batch),
        })
        if (res.ok) {
          const data = await res.json()
          totalImported += data.imported ?? 0
          totalSkipped += data.skipped ?? 0
        }
      } catch {
        // continue on batch error
      }
      setProgress((p) => ({ ...p, current: Math.min(p.total, p.current + batch.length) }))
    }

    setResult({ imported: totalImported, skipped: totalSkipped })
    setImporting(false)
  }

  const progressPct = progress.total > 0 ? progress.current / progress.total : 0

  return (
    <div className="max-w-[720px]">
      {/* Instruction box */}
      <div
        className="rounded-[14px] px-5 py-4 mb-6 text-[13px] text-[#c9a96e] leading-[1.6]"
        style={{ background: 'rgba(201,169,110,0.06)', border: '1px solid rgba(201,169,110,0.25)' }}
      >
        Upload your{' '}
        <code className="text-[12px] bg-white/[0.06] px-1 py-[2px] rounded">
          scraped_stories_enriched.ndjson
        </code>{' '}
        file. Each line must be a valid JSON object with{' '}
        <code className="text-[12px] bg-white/[0.06] px-1 py-[2px] rounded">title</code>,{' '}
        <code className="text-[12px] bg-white/[0.06] px-1 py-[2px] rounded">body</code>, and{' '}
        <code className="text-[12px] bg-white/[0.06] px-1 py-[2px] rounded">categories</code>{' '}
        fields.
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="rounded-[20px] p-12 text-center cursor-pointer transition-all mb-6"
        style={{
          border: '2px dashed #1c2333',
          background: parsedItems.length ? 'rgba(74,222,128,0.04)' : 'transparent',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(232,96,122,0.4)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.borderColor = parsedItems.length
            ? 'rgba(74,222,128,0.3)'
            : '#1c2333'
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".ndjson,.json,.txt"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
        />
        {parsedItems.length > 0 ? (
          <>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(74,222,128,0.12)' }}
            >
              <Check size={22} color="#4ade80" />
            </div>
            <div className="text-[15px] text-[#eeeef0] font-medium mb-1">
              {parsedItems.length} stories ready to import
            </div>
            <div className="text-[12px] text-[#6b7280]">{fileName} · Click to change file</div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-[#111620]">
              <Upload size={22} color="#6b7280" />
            </div>
            <div className="text-[15px] text-[#eeeef0] mb-1">
              Drop your NDJSON file here or click to browse
            </div>
            <div className="text-[12px] text-[#6b7280]">Accepts .ndjson · .json · .txt</div>
          </>
        )}
        {parseError && <div className="text-[12px] text-[#ef4444] mt-3">{parseError}</div>}
      </div>

      {/* Preview table */}
      {parsedItems.length > 0 && (
        <div className="bg-[#111620] border border-[#1c2333] rounded-[14px] overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-[#1c2333]">
            <span className="text-[12px] text-[#6b7280] uppercase tracking-[0.05em]">
              Preview (first 5)
            </span>
          </div>
          {parsedItems.slice(0, 5).map((item, i) => {
            const bodyText = item.body ?? item.raw_text ?? ''
            const words = bodyText.trim().split(/\s+/).filter(Boolean).length
            return (
              <div
                key={i}
                className="px-5 py-3 border-b border-[#1c2333] last:border-0 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-[#eeeef0] overflow-hidden text-ellipsis whitespace-nowrap">
                    {item.title ?? '(no title)'}
                  </div>
                  <div className="text-[11px] text-[#6b7280] mt-[2px]">
                    {item.categories?.join(', ') || 'No category'} · {item.mood_tags?.length ?? 0}{' '}
                    mood tags
                  </div>
                </div>
                <span className="text-[11px] text-[#6b7280] flex-shrink-0">{words} words</span>
              </div>
            )
          })}
          {parsedItems.length > 5 && (
            <div className="px-5 py-3 text-[12px] text-[#6b7280]">
              …and {parsedItems.length - 5} more
            </div>
          )}
        </div>
      )}

      {/* Options */}
      {parsedItems.length > 0 && (
        <div className="bg-[#111620] border border-[#1c2333] rounded-[14px] p-5 mb-6">
          <div className="text-[13px] font-medium text-[#eeeef0] mb-4">Import options</div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#eeeef0]">Batch size</span>
              <select
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="bg-[#161d2a] border border-[#1c2333] rounded-[8px] px-3 py-2 text-[13px] text-[#eeeef0] outline-none"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {importing && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] text-[#6b7280]">Importing…</span>
            <span className="text-[12px] text-[#eeeef0]">
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className="h-[6px] bg-[#1c2333] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: '#e8607a', transformOrigin: 'left', scaleX: progressPct }}
              animate={{ scaleX: progressPct }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[14px] px-5 py-4 mb-6 text-[13px] text-[#4ade80]"
            style={{
              background: 'rgba(74,222,128,0.06)',
              border: '1px solid rgba(74,222,128,0.25)',
            }}
          >
            ✓ {result.imported} stories imported.
            {result.skipped > 0 ? ` ${result.skipped} skipped (unmapped categories).` : ''}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import button */}
      {parsedItems.length > 0 && !result && (
        <button
          onClick={handleImport}
          disabled={importing}
          className="bg-[#e8607a] hover:bg-[#c4485e] text-white border-none px-6 py-[12px] rounded-[10px] text-[13.5px] font-medium cursor-pointer transition-all hover:-translate-y-px disabled:opacity-50 inline-flex items-center gap-2"
        >
          {importing ? <Loader2 size={14} className="animate-spin" /> : null}
          {importing ? 'Importing…' : `Import ${parsedItems.length} Stories →`}
        </button>
      )}
    </div>
  )
}

// ── Inner page (uses useSearchParams) ──────────────────────────────────────

function CreatePageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode = searchParams.get('mode') ?? 'write'

  const { data: tagsData } = useQuery<TagsData>({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await fetch('/api/tags')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    staleTime: 3_600_000,
  })

  const setMode = (m: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('mode', m)
    router.replace(`?${params}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="p-6 md:p-10 min-h-screen"
      style={{ background: '#07090f' }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1
          style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#eeeef0' }}
          className="mb-5"
        >
          {mode === 'import' ? 'Bulk Import' : 'Write a Story'}
        </h1>

        {/* Mode toggle */}
        <div className="flex gap-2">
          {[
            { key: 'write', label: 'Write a Story' },
            { key: 'import', label: 'Bulk Import' },
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className="text-[13px] px-[18px] py-[8px] rounded-[10px] border cursor-pointer transition-all duration-150"
              style={{
                borderColor: mode === m.key ? '#e8607a' : '#1c2333',
                color: mode === m.key ? '#e8607a' : '#6b7280',
                background: mode === m.key ? 'rgba(232,96,122,0.08)' : 'transparent',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode content */}
      <AnimatePresence mode="wait">
        {mode === 'write' ? (
          <motion.div
            key="write"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
          >
            <WriteMode tagsData={tagsData} />
          </motion.div>
        ) : (
          <motion.div
            key="import"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
          >
            <ImportMode />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Export ─────────────────────────────────────────────────────────────────

export default function AdminContentCreatePage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: '#07090f' }}
        >
          <Loader2 size={24} color="#6b7280" className="animate-spin" />
        </div>
      }
    >
      <CreatePageInner />
    </Suspense>
  )
}
