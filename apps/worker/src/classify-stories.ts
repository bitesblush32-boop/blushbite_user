import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

const SCRIPT_DIR = path.dirname(path.resolve(process.argv[1]))

// ── Load taxonomy.json ─────────────────────────────────────────────────────────
// File is two-line NDJSON with CSV-style double-quote escaping inside the string:
//   line 0: "taxonomy"
//   line 1: "{""story_categories"":...}"   ← outer quotes + "" → "
const taxonomyPath = path.join(SCRIPT_DIR, 'data', 'taxonomy.json')
const taxLines     = fs.readFileSync(taxonomyPath, 'utf8').trim().split('\n').filter(Boolean)
const taxRaw       = taxLines[1] ?? taxLines[0]
// Strip outer quotes and un-escape "" → "
const taxInner = taxRaw.startsWith('"') && taxRaw.endsWith('"')
  ? taxRaw.slice(1, -1).replace(/""/g, '"')
  : taxRaw
const taxonomy: {
  story_categories:  { id: number; slug: string }[]
  mood_tags:         { id: number; slug: string }[]
  orientation_tags:  { id: number; slug: string }[]
  fantasy_tags:      { id: number; slug: string }[]
} = JSON.parse(taxInner)

const storyCategMap = new Map<string, number>()
const moodMap       = new Map<string, number>()
const orientMap     = new Map<string, number>()
const fantasyMap    = new Map<string, number>()

for (const r of (taxonomy.story_categories  ?? [])) storyCategMap.set(r.slug, r.id)
for (const r of (taxonomy.mood_tags         ?? [])) moodMap.set(r.slug, r.id)
for (const r of (taxonomy.orientation_tags  ?? [])) orientMap.set(r.slug, r.id)
for (const r of (taxonomy.fantasy_tags      ?? [])) fantasyMap.set(r.slug, r.id)

console.log(
  `Taxonomy: ${storyCategMap.size} story categories · ` +
  `${moodMap.size} mood tags · ${orientMap.size} orientation tags · ` +
  `${fantasyMap.size} fantasy tags`
)

// ── Types ──────────────────────────────────────────────────────────────────────
interface Tags {
  story_category_ids:  number[]
  mood_tag_ids:        number[]
  orientation_tag_ids: number[]
  fantasy_tag_ids:     number[]
  primary_category_id: number | null
}

const EMPTY_TAGS: Tags = {
  story_category_ids:  [],
  mood_tag_ids:        [],
  orientation_tag_ids: [],
  fantasy_tag_ids:     [],
  primary_category_id: null,
}

// ── System prompt ──────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You classify adult erotica stories. Return ONLY a JSON object, no markdown, no explanation.

Shape: {"story_categories":[],"mood_tags":[],"orientation_tags":[],"fantasy_tags":[]}

Rules:
- story_categories: 1 to 6 slugs from ALLOWED list. Never empty.
- mood_tags: 2 to 6 slugs from ALLOWED list. Never empty.
- orientation_tags: 1 to 3 slugs from ALLOWED list. Never empty.
- fantasy_tags: 2 to 6 slugs from ALLOWED list. Can be empty if truly none apply.
- Use ONLY slugs from the allowed lists. Never invent new ones.

ALLOWED story_categories: confession, erotica, cheating-affairs, taboo-forbidden, bdsm-kink, incest-step-family, workplace-office, college-campus, one-night-stand, group-sex, cuckolding-hotwife, public-exhibitionism, friends-neighbors, revenge-power, audio-script, slow-burn, roleplay, first-time

ALLOWED mood_tags: intense, tender, dark, forbidden, playful, raw-desperate, romantic, dominant-energy, submissive-energy, shameless, slow-build, deviant, euphoric, desperate, voyeuristic, nostalgic

ALLOWED orientation_tags: mf, ff, mm, mmf, ffm, group, bisexual, trans, non-binary, cuckolding, hotwife, solo

