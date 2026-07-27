// Dreamer (user-side) session — JWT HS256, same pattern as blushbite.live companion auth
// Cookie: bb_dreamer_session (dev) / __Host-bb_dreamer_session (prod)

import { cookies } from 'next/headers'

const SECRET = process.env.DREAMER_JWT_SECRET ?? ''
const COOKIE_NAME =
  process.env.NODE_ENV === 'production' ? '__Host-bb_dreamer_session' : 'bb_dreamer_session'
const TTL_DAYS = 30

export interface DreamerSession {
  sub: string // users.id (UUID)
  email: string
  alias: string | null
}

// ─── Encode/decode helpers ────────────────────────────────────────────────────

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf
  return Buffer.from(bytes).toString('base64url')
}

function parseB64url(s: string): Buffer {
  return Buffer.from(s, 'base64url')
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return b64url(sig)
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function signJwt(payload: DreamerSession): Promise<string> {
  if (!SECRET) throw new Error('DREAMER_JWT_SECRET not set')
  const header = b64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const body = b64url(
    Buffer.from(
      JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + TTL_DAYS * 86400 })
    )
  )
  const sig = await hmac(SECRET, `${header}.${body}`)
  return `${header}.${body}.${sig}`
}

export async function verifyJwt(token: string): Promise<DreamerSession | null> {
  if (!SECRET || !token) return null
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [header, body, sig] = parts
    const expected = await hmac(SECRET, `${header}.${body}`)
    if (sig !== expected) return null
    const payload = JSON.parse(parseB64url(body).toString())
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return { sub: payload.sub, email: payload.email, alias: payload.alias ?? null }
  } catch {
    return null
  }
}

export async function getSession(): Promise<DreamerSession | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyJwt(token)
}

export async function buildSessionCookie(payload: DreamerSession): Promise<string> {
  const token = await signJwt(payload)
  const maxAge = TTL_DAYS * 24 * 60 * 60
  const secure = process.env.NODE_ENV === 'production'
  const hostPrefix = secure ? '__Host-' : ''
  const name = `${hostPrefix}bb_dreamer_session`
  const flags = [
    `${name}=${token}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    ...(secure ? ['Secure'] : []),
  ]
  return flags.join('; ')
}

export function clearSessionCookie(): string {
  const secure = process.env.NODE_ENV === 'production'
  const name = secure ? '__Host-bb_dreamer_session' : 'bb_dreamer_session'
  return `${name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`
}
