import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/auth/signin', '/privacy', '/terms', '/*/*'],
        disallow: [
          '/api/',
          '/auth/onboarding',
          '/auth/error',
          '/auth/age-gate',
          '/profile',
          '/create',
          '/notifications',
          '/companion/',
          '/admin/',
          '/admin-generate',
          '/_next/',
        ],
      },
    ],
    sitemap: 'https://blushbite.co/sitemap.xml',
    host: 'https://blushbite.co',
  }
}
