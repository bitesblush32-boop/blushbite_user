import { NextRequest, NextResponse } from 'next/server'
import { getCitySlugsForGender, slugToTitle } from '@/lib/cityPage'

const VALID_COMMUNITIES = ['female', 'male', 'shemale']

export async function GET(req: NextRequest) {
  const community = req.nextUrl.searchParams.get('community')
  if (!community || !VALID_COMMUNITIES.includes(community)) {
    return NextResponse.json([], { status: 200 })
  }

  const slugs = await getCitySlugsForGender(community)
  const cities = slugs
    .filter(Boolean)
    .map((slug) => ({ slug, name: slugToTitle(slug) }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return NextResponse.json(cities, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
  })
}
