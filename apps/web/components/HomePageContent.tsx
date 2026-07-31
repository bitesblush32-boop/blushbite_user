'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { audios } from '@/lib/data'
import type { Story as StaticStory, Companion } from '@/lib/types'
import { useRecommendedCompanions } from '@/hooks/useRecommendedCompanions'
import { useDeviceCommunity } from '@/hooks/useDeviceCommunity'
import { useInfiniteStories } from '@/hooks/useInfiniteStories'
import { useInfiniteConfessions } from '@/hooks/useInfiniteConfessions'
import { usePlatformVideos } from '@/hooks/usePlatformVideos'
import { useActiveBoosts } from '@/hooks/useActiveBoosts'
import { HeaderBannerAd, FeaturedBoostCard, MidGridAd, RightRailAd } from '@/components/ui/BoostAds'
import { usePlayerStore } from '@/store/playerStore'
import { useUIStore } from '@/store/uiStore'
import CompanionCard from '@/components/ui/CompanionCard'
import AutoCompanionCarousel from '@/components/ui/AutoCompanionCarousel'
import { ShieldCheck, Lock, EyeOff, Sparkles } from 'lucide-react'
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
  const { community, loading, needsPicker, bindCommunity } = useDeviceCommunity(forceCommunity)
  const setCommunity = useUIStore((s) => s.setCommunity)
  const setCommunityLoading = useUIStore((s) => s.setCommunityLoading)

  // Sync to global store so all pages (header, companions, etc.) can read it without re-resolving
  useEffect(() => {
    setCommunity(community)
    setCommunityLoading(loading)
  }, [community, loading, setCommunity, setCommunityLoading])
  const { companionCards, isLoading: companionsLoading } = useRecommendedCompanions(community)

  const { stories: platformStoriesRaw, status: storiesStatus } = useInfiniteStories()
  const { stories: confessionsRaw, status: confessionsStatus } = useInfiniteConfessions()
  const { videos: platformVideos, status: videosStatus } = usePlatformVideos()
  const { headerBanner, featuredBoosts, rightRailBoosts, midGridBoost } = useActiveBoosts(community)

  const router = useRouter()

  const [activeFilter, setActiveFilter] = useState<'All' | 'Story' | 'Confession'>('All')
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
            style={{ scrollSnapAlign: 'start', flexShrink: 0, width: 198 }}
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

  // First live story for mood panel
  const moodStory = platformStoryCards[0] ?? null

  return (
    <>
      {needsPicker && <GenderPickerOverlay onSelect={bindCommunity} />}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-[1400px] mx-auto px-3.5 sm:px-6 pt-[85px] sm:pt-[95px] pb-20"
      >
        {/* ── Header Banner ad placement ──────────────────────────────────────── */}
        {headerBanner && <HeaderBannerAd data={headerBanner} />}

        {/* Flex layout: main content left + optional sticky right rail on xl screens */}
        <div className="flex items-start">
          <div className="flex-1 min-w-0">
            {/* ── Mobile Right Rail Ad placement (phone/tablet < xl) ───────────────── */}
            {rightRailBoosts.length > 0 && (
              <div className="xl:hidden mb-10">
                <div
                  className="flex gap-4 overflow-x-auto pb-2"
                  style={
                    {
                      scrollSnapType: 'x mandatory',
                      scrollbarWidth: 'none',
                      WebkitOverflowScrolling: 'touch',
                    } as React.CSSProperties
                  }
                >
                  {rightRailBoosts.map((boost) => (
                    <div
                      key={`mobile-rail-${boost.id}`}
                      style={{
                        width: 200,
                        flexShrink: 0,
                        scrollSnapAlign: 'start',
                      }}
                    >
                      <RightRailAd data={boost} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Trust & Privacy Highlights Bar ──────────────────────────────────── */}
            <div className="mb-10 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#111620]/90 via-[#151c2a]/80 to-[#111620]/90 border border-[#1c2333] shadow-lg backdrop-blur-md">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <div className="p-2.5 rounded-xl bg-[#e8607a]/10 border border-[#e8607a]/20 text-[#e8607a] flex-shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#eeeef0] flex items-center gap-1.5 justify-center sm:justify-start">
                      <span>Verified Identities</span>
                      <Sparkles size={12} className="text-[#e8607a]" />
                    </div>
                    <div className="text-[11px] text-[#9ca3af] mt-0.5">100% ID authenticated profiles</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <div className="p-2.5 rounded-xl bg-[#e8607a]/10 border border-[#e8607a]/20 text-[#e8607a] flex-shrink-0">
                    <EyeOff size={20} />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#eeeef0]">Anonymous Alias</div>
                    <div className="text-[11px] text-[#9ca3af] mt-0.5">Real names never stored or revealed</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <div className="p-2.5 rounded-xl bg-[#e8607a]/10 border border-[#e8607a]/20 text-[#e8607a] flex-shrink-0">
                    <Lock size={20} />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#eeeef0]">Discreet Sessions</div>
                    <div className="text-[11px] text-[#9ca3af] mt-0.5">Strictly private EU-hosted platform</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── BLOCK 3: Companions who match your taste ─────────────────────────── */}
            <div className="mb-14">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <div
                    className="text-[22px] text-[#eeeef0] mb-1 flex items-center gap-2"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    <span>Companions who match your taste</span>
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

              {companionsLoading ? (
                <div className="flex gap-4 overflow-x-auto pb-3">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 190,
                        height: 285,
                        flexShrink: 0,
                        borderRadius: 14,
                        background: '#111620',
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }}
                    />
                  ))}
                </div>
              ) : (
                <AutoCompanionCarousel autoPlayInterval={2500}>
                  {[
                    ...featuredBoosts.map((boost) => (
                      <motion.div
                        key={`featured-${boost.id}`}
                        variants={cardItem}
                        style={{ scrollSnapAlign: 'start', flexShrink: 0, width: 198 }}
                      >
                        <FeaturedBoostCard data={boost} />
                      </motion.div>
                    )),
                    ...companionItems,
                  ]}
                </AutoCompanionCarousel>
              )}
            </div>

            {/* ── Mood Mix Panel ────────────────────────────────────────────────────── */}
            <div className="bg-[#111620] border border-[#1c2333] rounded-[20px] p-7 flex flex-col mb-14">
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
              <div className="flex flex-col gap-3">
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
          {rightRailBoosts.length > 0 && (
            <div
              className="hidden xl:flex flex-col flex-shrink-0 w-[200px] gap-3"
              style={{ position: 'sticky', top: 80, alignSelf: 'flex-start', marginLeft: 15 }}
            >
              {rightRailBoosts.map((boost) => (
                <RightRailAd key={boost.id} data={boost} />
              ))}
            </div>
          )}
        </div>
        {/* end flex wrapper */}
      </motion.main>
    </>
  )
}

// ─── Mood item sub-component ─────────────────────────────────────────────────

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
