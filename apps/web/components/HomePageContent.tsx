'use client'

import { motion } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { audios } from '@/lib/data'
// TODO Phase 2: replace `audios` with /api/platform-audio (ElevenLabs)
import type { Story as StaticStory, Companion } from '@/lib/types'
import { useRecommendedCompanions } from '@/hooks/useRecommendedCompanions'
import { useDeviceCommunity } from '@/hooks/useDeviceCommunity'
import { useInfiniteStories } from '@/hooks/useInfiniteStories'
import { useInfiniteConfessions } from '@/hooks/useInfiniteConfessions'
import { usePlatformVideos } from '@/hooks/usePlatformVideos'
import { useActiveBoosts } from '@/hooks/useActiveBoosts'
import type { ActiveBoostItem } from '@/hooks/useActiveBoosts'
import { usePlayerStore } from '@/store/playerStore'
import CompanionCard from '@/components/ui/CompanionCard'
import StoryCard from '@/components/ui/StoryCard'
import AudioCard from '@/components/ui/AudioCard'
import VideoCard from '@/components/ui/VideoCard'
import GenderPickerOverlay from '@/components/GenderPickerOverlay'
import type { Story as ApiStory } from '@/hooks/useInfiniteConfessions'

// ─── Framer Motion stagger variants ───────────────────────────────────────────

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const cardItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

// ─── Gradient helper (deterministic from id) ──────────────────────────────────

const STORY_GRADIENTS = [
  'linear-gradient(135deg,#1a0e20,#2a1540,#1a1220)',
  'linear-gradient(135deg,#0f1628,#1a1040,#1a0e20)',
  'linear-gradient(135deg,#201228,#1a2030,#2a1a18)',
  'linear-gradient(135deg,#0a1620,#1a1535,#201a10)',
  'linear-gradient(135deg,#1a1020,#2a1530,#101820)',
  'linear-gradient(135deg,#101820,#201028,#102020)',
]

function gradientFromId(id: string): string {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return STORY_GRADIENTS[hash % STORY_GRADIENTS.length]
}

// ─── Map API story → StaticStory for StoryCard ────────────────────────────────

function mapToCard(s: ApiStory, type: 'Story' | 'Confession'): StaticStory {
  const wordCount = (s.rawBody ?? '').split(' ').filter(Boolean).length
  const mins = Math.max(1, Math.ceil(wordCount / 200))
  return {
    id: s.id,
    title: s.title,
    type,
    duration: `${mins} min`,
    vibe: s.moodTags[0] ?? s.categoryName ?? 'Intimate',
    tags: s.moodTags.slice(0, 3),
    handle: s.isAnonymous ? 'Anonymous' : s.authorAlias ? `@${s.authorAlias}` : 'Anonymous',
    gradient: gradientFromId(s.id),
  }
}

// ─── HomePageContent ──────────────────────────────────────────────────────────
// Accepts an optional forceCommunity — used by /female, /male, /shemale pages
// to pre-bind the device and skip the community picker.

