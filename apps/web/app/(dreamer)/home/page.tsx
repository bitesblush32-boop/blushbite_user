'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { stories, audios } from '@/lib/data'
import type { Companion } from '@/lib/types'
import { useRecommendedCompanions } from '@/hooks/useRecommendedCompanions'
import { useMoodStore } from '@/store/moodStore'
import { useUIStore } from '@/store/uiStore'
import { usePlayerStore } from '@/store/playerStore'
import CompanionCard from '@/components/ui/CompanionCard'
import StoryCard from '@/components/ui/StoryCard'
import AudioCard from '@/components/ui/AudioCard'
import DesiresDrawer from '@/components/ui/DesiresDrawer'

// ─── Framer Motion stagger variants ───────────────────────────────────────────

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const cardItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { intensity, setIntensity } = useMoodStore()
  const openModal = useUIStore((s) => s.openModal)
  const play = usePlayerStore((s) => s.play)
  const {
    companionCards,
    companions: realCompanions,
    isLoading: companionsLoading,
  } = useRecommendedCompanions()
  const router = useRouter()

  const [activeFilter, setActiveFilter] = useState<'All' | 'Story' | 'Confession'>('All')
  const [heroShadow, setHeroShadow] = useState(false)
  const [desiresOpen, setDesiresOpen] = useState(false)

  const filteredStories =
    activeFilter === 'All' ? stories : stories.filter((s) => s.type === activeFilter)

  const confessions = stories.filter((s) => s.type === 'Confession')
  const bridgeItems = confessions.flatMap((confession, i) => [
    { kind: 'story' as const, item: confession },
    ...(companionCards.length > 0
      ? [{ kind: 'companion' as const, item: companionCards[i % companionCards.length] }]
      : []),
  ])

  // Use top real recommendation only — no dummy fallback
  const topReal = companionCards[0] ?? null
  const featured = topReal

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 max-w-[1400px] mx-auto px-5 md:px-10 pt-[95px] pb-20"
    >
      {/* ── BLOCK 1: Mood Slider + Desires button ─────────────────────────────── */}
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <div
          className="flex items-center gap-[14px] flex-1 min-w-[260px]"
          style={{
            background: '#111620',
            border: '1px solid #1c2333',
            borderRadius: 40,
            padding: '10px 20px',
          }}
        >
          <span style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Tonight I want:
          </span>
          <span style={{ fontSize: 11, color: '#eeeef0', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Softer
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            style={{
              flex: 1,
              accentColor: '#e8607a',
              cursor: 'pointer',
              margin: 0,
              padding: 0,
              height: 4,
            }}
          />
          <span style={{ fontSize: 11, color: '#eeeef0', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Spicier
          </span>
        </div>
        <button
          onClick={() => setDesiresOpen(true)}
          className="text-[12.5px] font-medium px-[16px] py-[10px] rounded-full border cursor-pointer transition-all duration-200 whitespace-nowrap flex-shrink-0"
          style={{
            borderColor: 'rgba(232,96,122,0.35)',
            background: 'rgba(232,96,122,0.06)',
            color: '#e8607a',
          }}
        >
          ✦ Tune your desires
        </button>
      </div>

      <DesiresDrawer open={desiresOpen} onClose={() => setDesiresOpen(false)} />

      {/* ── BLOCK 2: Hero ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6 mb-14">
        {/* Featured companion card — unique large layout, built inline */}
        {featured && (
          <div
            className="bg-[#111620] border border-[#1c2333] rounded-[20px] overflow-hidden flex flex-col md:flex-row relative min-h-[360px] cursor-pointer transition-shadow duration-300"
            style={{ boxShadow: heroShadow ? '0 0 40px rgba(232,96,122,0.18)' : 'none' }}
            onMouseEnter={() => setHeroShadow(true)}
            onMouseLeave={() => setHeroShadow(false)}
            onClick={() => openModal(featured.id)}
          >
            {/* Image strip */}
            <div
              className="w-full h-[180px] md:w-[260px] md:h-auto flex-shrink-0 relative overflow-hidden"
              style={{ background: featured.gradient }}
            >
              {/* Real photo if available, silhouette fallback */}
              {'photoUrl' in featured && featured.photoUrl ? (
                <Image
                  src={featured.photoUrl}
                  alt={featured.name}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 260px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    width="120"
                    height="240"
                    viewBox="0 0 80 160"
                    fill="white"
                    style={{ opacity: 0.2, filter: 'blur(0.5px)' }}
                  >
                    <ellipse cx="40" cy="26" rx="20" ry="24" />
                    <path d="M16 90 Q24 55 40 52 Q56 55 64 90 L68 170 Q56 182 40 184 Q24 182 12 170Z" />
                  </svg>
                </div>
              )}

              {/* Fade to card body — right on desktop, bottom on mobile */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 60%, #111620 100%), linear-gradient(180deg, transparent 60%, #111620 100%)',
                }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
              <div>
                {/* Hero chip */}
                <div
                  className="inline-flex items-center gap-[6px] text-[11px] font-medium text-[#e8607a] px-[10px] py-1 rounded-full mb-[14px] tracking-[0.04em]"
                  style={{
                    background: 'rgba(232,96,122,0.12)',
                    border: '1px solid rgba(232,96,122,0.25)',
                  }}
                >
                  <span className="w-[6px] h-[6px] rounded-full bg-current inline-block" />
                  For you · Verified companion
                </div>

                {/* Headline */}
                <h1
                  className="text-[32px] text-[#eeeef0] leading-tight mb-[10px]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  An intimate evening
                  <br />
                  <em style={{ fontStyle: 'italic', color: '#e8607a' }}>with {featured.name}</em>
                </h1>

                {/* Subtitle */}
                <p className="text-[13px] text-[#6b7280] leading-[1.7] mb-5 max-w-[360px]">
                  Curated for you based on your preferences. {featured.name} specialises in genuine
                  connection.
                </p>

                {/* Chips */}
                <div className="flex flex-wrap gap-2 mb-7">
                  <span
                    className="text-[11px] px-[10px] py-1 rounded-full text-[#e8607a]"
                    style={{
                      border: '1px solid rgba(232,96,122,0.3)',
                      background: 'rgba(232,96,122,0.08)',
                    }}
                  >
                    ✦ Matches your taste
                  </span>
                  <span className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">
                    {featured.city} · In-person
                  </span>
                  <span
                    className="text-[11px] px-[10px] py-1 rounded-full text-[#c9a96e]"
                    style={{
                      border: '1px solid rgba(201,169,110,0.35)',
                      background: 'rgba(201,169,110,0.08)',
                    }}
                  >
                    Sessions from {featured.price}
                  </span>
                  <span className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">
                    {featured.tags[0]}
                  </span>
                </div>
              </div>

              {/* Bottom group */}
              <div>
                <div className="flex flex-wrap gap-3 mb-0">
                  <button
                    className="bg-[#e8607a] hover:bg-[#c4485e] text-white border-none px-[22px] py-[12px] rounded-[10px] text-[13.5px] font-medium cursor-pointer transition-all duration-200 hover:-translate-y-px"
                    onClick={(e) => {
                      e.stopPropagation()
                      openModal(featured.id)
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.boxShadow =
                        '0 8px 24px rgba(232,96,122,0.3)')
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.boxShadow = 'none')
                    }
                  >
                    View {featured.name}&apos;s profile &amp; sessions →
                  </button>
                  <button className="bg-transparent text-[#6b7280] border border-[#1c2333] px-[20px] py-[10px] rounded-[10px] text-[13px] cursor-pointer transition-all duration-200 hover:border-white/20 hover:text-[#eeeef0]">
                    See more companions like this
                  </button>
                </div>

                {/* Trust line */}
                <div className="flex gap-4 mt-4 flex-wrap">
                  <span className="flex items-center gap-[6px] text-[11.5px] text-[#6b7280]">
                    <span style={{ color: '#c9a96e' }}>🔒</span>Anonymous booking
                  </span>
                  <span className="flex items-center gap-[6px] text-[11.5px] text-[#6b7280]">
                    <span style={{ color: '#c9a96e' }}>✦</span>Verified &amp; licensed
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mood panel */}
        <div className="bg-[#111620] border border-[#1c2333] rounded-[20px] p-7 flex flex-col">
          <div
            className="text-[20px] text-[#eeeef0] mb-1"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Tonight&apos;s mood mix
          </div>
          <p className="text-[12px] text-[#6b7280] mb-[18px] leading-[1.5]">
            Based on your choices: <em>romantic, slow burn, private</em>
          </p>

          {/* Mood chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span
              className="text-[11px] px-[10px] py-1 rounded-full text-[#e8607a]"
              style={{
                border: '1px solid rgba(232,96,122,0.3)',
                background: 'rgba(232,96,122,0.08)',
              }}
            >
              Soft &amp; slow burn
            </span>
            <span className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">
              Guided audio
            </span>
            <span className="text-[11px] px-[10px] py-1 rounded-full border border-[#1c2333] text-[#6b7280] bg-white/[0.03]">
              Private confessions
            </span>
          </div>

          {/* Mood items */}
          <div className="flex flex-col gap-3 flex-1">
            <MoodItem
              type="Story"
              title={stories[0].title}
              meta={`${stories[0].duration} · gentle tension`}
              onAction={() => router.push(`/stories/${stories[0].id}`)}
              actionLabel="Read & listen"
            />
            <MoodItem
              type="Audio"
              title={audios[0].title}
              meta={`${audios[0].duration} · warm & intimate`}
              onAction={() =>
                play({
                  id: audios[0].id,
                  title: audios[0].title,
                  meta: `${audios[0].voice} · ${audios[0].duration} · ${audios[0].vibe}`,
                })
              }
              actionLabel="Preview"
            />
            <MoodItem
              type="Confessions"
              title="Confessions like yours"
              meta="Anonymous fantasies from similar profiles"
              onAction={() => router.push('/stories')}
              actionLabel="Open feed"
            />
          </div>
        </div>
      </div>

      {/* ── BLOCK 3: Companions who match your taste ─────────────────────────── */}
      <div className="mb-14">
        <div className="flex items-end justify-between mb-5">
          <div>
            <div
              className="text-[22px] text-[#eeeef0] mb-1"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Companions who match your taste
            </div>
            <p className="text-[12px] text-[#6b7280] max-w-[480px] leading-[1.5]">
              Curated from profiles you hovered and content you enjoyed.
            </p>
          </div>
          <Link
            href="/companions"
            className="text-[12.5px] text-[#e8607a] opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap"
          >
            See all →
          </Link>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex gap-4 overflow-x-auto pb-3"
          style={
            {
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
            } as React.CSSProperties
          }
        >
          {companionsLoading
            ? [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 220,
                    height: 280,
                    flexShrink: 0,
                    scrollSnapAlign: 'start',
                    borderRadius: 14,
                    background: '#111620',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
              ))
            : companionCards.map((c) => (
                <motion.div
                  key={c.id}
                  variants={cardItem}
                  style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
                >
                  <CompanionCard companion={c} />
                </motion.div>
              ))}
        </motion.div>
      </div>

      {/* ── BLOCK 4: Stories for your current mood ───────────────────────────── */}
      <div className="mb-14">
        <div className="flex items-end justify-between mb-5">
          <div>
            <div
              className="text-[22px] text-[#eeeef0] mb-1"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Stories for your current mood
            </div>
            <p className="text-[12px] text-[#6b7280] max-w-[480px] leading-[1.5]">
              Emotionally rich narratives tuned to your themes.
            </p>
          </div>
          <Link
            href="/stories"
            className="text-[12.5px] text-[#e8607a] opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap"
          >
            See all →
          </Link>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap mb-5">
          {(['All', 'Story', 'Confession'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="text-[12px] px-[14px] py-[6px] rounded-full border cursor-pointer transition-all duration-150"
              style={{
                borderColor: activeFilter === f ? '#e8607a' : '#1c2333',
                color: activeFilter === f ? '#e8607a' : '#6b7280',
                background: activeFilter === f ? 'rgba(232,96,122,0.08)' : 'transparent',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <motion.div
          key={activeFilter}
          variants={container}
          initial="hidden"
          animate="show"
          className="flex gap-4 overflow-x-auto pb-3"
          style={
            {
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
            } as React.CSSProperties
          }
        >
          {filteredStories.map((s) => (
            <motion.div
              key={s.id}
              variants={cardItem}
              style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
            >
              <StoryCard story={s} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── BLOCK 5: Audio for tonight ───────────────────────────────────────── */}
      <div className="mb-14">
        <div className="flex items-end justify-between mb-5">
          <div>
            <div
              className="text-[22px] text-[#eeeef0] mb-1"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Audio for tonight
            </div>
            <p className="text-[12px] text-[#6b7280] max-w-[480px] leading-[1.5]">
              Voiced intimacy — warm, present, and entirely yours.
            </p>
          </div>
          <Link
            href="/audio"
            className="text-[12.5px] text-[#e8607a] opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap"
          >
            See all →
          </Link>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex gap-4 overflow-x-auto pb-3"
          style={
            {
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
            } as React.CSSProperties
          }
        >
          {audios.map((a) => (
            <motion.div
              key={a.id}
              variants={cardItem}
              style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
            >
              <AudioCard audio={a} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── BLOCK 6: Confession → Companion bridge ───────────────────────────── */}
      <div className="mb-14">
        <div className="flex items-end justify-between mb-5">
          <div>
            <div
              className="text-[22px] text-[#eeeef0] mb-1"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              From confession to companion
            </div>
            <p className="text-[12px] text-[#6b7280] max-w-[480px] leading-[1.5]">
              Anonymous fantasies — and companions who can bring them to life.
            </p>
          </div>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex gap-4 overflow-x-auto pb-3"
          style={
            {
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
            } as React.CSSProperties
          }
        >
          {bridgeItems.map((entry, idx) => (
            <motion.div
              key={`${entry.kind}-${idx}`}
              variants={cardItem}
              style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
            >
              {entry.kind === 'story' ? (
                <StoryCard story={entry.item as (typeof stories)[0]} />
              ) : (
                <div
                  className="rounded-[14px]"
                  style={{ border: '1px solid rgba(201,169,110,0.25)' }}
                >
                  <CompanionCard companion={entry.item as Companion} />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="mt-20 pt-10 border-t border-[#1c2333]">
        <div className="flex items-center justify-between flex-wrap gap-5">
          <div className="flex gap-5 flex-wrap">
            {[
              'Safety & Consent',
              'Privacy & Anonymity',
              'Legal information',
              'Report an issue',
            ].map((label) => (
              <span
                key={label}
                className="text-[12px] text-[#6b7280] cursor-pointer transition-colors duration-150 hover:text-[#eeeef0]"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="flex gap-4 flex-wrap text-[12px] text-[#6b7280]">
            <span>🔒 Anonymous IDs</span>
            <span>✦ Clear consent &amp; boundaries</span>
            <span>💳 Transparent pricing</span>
          </div>
        </div>
        <p className="text-[11px] text-[#6b7280] mt-6" style={{ opacity: 0.5 }}>
          © 2025 BlushBite · All companions verified · 18+
        </p>
      </footer>
    </motion.main>
  )
}

// ─── Mood item sub-component (private to this file) ───────────────────────────

function MoodItem({
  type,
  title,
  meta,
  onAction,
  actionLabel,
}: {
  type: string
  title: string
  meta: string
  onAction: () => void
  actionLabel: string
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="bg-[#161d2a] border rounded-[12px] px-4 py-[14px] flex items-center justify-between cursor-pointer transition-all duration-200"
      style={{
        borderColor: hovered ? 'rgba(232,96,122,0.4)' : '#1c2333',
        background: hovered ? 'rgba(232,96,122,0.05)' : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-[#e8607a] uppercase tracking-[0.08em] mb-[2px] font-medium">
          {type}
        </div>
        <div className="text-[13px] text-[#eeeef0] font-medium mb-[2px] truncate">{title}</div>
        <div className="text-[11px] text-[#6b7280]">{meta}</div>
      </div>
      <button
        className="text-[11px] text-[#e8607a] px-[10px] py-[5px] rounded-full flex-shrink-0 ml-3 border-none cursor-pointer transition-colors duration-150"
        style={{
          background: hovered ? 'rgba(232,96,122,0.2)' : 'rgba(232,96,122,0.1)',
          border: '1px solid rgba(232,96,122,0.2)',
        }}
        onClick={(e) => {
          e.stopPropagation()
          onAction()
        }}
      >
        {actionLabel}
      </button>
    </div>
  )
}
