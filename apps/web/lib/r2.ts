import { S3Client } from '@aws-sdk/client-s3'

if (!process.env.R2_ACCOUNT_ID)        throw new Error('R2_ACCOUNT_ID missing')
if (!process.env.R2_ACCESS_KEY_ID)     throw new Error('R2_ACCESS_KEY_ID missing')
if (!process.env.R2_SECRET_ACCESS_KEY) throw new Error('R2_SECRET_ACCESS_KEY missing')
if (!process.env.R2_BUCKET_NAME)       throw new Error('R2_BUCKET_NAME missing')

export const r2 = new S3Client({
  region: 'weur',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.eu.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

export const R2_BUCKET = process.env.R2_BUCKET_NAME
export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_CDN_URL || 'https://pub-85202ed0fadd4c2e8a7aeb1bfd56cc3b.r2.dev'