export default function HomePageContent({ forceCommunity }: { forceCommunity?: string }) {
  const play = usePlayerStore((s) => s.play)
  const { community, needsPicker, bindCommunity } = useDeviceCommunity(forceCommunity)
  const { companionCards, isLoading: companionsLoading } = useRecommendedCompanions(community)

  const { stories: platformStoriesRaw, status: storiesStatus } = useInfiniteStories()
  const { stories: confessionsRaw, status: confessionsStatus } = useInfiniteConfessions()
  const { videos: platformVideos, status: videosStatus } = usePlatformVideos()
  const { headerBanner, featuredBoosts, rightRailBoost, midGridBoost } = useActiveBoosts(community)

  const router = useRouter()

  const [activeFilter, setActiveFilter] = useState<'All' | 'Story' | 'Confession'>('All')
  const [heroShadow, setHeroShadow] = useState(false)
  // Map to static card shape
  const platformStoryCards = platformStoriesRaw.map((s) => mapToCard(s, 'Story'))
  const confessionCards = confessionsRaw.map((s) => mapToCard(s, 'Confession'))

  const filteredStories =
    activeFilter === 'All'
      ? [...platformStoryCards, ...confessionCards]
      : activeFilter === 'Story'
        ? platformStoryCards
        : confessionCards

  const bridgeItems = confessionCards.flatMap((confession, i) => [
    { kind: 'story' as const, item: confession },
    ...(companionCards.length > 0
      ? [{ kind: 'companion' as const, item: companionCards[i % companionCards.length] }]
      : []),
  ])

  const storiesLoading = storiesStatus === 'pending' || confessionsStatus === 'pending'

  // Pre-build companion carousel items with optional mid-grid sponsored card at position 3
  const companionItems: ReactNode[] = []
  if (!companionsLoading) {
    companionCards.forEach((c, idx) => {
      if (idx === 3 && midGridBoost) {
        companionItems.push(
          <motion.div
            key={`sponsored-${midGridBoost.id}`}
            variants={cardItem}
            style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
          >
            <MidGridAd data={midGridBoost} />
          </motion.div>
        )
      }
      companionItems.push(
        <motion.div
          key={c.id}
          variants={cardItem}
          style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
        >
          <CompanionCard companion={c} />
        </motion.div>
      )
    })
  }

  // Use top real recommendation only — no dummy fallback
  const topReal = companionCards[0] ?? null
  const featured = topReal

  // First live story for mood panel
  const moodStory = platformStoryCards[0] ?? null

  return (
    <>
      {needsPicker && <GenderPickerOverlay onSelect={bindCommunity} />}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-[1400px] mx-auto px-5 md:px-10 pt-[95px] pb-20"
      >
        {/* ── Header Banner ad placement ──────────────────────────────────────── */}
        {headerBanner && <HeaderBannerAd data={headerBanner} />}

        {/* Flex layout: main content left + optional sticky right rail on xl screens */}
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
            {/* ── BLOCK 2: Hero ────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6 mb-14">
              {/* Featured companion card — unique large layout, built inline */}
              {featured && (
                <div
                  className="bg-[#111620] border border-[#1c2333] rounded-[20px] overflow-hidden flex flex-col md:flex-row relative min-h-[360px] cursor-pointer transition-shadow duration-300"
                  style={{ boxShadow: heroShadow ? '0 0 40px rgba(232,96,122,0.18)' : 'none' }}
                  onMouseEnter={() => setHeroShadow(true)}
                  onMouseLeave={() => setHeroShadow(false)}
                  onClick={() => router.push(`/companions/${featured.id}`)}
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
                        <em style={{ fontStyle: 'italic', color: '#e8607a' }}>
                          with {featured.name}
                        </em>
                      </h1>

                      {/* Subtitle */}
                      <p className="text-[13px] text-[#6b7280] leading-[1.7] mb-5 max-w-[360px]">
                        Curated for you based on your preferences. {featured.name} specialises in
                        genuine connection.
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
                            router.push(`/companions/${featured.id}`)
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
                    title={moodStory?.title ?? 'An intimate story awaits'}
                    meta={`${moodStory?.duration ?? '—'} · ${moodStory?.vibe ?? 'gentle tension'}`}
                    onAction={() =>
                      moodStory ? router.push(`/stories/${moodStory.id}`) : router.push('/stories')
                    }
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
                {companionsLoading ? (
                  [...Array(4)].map((_, i) => (
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
                ) : (
                  <>
                    {featuredBoosts.map((boost) => (
                      <motion.div
                        key={`featured-${boost.id}`}
                        variants={cardItem}
                        style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
                      >
                        <FeaturedBoostCard data={boost} />
                      </motion.div>
                    ))}
                    {companionItems}
                  </>
                )}
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

              {storiesLoading ? (
                <div
                  className="flex gap-4 overflow-x-auto pb-3"
                  style={{ scrollbarWidth: 'none' } as React.CSSProperties}
                >
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 240,
                        height: 220,
                        flexShrink: 0,
                        borderRadius: 14,
                        background: '#111620',
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }}
                    />
                  ))}
                </div>
              ) : (
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
              )}
            </div>

            {/* ── BLOCK 4.5: Private glimpses (videos) ─────────────────────────────── */}
            {(videosStatus === 'pending' || platformVideos.length > 0) && (
              <div className="mb-14">
                <div className="flex items-end justify-between mb-5">
                  <div>
                    <div
                      className="text-[22px] text-[#eeeef0] mb-1"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      Private glimpses
                    </div>
                    <p className="text-[12px] text-[#6b7280] max-w-[480px] leading-[1.5]">
                      Short moments. A window into their world.
                    </p>
                  </div>
                </div>

                {videosStatus === 'pending' ? (
                  <div
                    className="flex gap-4 overflow-x-auto pb-3"
                    style={{ scrollbarWidth: 'none' } as React.CSSProperties}
                  >
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: 220,
                          height: 240,
                          flexShrink: 0,
                          borderRadius: 14,
                          background: '#111620',
                          animation: 'pulse 1.5s ease-in-out infinite',
                        }}
                      />
                    ))}
                  </div>
                ) : (
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
                    {platformVideos.map((v) => (
                      <motion.div
                        key={v.id}
                        variants={cardItem}
                        style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
                      >
                        <VideoCard video={v} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            )}

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
            {bridgeItems.length > 0 && (
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
                        <StoryCard story={entry.item as StaticStory} />
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
            )}

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
          </div>
          {/* end main content column */}

          {/* ── Right rail ad placement (desktop ≥1280px) ─────────────────────── */}
          {rightRailBoost && (
            <div
              className="hidden xl:block flex-shrink-0 w-[280px]"
              style={{ position: 'sticky', top: 80, alignSelf: 'flex-start' }}
            >
              <RightRailAd data={rightRailBoost} />
            </div>
          )}
        </div>
        {/* end flex wrapper */}
      </motion.main>
    </>
  )
}

