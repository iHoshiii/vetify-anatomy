export type AnatomySystem = { id: string; x: number; y: number; title: string; desc: string }
export type SpotDetails = readonly [string, number, number, string, string]
export const ANIMALS = [
  { id: 'dog', name: 'Dog', icon: '🐕' },
  { id: 'cat', name: 'Cat', icon: '🐈' },
  { id: 'bird', name: 'Bird', icon: '🦜' },
] as const
export const BODY_SYSTEMS = [
  { id: 'skeletal', name: 'Skeletal System', icon: '🦴' },
  { id: 'muscular', name: 'Muscular System', icon: '💪' },
  { id: 'digestive', name: 'Digestive System', icon: '🥩' },
  { id: 'cardiovascular', name: 'Cardiovascular', icon: '❤️' },
  { id: 'nervous', name: 'Nervous System', icon: '🧠' },
] as const
export type AnimalId = (typeof ANIMALS)[number]['id']
export type SystemId = (typeof BODY_SYSTEMS)[number]['id']
export const createSystem = (data: readonly SpotDetails[]): AnatomySystem[] =>
  data.map(([id, x, y, title, desc]) => ({ id, x, y, title, desc }))
