import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import dog from '../src/data/dog'
import cat from '../src/data/cat'
import bird from '../src/data/bird'
import IMAGE_CONFIG from '../src/data/image-config'
import { ANIMALS, BODY_SYSTEMS } from '../src/types/anatomy'
import original from './fixtures/source-hotspots.json'
import manifest from '../docs/source-manifest.json'

describe('Behavior-preserving source port', () => {
  it('preserves every hotspot coordinate, title and description', () => {
    expect({ dog, cat, bird }).toEqual(original)
  })
  it('has complete configurations for all 15 animal/system combinations', () => {
    for (const animal of ANIMALS) for (const system of BODY_SYSTEMS) {
      const config = IMAGE_CONFIG[animal.id][system.id]
      expect(config).toMatchObject({ width: 720, height: 460 })
      expect(manifest.assets.some(asset => asset.route === config.src)).toBe(true)
      for (const spot of ({ dog, cat, bird })[animal.id][system.id]) {
        expect(spot.x).toBeGreaterThanOrEqual(0)
        expect(spot.x).toBeLessThanOrEqual(100)
        expect(spot.y).toBeGreaterThanOrEqual(0)
        expect(spot.y).toBeLessThanOrEqual(100)
      }
    }
    expect(IMAGE_CONFIG.dog.skeletal.scale).toBe(1.4)
    expect(IMAGE_CONFIG.cat.digestive.scale).toBe(1.2)
  })
  it('preserves original diagram and logo bytes', async () => {
    for (const asset of [...manifest.assets, manifest.logo]) {
      const bytes = await readFile(asset.destination)
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256)
    }
  })
})