ALLOWED fantasy_tags: dominance, submission, bondage, discipline-punishment, orgasm-control, consensual-non-consent, chastity, sadism, masochism, pet-play, step-family, cheating-affair, age-gap, boss-employee, teacher-student, blackmail, forbidden-attraction, neighbours-partner, stranger-encounter, uniform-fantasy, hotel-room, hidden-identity, delivery-worker, fake-relationship, revenge-fuck, accidental-exposure, first-time, slow-seduction, virgin, emotional-intimacy, secret-crush, confessional, being-watched, voyeurism, public-risk, dogging, flashing, group-dynamics, breeding-creampie, anal, size-kink, sensory-play, multiple-orgasms, squirting, feet, lactation`

// ── Helpers ────────────────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

function slugsToIds(slugs: unknown, map: Map<string, number>): number[] {
  if (!Array.isArray(slugs)) return []
  return slugs
    .filter((s): s is string => typeof s === 'string' && map.has(s))
    .map(s => map.get(s)!)
}

// ── Classify one story (with retry) ───────────────────────────────────────────
async function classifyStory(story: Record<string, unknown>): Promise<Tags> {
  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('http://localhost:11434/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:    'llama3.1',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user',   content: `Title: ${story.title ?? ''}\nExcerpt: ${story.excerpt ?? ''}` },
          ],
          stream: false,
          format: 'json',
        }),
      })

      if (!res.ok) {
        const errBody = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status}: ${errBody}`)
      }

      const data = await res.json() as { message?: { content: string } }
      const raw  = data.message?.content ?? '{}'

      // Strip markdown code fences if model wraps JSON in them
      const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim()
      const parsed  = JSON.parse(cleaned)

      const story_category_ids  = slugsToIds(parsed.story_categories,  storyCategMap)
      const mood_tag_ids        = slugsToIds(parsed.mood_tags,         moodMap)
      const orientation_tag_ids = slugsToIds(parsed.orientation_tags,  orientMap)
      const fantasy_tag_ids     = slugsToIds(parsed.fantasy_tags,      fantasyMap)
      const primary_category_id = story_category_ids[0] ?? null

      return { story_category_ids, mood_tag_ids, orientation_tag_ids, fantasy_tag_ids, primary_category_id }
    } catch (err) {
      lastError = err
      if (attempt < 2) await sleep(3000)
    }
  }

  const id = String(story.id ?? '?')
  const msg = lastError instanceof Error ? lastError.message : String(lastError)
  console.warn(`[WARN] failed: ${id} — ${msg}`)
  return { ...EMPTY_TAGS }
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const inputPath    = process.argv[2] ?? path.resolve(process.cwd(), '../../scraped_stories.ndjson')
  const inputDir     = path.dirname(path.resolve(inputPath))
  const outputPath   = path.join(inputDir, 'scraped_stories_enriched.ndjson')
  const progressPath = path.join(SCRIPT_DIR, 'classify_progress.txt')

  // Load resume set
  const done = new Set<string>()
  if (fs.existsSync(progressPath)) {
    for (const id of fs.readFileSync(progressPath, 'utf8').split('\n')) {
      const t = id.trim()
      if (t) done.add(t)
    }
  }
  console.log(`Resuming: ${done.size} already processed`)

  // Read all un-processed stories into memory
  const stories: Record<string, unknown>[] = []
  const rl = readline.createInterface({
    input:     fs.createReadStream(inputPath),
    crlfDelay: Infinity,
  })
  for await (const line of rl) {
    if (!line.trim()) continue
    try {
      const s = JSON.parse(line) as Record<string, unknown>
      if (!done.has(String(s.id ?? ''))) stories.push(s)
    } catch { /* skip malformed lines */ }
  }

  const grandTotal = stories.length + done.size
  console.log(`Total: ${grandTotal} · to classify: ${stories.length} · skipped: ${done.size}\n`)

  const outputStream   = fs.createWriteStream(outputPath,   { flags: 'a' })
  const progressStream = fs.createWriteStream(progressPath, { flags: 'a' })

  let processed  = 0
  const startMs  = Date.now()
  const BATCH    = 10

  for (let i = 0; i < stories.length; i += BATCH) {
    const batch = stories.slice(i, i + BATCH)

    await Promise.all(batch.map(async (story) => {
      const tags     = await classifyStory(story)
      const enriched = { ...story, ...tags }
      outputStream.write(JSON.stringify(enriched) + '\n')
      progressStream.write(String(story.id ?? '') + '\n')
      processed++

      const totalDone = done.size + processed
      if (totalDone % 100 === 0) {
        const elapsedSec = (Date.now() - startMs) / 1000
        const rate       = processed / elapsedSec           // stories/sec
        const left       = stories.length - processed
        const etaMin     = rate > 0 ? Math.ceil(left / rate / 60) : 0
        const pct        = ((totalDone / grandTotal) * 100).toFixed(1)
        console.log(`[${totalDone}/${grandTotal}] ${pct}% complete — ~${etaMin} min remaining`)
      }
    }))

    if (i + BATCH < stories.length) await sleep(150)
  }

  await new Promise<void>(resolve => outputStream.end(resolve))
  await new Promise<void>(resolve => progressStream.end(resolve))

  console.log(`\n✅  Done. ${processed} stories classified → ${outputPath}`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
