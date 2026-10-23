import { ANIMALS, BODY_SYSTEMS, type AnimalId, type SystemId } from './types/anatomy'

export const selectionKey = 'vetify-anatomy:last-selection'
export type Selection = { animal: AnimalId; system: SystemId }
const validAnimal = (value: unknown) => ANIMALS.find(item => item.id === value)?.id
const validSystem = (value: unknown) => BODY_SYSTEMS.find(item => item.id === value)?.id

export function readSelection(path: string): Selection {
  const parts = path.replace(/^\/anatomy(?=\/|$)/, '').split('/').filter(Boolean)
  if (parts.length) return { animal: validAnimal(parts[0]) ?? 'dog', system: validSystem(parts[1]) ?? 'skeletal' }
  try {
    const saved = JSON.parse(localStorage.getItem(selectionKey) || 'null')
    const animal = validAnimal(saved?.animal), system = validSystem(saved?.system)
    if (animal && system) return { animal, system }
  } catch {}
  return { animal: 'dog', system: 'skeletal' }
}

export function rememberSelection(value: Selection) {
  try { localStorage.setItem(selectionKey, JSON.stringify(value)) } catch {}
}
