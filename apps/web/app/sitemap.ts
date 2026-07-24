import type { MetadataRoute } from 'next'
import { getCitySlugsForGender } from '@/lib/cityPage'

const BASE_URL = 'https://blushbite.co'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [femaleCities, maleCities, shemaleCities] = await Promise.all([
    getCitySlugsForGender('female'),
    getCitySlugsForGender('male'),
    getCitySlugsForGender('shemale'),
  ])

  const citiyEntries = (cities: string[], gender: string): MetadataRoute.Sitemap =>
    cities.map((city) => ({
      url: `${BASE_URL}/${gender}/${city}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/female`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/male`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/shemale`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...citiyEntries(femaleCities, 'female'),
    ...citiyEntries(maleCities, 'male'),
    ...citiyEntries(shemaleCities, 'shemale'),
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
