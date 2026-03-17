const adjectives = [
  'amber', 'ancient', 'ashen', 'bare', 'bitter', 'black', 'blush', 'bold',
  'broken', 'calm', 'cardinal', 'carved', 'close', 'cold', 'copper', 'crimson',
  'dark', 'dusk', 'electric', 'ember', 'faded', 'faint', 'gilded', 'glass',
  'golden', 'grey', 'hollow', 'honest', 'hushed', 'idle', 'ivory', 'jade',
  'knowing', 'late', 'lavender', 'lean', 'light', 'liminal', 'lone', 'lucid',
  'lunar', 'marbled', 'midnight', 'mild', 'misty', 'muted', 'narrow', 'night',
  'northern', 'oblique', 'onyx', 'open', 'pale', 'phantom', 'private', 'quiet',
  'raven', 'raw', 'restless', 'rose', 'rouge', 'sable', 'scarlet', 'secret',
  'sheer', 'silent', 'silver', 'slow', 'smoke', 'soft', 'solstice', 'stark',
  'still', 'strange', 'tender', 'thin', 'twilight', 'unnamed', 'unspoken',
  'velvet', 'violet', 'warm', 'wandering', 'winter', 'worn', 'woven',
]

const nouns = [
  'afternoon', 'anchor', 'archive', 'aria', 'atlas', 'autumn', 'avenue',
  'bloom', 'breath', 'bridge', 'candle', 'chapel', 'chord', 'coast',
  'compass', 'confession', 'corridor', 'dawn', 'desire', 'door', 'dusk',
  'echo', 'ember', 'evening', 'fable', 'figure', 'flame', 'flare',
  'fog', 'folio', 'garden', 'ghost', 'glade', 'glass', 'grace',
  'harbour', 'haven', 'hour', 'hush', 'ink', 'interval', 'island',
  'journal', 'key', 'lamp', 'lantern', 'library', 'light', 'linen',
  'longing', 'lullaby', 'map', 'meadow', 'mirror', 'mist', 'moon',
  'muse', 'myth', 'night', 'north', 'note', 'notion', 'novella',
  'ocean', 'passage', 'pause', 'petal', 'phrase', 'pilgrim', 'place',
  'plume', 'portal', 'prism', 'quarter', 'rain', 'reverie', 'rhyme',
  'ridge', 'ritual', 'river', 'room', 'rose', 'secret', 'shade',
  'shadow', 'shore', 'signal', 'silence', 'silhouette', 'smoke', 'solace',
  'sonnet', 'spark', 'spell', 'star', 'station', 'storm', 'strand',
  'study', 'summer', 'swan', 'syntax', 'thought', 'thread', 'tide',
  'tower', 'trace', 'trail', 'truth', 'tunnel', 'twilight', 'vessel',
  'vigil', 'vista', 'voice', 'wave', 'window', 'wing', 'winter', 'wish',
]

export function generateAlias(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `@${adj}-${noun}`
}