// ─── Mood item sub-component ───────────────────────────────────────────────────

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

// ─── HeaderBannerAd ───────────────────────────────────────────────────────────
// Full-width banner strip between the nav and BLOCK 1

function HeaderBannerAd({ data }: { data: ActiveBoostItem }) {
  const href = data.companion_id ? `/companions/${data.companion_id}` : '/companions'
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 14,
        overflow: 'hidden',
        background: data.banner_image_url
          ? 'transparent'
          : 'linear-gradient(135deg,#1a1228,#2a1535)',
        border: '1px solid rgba(232,96,122,0.2)',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 24px',
        gap: 16,
        minHeight: 80,
      }}
    >
      {data.banner_image_url && (
        <>
          <Image
            src={data.banner_image_url}
            alt={data.banner_headline ?? 'Sponsored'}
            fill
            style={{ objectFit: 'cover', objectPosition: 'center', opacity: 1 }}
            sizes="100vw"
          />
          {/* dark overlay so text stays readable over the custom image */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,9,15,0.55)' }} />
        </>
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            fontSize: 10,
            color: '#c9a96e',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em',
            marginBottom: 4,
            fontWeight: 500,
          }}
        >
          Sponsored
        </div>
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 18,
            color: '#eeeef0',
            lineHeight: 1.3,
            marginBottom: 2,
          }}
        >
          {data.banner_headline ?? data.companion_name ?? 'Featured companion'}
          {data.banner_headline ? (
            ''
          ) : (
            <em style={{ color: '#e8607a', fontStyle: 'italic' }}> awaits.</em>
          )}
        </div>
        {data.banner_tagline_text && (
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{data.banner_tagline_text}</p>
        )}
      </div>
      <Link
        href={href}
        style={{
          position: 'relative',
          zIndex: 1,
          flexShrink: 0,
          fontSize: 13,
          fontWeight: 500,
          padding: '10px 20px',
          borderRadius: 10,
          background: 'rgba(232,96,122,0.15)',
          border: '1px solid rgba(232,96,122,0.4)',
          color: '#e8607a',
          textDecoration: 'none',
          whiteSpace: 'nowrap' as const,
        }}
      >
        View profile →
      </Link>
    </div>
  )
}

