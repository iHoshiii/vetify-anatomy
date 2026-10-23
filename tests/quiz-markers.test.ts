import { expect, it } from 'vitest'
import dog from '../src/data/dog'
import cat from '../src/data/cat'
import bird from '../src/data/bird'
import { BODY_SYSTEMS } from '../src/types/anatomy'
import { quizMarkers } from '../src/quiz-markers'

it('keeps quiz touch targets apart without changing the anatomical coordinates', () => {
  for (const animal of [dog, cat, bird]) for (const system of BODY_SYSTEMS) {
    const spots = animal[system.id], offsets = quizMarkers(spots, 280, 175)
    const positions = spots.map((spot, index) => ({ x: spot.x * 2.8 + offsets[index].x, y: spot.y * 1.75 + offsets[index].y }))
    for (let i = 0; i < positions.length; i++) for (let j = i + 1; j < positions.length; j++) {
      expect(Math.hypot(positions[i].x - positions[j].x, positions[i].y - positions[j].y)).toBeGreaterThan(47)
    }
  }
})
