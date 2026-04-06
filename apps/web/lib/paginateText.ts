export function paginateText(body: string, maxChars = 700): string[] {
  const sections = body.split('\n\n---\n\n')
  const pages: string[] = []
  for (const section of sections) {
    if (section.length <= maxChars) { pages.push(section.trim()); continue }
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
