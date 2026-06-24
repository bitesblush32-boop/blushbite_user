/**
 * Update the 5 Indian seed companions to use INR pricing.
 * Run: npx tsx --env-file .env.local scripts/update-indian-prices.ts
 */
import postgres from 'postgres'

const PROFILES = [
  { email: 'priya.seed@blushbite.internal',  price: '24000', hourlyRate: '24000' },
  { email: 'anika.seed@blushbite.internal',  price: '20000', hourlyRate: '20000' },
  { email: 'meera.seed@blushbite.internal',  price: '18000', hourlyRate: '18000' },
  { email: 'kavya.seed@blushbite.internal',  price: '32000', hourlyRate: '32000' },
  { email: 'zara.seed@blushbite.internal',   price: '25000', hourlyRate: '25000' },
]

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 })
  console.log('Updating Indian companion prices to INR...\n')

  for (const p of PROFILES) {
    const [comp] = await sql`
      SELECT id FROM companions WHERE email = ${p.email} LIMIT 1
    `
    if (!comp) { console.log(`  Skipping ${p.email} — not found`); continue }

    // Update companion_profiles: currency + hourly_rate
    await sql`
      UPDATE companion_profiles
      SET currency = 'INR', hourly_rate = ${p.hourlyRate}
      WHERE companion_id = ${comp.id}
    `

    // Update session_cards: currency + price
    const updated = await sql`
      UPDATE session_cards sc
      SET currency = 'INR', price = ${p.price}
      FROM companion_profiles cp
      WHERE sc.companion_profile_id = cp.id
        AND cp.companion_id = ${comp.id}
      RETURNING sc.id
    `
    console.log(`  ✓ ${p.email} → ₹${p.price} (${updated.length} session card(s))`)
  }

  console.log('\nDone.')
  await sql.end()
}

main().catch(e => { console.error(e); process.exit(1) })
