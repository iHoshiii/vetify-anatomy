import type { AnatomySystem, AnimalId, SystemId } from '../types/anatomy'
import { birdStudyFacts } from './bird-study-facts'
import { studyFacts } from './study-facts'
import { studySources } from './study-sources'

export function getStudyNote(animal: AnimalId, system: SystemId, spot: AnatomySystem) {
  const facts = (animal === 'bird' ? birdStudyFacts[spot.id] : undefined) ?? studyFacts[spot.id]
  const source = spot.id === 'liver' ? studySources.liver
    : animal === 'bird' && system === 'digestive' ? studySources.birdDigestive
    : animal === 'bird' && system === 'muscular' ? studySources.birdMuscular
    : animal === 'bird' && (system === 'skeletal' || spot.id === 'air_sacs') ? studySources.bird
    : studySources[system]
  return { description: facts[0], purpose: facts[1], remember: facts[2], question: facts[3], source }
}
