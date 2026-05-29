// Maps onboarding vibe strings → fantasy_tag slugs for bootstrap seeding
// When a user has no explicit fantasy tags, we map their vibes here on first feed hit.

export const VIBE_TO_TAG_SLUGS: Record<string, string[]> = {
  'Curious':      ['first-timer', 'soft-exploration'],
  'Romantic':     ['romance', 'candlelight', 'slow-burn'],
  'Dominant':     ['dominance', 'control', 'light-bdsm'],
  'Submissive':   ['submission', 'discipline', 'light-bdsm'],
  'Experimental': ['experimental', 'taboo-exploration', 'voyeurism'],
  'Soft & Gentle':['romance', 'gentle-touch', 'emotional-connection'],
  'Mischievous':  ['roleplay', 'fantasy-scenario', 'playful'],
  'Strict':       ['dominance', 'discipline', 'control'],
  'Wild':         ['intense', 'experimental', 'exhibitionism'],
  'Elegant':      ['luxury', 'slow-burn', 'sensory-play'],
  'Sensual':      ['sensory-play', 'body-worship', 'touch'],
  'Bratty':       ['submission', 'playful', 'discipline'],
  'Intense':      ['intense', 'emotional-connection', 'trust'],
  'Flirty':       ['romance', 'playful', 'first-timer'],
  'Mysterious':   ['slow-burn', 'fantasy-scenario', 'taboo-exploration'],
  'Nurturing':    ['aftercare', 'emotional-connection', 'gentle-touch'],
  'Cerebral':     ['psychological', 'trust', 'intense'],
  'Radiant':      ['luxury', 'body-worship', 'romance'],
  'Demanding':    ['dominance', 'control', 'discipline'],
  'Spontaneous':  ['experimental', 'playful', 'first-timer'],
}

// Gender mapping: onboarding labels → companion_profiles.gender CHECK values
export const DESIRED_GENDER_MAP: Record<string, string> = {
  'Female':        'woman',
  'Male':          'man',
  'Trans Female':  'trans_woman',
  'Trans Male':    'trans_man',
  'Non-Binary':    'non_binary',
  'Genderfluid':   'non_binary',
  'Genderqueer':   'non_binary',
  'Agender':       'other',
  'Bigender':      'other',
  'Androgynous':   'other',
}

// Intensity-bucketed vibe tag names for mood adjustment
export const INTENSE_VIBE_NAMES = new Set(['Intense', 'Wild', 'Dominant', 'Demanding', 'Strict', 'Experimental'])
export const GENTLE_VIBE_NAMES  = new Set(['Romantic', 'Soft & Gentle', 'Nurturing', 'Sensual', 'Flirty'])
