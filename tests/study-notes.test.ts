import { describe, expect, it } from 'vitest'
import dog from '../src/data/dog'
import cat from '../src/data/cat'
import bird from '../src/data/bird'
import { ANIMALS, BODY_SYSTEMS } from '../src/types/anatomy'
import { getStudyNote } from '../src/data/study-notes'

describe('study note coverage', () => {
  it('provides complete notes and reading references for every existing structure', () => {
    let count = 0
    for (const animal of ANIMALS) for (const system of BODY_SYSTEMS) {
      for (const spot of ({ dog, cat, bird })[animal.id][system.id]) {
        const note = getStudyNote(animal.id, system.id, spot)
        for (const field of [note.description, note.purpose, note.remember, note.question]) {
          expect(field, `${animal.id}/${system.id}/${spot.id}`).toBeTruthy()
        }
        expect(new URL(note.source.url).protocol).toBe('https:')
        expect(note.source.name).toBeTruthy()
        count++
      }
    }
    expect(count).toBe(70)
  })
  it('distinguishes bird structures from the mammalian structures sharing their identifiers', () => {
    const birdPelvis = getStudyNote('bird', 'skeletal', bird.skeletal.find(spot => spot.id === 'pelvis')!)
    const dogPelvis = getStudyNote('dog', 'skeletal', dog.skeletal.find(spot => spot.id === 'pelvis')!)
    expect(birdPelvis.description).toContain('synsacrum')
    expect(dogPelvis.description).not.toContain('synsacrum')
    const sacs = getStudyNote('bird', 'cardiovascular', bird.cardiovascular.find(spot => spot.id === 'air_sacs')!)
    expect(sacs.purpose).toContain('lungs perform gas exchange')
  })
})
