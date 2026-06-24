import type { Story, Audio } from '@/lib/types'

export const stories: Story[] = [
  { id: '1', title: 'The hotel bar piano',       type: 'Story',      duration: '8 min',  vibe: 'Gentle tension & slow build', tags: ['Slow burn', 'Romantic'],            handle: '@still-figuring-it-out', gradient: 'linear-gradient(135deg,#1a0e20,#2a1540)' },
  { id: '2', title: 'Tuesday afternoon',         type: 'Confession', duration: '5 min',  vibe: 'Unexpected intimacy',         tags: ['Confessions', 'Slice of life'],     handle: '@not-what-youd-think',   gradient: 'linear-gradient(135deg,#0e1a18,#101f30)' },
  { id: '3', title: 'The last train north',      type: 'Story',      duration: '11 min', vibe: 'Charged quiet & slow reveal', tags: ['Intense', 'Slow burn', 'Romantic'], handle: '@northern-lights-27',    gradient: 'linear-gradient(135deg,#1a1010,#2a1520)' },
  { id: '4', title: 'First night confession',    type: 'Confession', duration: '6 min',  vibe: 'Tender vulnerability',        tags: ['Confessions', 'First-timer'],       handle: '@january-light',         gradient: 'linear-gradient(135deg,#0f1428,#1a1040)' },
  { id: '5', title: 'Slow afternoon, Barcelona', type: 'Story',      duration: '9 min',  vibe: 'Sensory & present',           tags: ['Sensory focus', 'Romantic'],        handle: '@harbour-fog',           gradient: 'linear-gradient(135deg,#1a0e20,#2a1540)' },
  { id: '6', title: 'The question she asked',    type: 'Confession', duration: '4 min',  vibe: 'Quiet revelation',            tags: ['Confessions', 'Intense'],           handle: '@quiet-room',            gradient: 'linear-gradient(135deg,#0e1a18,#101f30)' },
]

export const audios: Audio[] = [
  { id: '1', title: 'Husky goodnight',  voice: 'Femme · Husky', duration: '12 min', vibe: 'Warm & intimate',    tags: ['Soft guidance', 'Popular'], gradient: 'linear-gradient(135deg,#16101e,#2a1040)' },
  { id: '2', title: 'The long commute', voice: 'Masc · Calm',   duration: '8 min',  vibe: 'Gentle & attentive', tags: ['Slow build', 'Relaxing'],   gradient: 'linear-gradient(135deg,#101622,#201030)' },
  { id: '3', title: 'Late shift',       voice: 'Neutral',        duration: '10 min', vibe: 'Steady presence',    tags: ['Neutral', 'Grounding'],     gradient: 'linear-gradient(135deg,#0e1820,#1a1230)' },
  { id: '4', title: 'Unnamed wanting',  voice: 'Femme · Soft',   duration: '15 min', vibe: 'Slow confession',    tags: ['Confessions', 'Intimate'],  gradient: 'linear-gradient(135deg,#16101e,#2a1040)' },
  { id: '5', title: 'Rain on windows',  voice: 'Masc · Low',     duration: '6 min',  vibe: 'Present & still',    tags: ['Sensory', 'Relaxing'],      gradient: 'linear-gradient(135deg,#101622,#201030)' },
  { id: '6', title: 'Tuesday at three', voice: 'Neutral',         duration: '9 min',  vibe: 'Honest & close',     tags: ['Confessions'],              gradient: 'linear-gradient(135deg,#0e1820,#1a1230)' },
]
