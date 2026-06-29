// In-memory OTP store — module-level singleton, shared across route handlers
// Suitable for single Railway instance (landing page volume is low)

interface OtpEntry {
  otp: string
  expiry: number // Unix ms
  attempts: number // verify attempts, max 5
}

interface RateEntry {
  count: number
  windowStart: number // Unix ms
}

const otpStore = new Map<string, OtpEntry>()
const rateStore = new Map<string, RateEntry>()

const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes
const RATE_WINDOW_MS = 10 * 60 * 1000 // 10-minute window
const MAX_SENDS = 3 // max OTP sends per window
const MAX_ATTEMPTS = 5 // max verify attempts per OTP

export function checkRateLimit(email: string): boolean {
  const now = Date.now()
  const entry = rateStore.get(email)
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateStore.set(email, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= MAX_SENDS) return false
  entry.count++
  return true
}

export function storeOtp(email: string, otp: string): void {
  otpStore.set(email, { otp, expiry: Date.now() + OTP_TTL_MS, attempts: 0 })
}

export type VerifyResult = { ok: true } | { ok: false; error: string }

export function verifyOtp(email: string, otp: string): VerifyResult {
  const entry = otpStore.get(email)
  if (!entry) return { ok: false, error: 'No code sent for this email. Request a new one.' }
  if (Date.now() > entry.expiry) {
    otpStore.delete(email)
    return { ok: false, error: 'Code expired. Request a new one.' }
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(email)
    return { ok: false, error: 'Too many attempts. Request a new code.' }
  }
  if (entry.otp !== otp) {
    entry.attempts++
    return { ok: false, error: 'That code is incorrect.' }
  }
  otpStore.delete(email)
  return { ok: true }
}
