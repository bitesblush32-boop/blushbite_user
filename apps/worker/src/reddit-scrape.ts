import { writeFileSync, appendFileSync } from 'fs';
import { createHash } from 'crypto';

const USER_AGENT = 'Mozilla/5.0 (compatible; research-bot/1.0)';
const DELAY_MS = 2000; // be gentle — 1 req/2s

const SUBREDDITS = [
  'gonewildstories',
  'eroticliterature', 
  'sluttyconfessions',
  'sexystories',
  'Erotica',
  'dirtypenpals',
  'gonewildaudio',       // audio scripts
  'confessions',
];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchSubreddit(
  subreddit: string,
  sort: 'top' | 'hot' | 'new' = 'top',
  timeframe = 'all',
  maxPages = 10
) {
  const results: any[] = [];
  let after: string | null = null;
  let page = 0;

  while (page < maxPages) {
    const url = new URL(`https://www.reddit.com/r/${subreddit}/${sort}.json`);
    url.searchParams.set('limit', '100');
    url.searchParams.set('raw_json', '1');
    if (sort === 'top') url.searchParams.set('t', timeframe);
    if (after) url.searchParams.set('after', after);

    console.log(`→ r/${subreddit} page ${page + 1}: ${url}`);

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (res.status === 429) {
      console.log('Rate limited — waiting 30s...');
      await sleep(30_000);
      continue;
    }

    if (!res.ok) {
      console.error(`HTTP ${res.status} on r/${subreddit}`);
      break;
    }

    const json = await res.json() as any;
    const posts = json?.data?.children ?? [];

    for (const { data: p } of posts) {
      // Skip non-text posts and deleted content
      if (!p.is_self) continue;
      if (!p.selftext || p.selftext === '[deleted]' || p.selftext === '[removed]') continue;
      if (p.selftext.length < 300) continue; // too short

      results.push({
        id:         p.id,
        source:     'reddit',
        subreddit:  p.subreddit,
        title:      p.title,
        body:       p.selftext,
        excerpt:    p.selftext.slice(0, 280) + '…',
        score:      p.score,
        author:     p.author,
        url:        `https://reddit.com${p.permalink}`,
        nsfw:       p.over_18,
        created_at: new Date(p.created_utc * 1000).toISOString(),
        hash:       createHash('sha256').update(p.title + p.selftext).digest('hex').slice(0, 16),
        // --- BLANK — fill later with AI ---
        category_id:        null,
        mood_tags:          [],
        orientation_tags:   [],
        fantasy_tags:       [],
      });
    }

    after = json?.data?.after ?? null;
    if (!after) break;
    page++;
    await sleep(DELAY_MS);
  }

  return results;
}

async function main() {
  const allStories: any[] = [];

  for (const sub of SUBREDDITS) {
    console.log(`\n=== Scraping r/${sub} ===`);
    
    // Grab top/all for best historical content
    const topAll = await fetchSubreddit(sub, 'top', 'all', 10);
    console.log(`  top/all: ${topAll.length} stories`);
    
    // Also grab top/year for recent quality
    const topYear = await fetchSubreddit(sub, 'top', 'year', 3);
    console.log(`  top/year: ${topYear.length} stories`);

    allStories.push(...topAll, ...topYear);
    await sleep(3000);
  }

  // Deduplicate by hash
  const seen = new Set<string>();
  const deduped = allStories.filter(s => {
    if (seen.has(s.hash)) return false;
    seen.add(s.hash);
    return true;
  });

  console.log(`\nTotal: ${allStories.length} → ${deduped.length} after dedup`);

  // Save as NDJSON (one JSON object per line — easy to process later)
  writeFileSync(
    'scraped_stories.ndjson',
    deduped.map(s => JSON.stringify(s)).join('\n'),
    'utf8'
  );

  console.log(`✅ Saved to scraped_stories.ndjson`);
}

main().catch(console.error);