// ─── FeaturedBoostCard ────────────────────────────────────────────────────────
// Companion card with rose accent border + "✦ Featured" badge

const CARD_GRADIENTS = [
  'linear-gradient(135deg,#1a1228,#2a1535,#1a2240)',
  'linear-gradient(135deg,#0f1a28,#1f2840,#2a1020)',
  'linear-gradient(135deg,#201228,#1a2030,#2a1a18)',
]

function FeaturedBoostCard({ data }: { data: ActiveBoostItem }) {
  const href = data.companion_id ? `/companions/${data.companion_id}` : '/companions'
  const hash = (data.companion_id ?? data.id).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const gradient = CARD_GRADIENTS[hash % CARD_GRADIENTS.length]
  const [hovered, setHovered] = useState(false)

  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block', width: 220 }}>
      <div
        style={{
          borderRadius: 14,
          overflow: 'hidden',
          border: hovered ? '1px solid rgba(232,96,122,0.7)' : '1px solid rgba(232,96,122,0.35)',
          cursor: 'pointer',
          transition: 'border-color 0.15s, transform 0.15s',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Photo */}
        <div style={{ position: 'relative', aspectRatio: '3/4', background: gradient }}>
          {data.companion_photo_url && (
            <Image
              src={data.companion_photo_url}
              alt={data.companion_name ?? 'Featured companion'}
              fill
              style={{ objectFit: 'cover', objectPosition: 'top' }}
              sizes="220px"
            />
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(7,9,15,0.9) 0%, transparent 50%)',
            }}
          />
          {/* Featured badge */}
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 999,
              background: 'rgba(232,96,122,0.18)',
              border: '1px solid rgba(232,96,122,0.5)',
              color: '#e8607a',
              fontWeight: 500,
              letterSpacing: '0.03em',
            }}
          >
            ✦ Featured
          </div>
          <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 15,
                color: '#eeeef0',
                marginBottom: 2,
                lineHeight: 1.2,
              }}
            >
              {data.companion_name ?? 'Companion'}
            </p>
            {data.companion_city && (
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{data.companion_city}</span>
            )}
          </div>
        </div>
        {/* Info strip */}
        <div style={{ padding: '10px 12px', background: '#0d1117' }}>
          {data.companion_tagline && (
            <p
              style={{
                fontSize: 11,
                color: '#6b7280',
                lineHeight: 1.4,
                marginBottom: data.companion_min_rate ? 6 : 0,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as const,
              }}
            >
              {data.companion_tagline}
            </p>
          )}
          {data.companion_min_rate && (
            <span
              style={{
                fontSize: 11,
                color: '#e8607a',
                background: 'rgba(232,96,122,0.1)',
                border: '1px solid rgba(232,96,122,0.25)',
                borderRadius: 999,
                padding: '2px 8px',
                display: 'inline-block',
              }}
            >
              from {data.companion_min_rate}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ─── MidGridAd ────────────────────────────────────────────────────────────────
// Native-looking sponsored card injected at position 3 in the companions carousel

function MidGridAd({ data }: { data: ActiveBoostItem }) {
  const href = data.companion_id ? `/companions/${data.companion_id}` : '/companions'
  const hash = (data.companion_id ?? data.id).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const gradient = CARD_GRADIENTS[hash % CARD_GRADIENTS.length]
  const [hovered, setHovered] = useState(false)

  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block', width: 220 }}>
      <div
        style={{
          borderRadius: 14,
          overflow: 'hidden',
          border: hovered ? '1px solid rgba(201,169,110,0.4)' : '1px solid rgba(201,169,110,0.15)',
          cursor: 'pointer',
          transition: 'border-color 0.15s, transform 0.15s',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ position: 'relative', aspectRatio: '3/4', background: gradient }}>
          {data.companion_photo_url && (
            <Image
              src={data.companion_photo_url}
              alt={data.companion_name ?? 'Companion'}
              fill
              style={{ objectFit: 'cover', objectPosition: 'top' }}
              sizes="220px"
            />
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(7,9,15,0.9) 0%, transparent 50%)',
            }}
          />
          <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 15,
                color: '#eeeef0',
                marginBottom: 2,
                lineHeight: 1.2,
              }}
            >
              {data.companion_name ?? 'Companion'}
            </p>
            {data.companion_city && (
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{data.companion_city}</span>
            )}
          </div>
        </div>
        <div style={{ padding: '10px 12px', background: '#0d1117' }}>
          {data.companion_tagline && (
            <p
              style={{
                fontSize: 11,
                color: '#6b7280',
                lineHeight: 1.4,
                marginBottom: 6,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as const,
              }}
            >
              {data.companion_tagline}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {data.companion_min_rate && (
              <span
                style={{
                  fontSize: 11,
                  color: '#c9a96e',
                  background: 'rgba(201,169,110,0.08)',
                  border: '1px solid rgba(201,169,110,0.2)',
                  borderRadius: 999,
                  padding: '2px 8px',
                  display: 'inline-block',
                }}
              >
                from {data.companion_min_rate}
              </span>
            )}
            <span style={{ fontSize: 10, color: '#4b5563' }}>Sponsored</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── RightRailAd ─────────────────────────────────────────────────────────────
// 280px sticky companion card shown on xl screens (desktop right rail)

function RightRailAd({ data }: { data: ActiveBoostItem }) {
  const href = data.companion_id ? `/companions/${data.companion_id}` : '/companions'
  const hash = (data.companion_id ?? data.id).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const gradient = CARD_GRADIENTS[hash % CARD_GRADIENTS.length]

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid rgba(232,96,122,0.2)',
        background: '#0d1117',
      }}
    >
      {/* Photo / custom banner */}
      <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          style={{
            position: 'relative',
            aspectRatio: data.banner_image_url ? '280/400' : '3/4',
            background: gradient,
          }}
        >
          {(data.banner_image_url || data.companion_photo_url) && (
            <Image
              src={data.banner_image_url ?? data.companion_photo_url!}
              alt={data.companion_name ?? 'Featured companion'}
              fill
              style={{
                objectFit: 'cover',
                objectPosition: data.banner_image_url ? 'center' : 'top',
              }}
              sizes="280px"
            />
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(13,17,23,0.95) 0%, transparent 55%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 999,
              background: 'rgba(232,96,122,0.12)',
              border: '1px solid rgba(232,96,122,0.3)',
              color: '#e8607a',
              fontWeight: 500,
              letterSpacing: '0.04em',
            }}
          >
            Promoted
          </div>
          <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14 }}>
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 18,
                color: '#eeeef0',
                marginBottom: 4,
                lineHeight: 1.2,
              }}
            >
              {data.companion_name ?? 'Private Companion'}
            </p>
            {data.companion_city && (
              <p style={{ fontSize: 12, color: '#9ca3af' }}>{data.companion_city}</p>
            )}
          </div>
        </div>
      </Link>

      {/* Info */}
      <div style={{ padding: '14px 16px' }}>
        {data.companion_tagline && (
          <p
            style={{
              fontSize: 12,
              color: '#6b7280',
              lineHeight: 1.6,
              marginBottom: 12,
              fontStyle: 'italic',
            }}
          >
            &ldquo;{data.companion_tagline}&rdquo;
          </p>
        )}
        {data.companion_min_rate && (
          <p style={{ fontSize: 12, color: '#e8607a', marginBottom: 12 }}>
            From {data.companion_min_rate} / session
          </p>
        )}
        <Link
          href={href}
          style={{
            display: 'block',
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 500,
            padding: '10px',
            borderRadius: 10,
            background: 'rgba(232,96,122,0.12)',
            border: '1px solid rgba(232,96,122,0.3)',
            color: '#e8607a',
            textDecoration: 'none',
          }}
        >
          View profile →
        </Link>
      </div>
    </div>
  )
}
