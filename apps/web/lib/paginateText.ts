export type FontSize = 'sm' | 'md' | 'lg' | 'xl'

/** Approximate characters that fit per page at each font size */
export const FONT_SIZE_CHARS: Record<FontSize, number> = {
  sm: 1100,
  md: 700,
  lg: 480,
  xl: 320,
}

/** Rendered px value for each font size label */
export const FONT_SIZE_PX: Record<FontSize, number> = {
  sm: 14,
  md: 18,
  lg: 22,
  xl: 26,
}

export const FONT_SIZE_LABELS: Record<FontSize, string> = {
  sm: 'Small',
  md: 'Medium',
  lg: 'Large',
  xl: 'Extra large',
}

export function paginateText(body: string, maxChars = 700): string[] {
  const sections = body.split('\n\n---\n\n')
  const pages: string[] = []
  for (const section of sections) {
    if (section.length <= maxChars) {
      pages.push(section.trim())
      continue
    }
    let remaining = section.trim()
    while (remaining.length > maxChars) {
      let cut = remaining.lastIndexOf(' ', maxChars)
      // Only hard-cut mid-word if there is genuinely no space before the limit
      if (cut <= 0) cut = maxChars
      pages.push(remaining.slice(0, cut).trim())
      remaining = remaining.slice(cut).trim()
    }
    if (remaining) pages.push(remaining)
  }
  return pages.filter(Boolean)
}

// ─── DOM-based pagination ─────────────────────────────────────────────────────
// Splits `text` into pages that actually fit the given container dimensions.
// Runs on the client only — falls back to char-count on SSR.

function fitText(el: HTMLElement, text: string, maxH: number): string {
  el.textContent = text
  if (el.scrollHeight <= maxH) return text
  // Binary search on word boundaries
  const words = text.split(' ')
  let lo = 1,
    hi = words.length - 1
  if (hi < 1) return text // single token — return as-is
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    el.textContent = words.slice(0, mid).join(' ')
    if (el.scrollHeight <= maxH) lo = mid
    else hi = mid - 1
  }
  return words.slice(0, lo).join(' ')
}

export function computePages(
  text: string,
  fontSize: FontSize,
  containerWidth: number,
  containerHeight: number
): string[] {
  if (typeof document === 'undefined' || !containerWidth || !containerHeight) {
    return paginateText(text, FONT_SIZE_CHARS[fontSize])
  }
  // Padding values must match StoryPageContent's text rendering padding
  const availW = Math.max(80, containerWidth - 56) // 28px × 2
  const availH = Math.max(80, containerHeight - 72) // 36px × 2

  const el = document.createElement('div')
  el.setAttribute('aria-hidden', 'true')
  Object.assign(el.style, {
    position: 'fixed',
    left: '-99999px',
    top: '0',
    width: `${availW}px`,
    overflow: 'hidden',
    fontFamily: "'Playfair Display', serif",
    fontSize: `${FONT_SIZE_PX[fontSize]}px`,
    lineHeight: '2.0',
    letterSpacing: '0.02em',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    boxSizing: 'border-box',
  })
  document.body.appendChild(el)

  const pages: string[] = []
  // Honour manual page-break markers
  for (const section of text.split('\n\n---\n\n')) {
    let remaining = section.trim()
    while (remaining.length > 0) {
      const page = fitText(el, remaining, availH)
      pages.push(page.trim())
      const next = remaining.slice(page.length).trimStart()
      if (next === remaining) break // safety: nothing consumed
      remaining = next
    }
  }

  document.body.removeChild(el)
  return pages.filter(Boolean)
}
