import { createReadStream, createWriteStream } from 'fs'
import { createInterface } from 'readline'

// Offsets based on your actual DB IDs from que.csv
const STORY_OFFSET   = 44   // DB: 45-62
const MOOD_OFFSET    = 40   // DB: 41-56
const ORIENT_OFFSET  = 29   // DB: 30-41
const FANTASY_OFFSET = 138  // DB: 139-184

// Valid DB ID ranges (from que.csv)
const VALID = {
  story:   { min: 45, max: 62 },
  mood:    { min: 41, max: 56 },
  orient:  { min: 30, max: 41 },
  fantasy: { min: 139, max: 184 },
}

function remap(ids, offset, valid) {
  if (!Array.isArray(ids)) return []
  return ids
    .filter(id => id > 0)              // drop zeros
    .map(id => id + offset)
    .filter(id => id >= valid.min && id <= valid.max)  // drop out-of-range
}

const input  = createReadStream('scraped_stories_enriched.ndjson')
const output = createWriteStream('scraped_stories_remapped.ndjson')
const rl     = createInterface({ input, crlfDelay: Infinity })

let count = 0, skipped = 0

rl.on('line', (line) => {
  if (!line.trim()) return
  const r = JSON.parse(line)

  r.story_category_ids  = remap(r.story_category_ids,  STORY_OFFSET,   VALID.story)
  r.mood_tag_ids        = remap(r.mood_tag_ids,         MOOD_OFFSET,    VALID.mood)
  r.orientation_tag_ids = remap(r.orientation_tag_ids,  ORIENT_OFFSET,  VALID.orient)
  r.fantasy_tag_ids     = remap(r.fantasy_tag_ids,      FANTASY_OFFSET, VALID.fantasy)
  r.primary_category_id = (r.primary_category_id > 0)
    ? r.primary_category_id + STORY_OFFSET
    : null

  // Validate primary_category_id is in range
  if (r.primary_category_id !== null &&
     (r.primary_category_id < VALID.story.min || r.primary_category_id > VALID.story.max)) {
    r.primary_category_id = null
    skipped++
  }

  output.write(JSON.stringify(r) + '\n')
  count++
  if (count % 500 === 0) process.stdout.write(`Remapped ${count}...\r`)
})

rl.on('close', () => {
  output.end()
  console.log(`\nDone. ${count} records written. ${skipped} primary_category_id nulled (out of range).`)
})