import type { Config } from 'drizzle-kit'

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://postgres:IEyufsebjCWfstCHSjJtpvuAXgInSxED@mainline.proxy.rlwy.net:55141/railway',
  },
} satisfies Config
