import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let lat: number, lng: number
  try {
    const body = await req.json()
    lat = body.lat
    lng = body.lng
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }

  const key = process.env.GOOGLE_MAPS_API_KEY
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json` +
    `?latlng=${lat},${lng}&result_type=locality|administrative_area_level_2&language=en&key=${key}`

  const geoRes = await fetch(url)
  const data: any = await geoRes.json()

  if (data.status !== 'OK' || !data.results?.length) {
    return NextResponse.json({ error: 'Could not determine location' }, { status: 422 })
  }

  let city: string | null = null
  let country: string | null = null

  for (const result of data.results as any[]) {
    for (const comp of result.address_components as any[]) {
      if (
        !city &&
        (comp.types.includes('locality') ||
          comp.types.includes('sublocality_level_1') ||
          comp.types.includes('administrative_area_level_2'))
      ) {
        city = comp.long_name
      }
      if (!country && comp.types.includes('country')) {
        country = comp.short_name
      }
    }
    if (city && country) break
  }

  return NextResponse.json({ data: { city, country } })
}
