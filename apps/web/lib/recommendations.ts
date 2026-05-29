import { db } from '@/db'
import {
  fantasyTagOverlapScores, companionFantasyTags, userFantasyTags,
} from '@/db/schema'
import { eq, inArray, sql } from 'drizzle-orm'

// ─── Jaccard overlap score computation ────────────────────────────────────────
// Computes Jaccard similarity between user fantasy tags and each companion's
// fantasy tags. Inserts/upserts into fantasy_tag_overlap_scores.
// Called lazily from the feed route when scores are missing.

export async function computeOverlapScores(
  userId: string,
  companionProfileIds: string[],
): Promise<void> {
  if (companionProfileIds.length === 0) return

  // Fetch user's fantasy tag set
  const userTagRows = await db
    .select({ fantasy_tag_id: userFantasyTags.fantasy_tag_id })
    .from(userFantasyTags)
    .where(eq(userFantasyTags.user_id, userId))

  const userTagSet = new Set(userTagRows.map(r => r.fantasy_tag_id))
  if (userTagSet.size === 0) return

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
    const intersection = [...userTagSet].filter(t => compSet.has(t)).length
    const union = new Set([...userTagSet, ...compSet]).size
    const overlap = union === 0 ? 0 : intersection / union

    values.push({
      user_id:                userId,
      companion_profile_id:   profileId,
      overlap_score:          overlap.toFixed(4),
      matching_tag_count:     intersection,
      total_user_tags:        userTagSet.size,
      total_companion_tags:   compSet.size,
      computed_at:            new Date(),
    })
  }

  if (values.length === 0) return

  // Upsert — safe to re-run
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
