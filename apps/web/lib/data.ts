import type { Companion, Story, Audio } from '@/lib/types'

export const companions: Companion[] = [
  { id: '1', name: 'Ava',   age: 26, city: 'Amsterdam', price: '€280', vibe: 'Romantic & in control',  tags: ['Romantic', 'Light roleplay', 'First-timer'],   gradient: 'linear-gradient(135deg,#1a1228,#2a1535,#1a2240)', photoUrl: '/companion-1.jpg' },
  { id: '2', name: 'Nora',  age: 29, city: 'Amsterdam', price: '€320', vibe: 'Gentle but decisive',    tags: ['Soft dominance', 'Confessions', 'Intimate'],   gradient: 'linear-gradient(135deg,#0f1a28,#1f2840,#2a1020)', photoUrl: '/companion-2.jpg' },
  { id: '3', name: 'Seren', age: 31, city: 'Paris',     price: '€350', vibe: 'Intellectual & intense', tags: ['Intense', 'Roleplay', 'Experimental'],          gradient: 'linear-gradient(135deg,#201228,#1a2030,#2a1a18)', photoUrl: '/companion-3.jpg' },
  { id: '4', name: 'Kai',   age: 27, city: 'London',    price: '€260', vibe: 'Warm & unhurried',       tags: ['Gentle', 'Romantic', 'Sensory focus'],          gradient: 'linear-gradient(135deg,#0a1620,#1a1535,#201a10)', photoUrl: '/companion-4.jpg' },
  { id: '5', name: 'Maëve', age: 30, city: 'Paris',     price: '€400', vibe: 'Mysterious & precise',   tags: ['Power dynamic', 'Experimental', 'Luxury'],     gradient: 'linear-gradient(135deg,#1a1020,#2a1530,#101820)', photoUrl: '/companion-5.jpg' },
  { id: '6', name: 'Irina', age: 25, city: 'Amsterdam', price: '€290', vibe: 'Playful & confident',    tags: ['Roleplay', 'Light touch', 'Fun'],               gradient: 'linear-gradient(135deg,#101820,#201028,#102020)', photoUrl: '/companion-6.jpg' },
  { id: '7', name: 'Sol',   age: 28, city: 'London',    price: '€310', vibe: 'Calm & attentive',       tags: ['Sensory focus', 'Gentle', 'Slow burn'],        gradient: 'linear-gradient(135deg,#1a1228,#2a1535,#1a2240)', photoUrl: '/companion-7.jpg' },
  { id: '8', name: 'Alara', age: 33, city: 'Paris',     price: '€380', vibe: 'Bold & expressive',      tags: ['Intense', 'Dominant energy', 'Confident'],     gradient: 'linear-gradient(135deg,#201228,#1a2030,#2a1a18)', photoUrl: '/companion-8.jpg' },
]

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
