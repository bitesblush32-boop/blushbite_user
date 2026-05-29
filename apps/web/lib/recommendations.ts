import { db } from '@/db'
import {
  fantasyTagOverlapScores, companionFantasyTags, userFantasyTags,
} from '@/db/schema'
import { eq, inArray, sql } from 'drizzle-orm'

// Intensity → weight mapping for weighted Jaccard
const INTENSITY_WEIGHT: Record<string, number> = {
  curious:  1,
  into_it:  2,
  love_it:  3,
}

// ─── Weighted Jaccard overlap score computation ────────────────────────────────
// Score = sum(user_weight for matching tags) / (totalUserWeight + |compTags| - |intersection|)
// Inserts/upserts into fantasy_tag_overlap_scores.
// Called lazily from the feed route when scores are missing.

export async function computeOverlapScores(
  userId: string,
  companionProfileIds: string[],
): Promise<void> {
  if (companionProfileIds.length === 0) return

  // Fetch user's fantasy tags with intensities
  const userTagRows = await db
    .select({
      fantasy_tag_id: userFantasyTags.fantasy_tag_id,
      intensity:      userFantasyTags.intensity,
    })
    .from(userFantasyTags)
    .where(eq(userFantasyTags.user_id, userId))

  if (userTagRows.length === 0) return

  // Build weight map and total
  const userWeightMap = new Map<number, number>()
  let totalUserWeight = 0
  for (const r of userTagRows) {
    const w = INTENSITY_WEIGHT[r.intensity] ?? 1
    userWeightMap.set(r.fantasy_tag_id, w)
    totalUserWeight += w
  }

  // Fetch companion fantasy tags for all requested profiles
  const companionTagRows = await db
    .select({
      companion_profile_id: companionFantasyTags.companion_profile_id,
      fantasy_tag_id:       companionFantasyTags.fantasy_tag_id,
    })
    .from(companionFantasyTags)
    .where(inArray(companionFantasyTags.companion_profile_id, companionProfileIds))

  // Group by companion profile
  const byProfile = new Map<string, Set<number>>()
  for (const row of companionTagRows) {
    if (!byProfile.has(row.companion_profile_id)) byProfile.set(row.companion_profile_id, new Set())
    byProfile.get(row.companion_profile_id)!.add(row.fantasy_tag_id)
  }

  const values = []
  for (const profileId of companionProfileIds) {
    const compSet = byProfile.get(profileId) ?? new Set<number>()

    // Weighted intersection: sum of user weight for tags present in companion set
    let intersectionWeight = 0
    let intersectionCount = 0
    for (const [tagId, weight] of Array.from(userWeightMap)) {
      if (compSet.has(tagId)) {
        intersectionWeight += weight
        intersectionCount++
      }
    }

    // Denominator: totalUserWeight + companion-only tags
    const companionOnlyCount = compSet.size - intersectionCount
    const denominator = totalUserWeight + companionOnlyCount
    const overlap = denominator === 0 ? 0 : intersectionWeight / denominator

    values.push({
      user_id:                userId,
      companion_profile_id:   profileId,
      overlap_score:          overlap.toFixed(4),
      matching_tag_count:     intersectionCount,
      total_user_tags:        userTagRows.length,
      total_companion_tags:   compSet.size,
      computed_at:            new Date(),
    })
  }

  if (values.length === 0) return

  await db
    .insert(fantasyTagOverlapScores)
    .values(values)
    .onConflictDoUpdate({
      target: [fantasyTagOverlapScores.user_id, fantasyTagOverlapScores.companion_profile_id],
      set: {
        overlap_score:        sql`excluded.overlap_score`,
        matching_tag_count:   sql`excluded.matching_tag_count`,
        total_user_tags:      sql`excluded.total_user_tags`,
        total_companion_tags: sql`excluded.total_companion_tags`,
        computed_at:          sql`excluded.computed_at`,
      },
    })
}
