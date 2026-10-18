import { describe, expect, it } from 'vitest'
import { anatomyView, mainAnatomyUrl, mainDestination } from '../src/integration'

describe('main Anatomy navigation', () => {
  it('keeps only recognized anatomy selections', () => {
    expect(anatomyView('/anatomy/bird/nervous')).toBe('/bird/nervous')
    expect(anatomyView('/cat/digestive')).toBe('/cat/digestive')
    for (const value of ['//evil.example', '/auth/login', '/dog/skeletal?token=secret', '/anatomy-evil/cat/digestive']) {
      expect(anatomyView(value)).toBe('/')
    }
  })
  it('returns to main with a safe view and known error, without carrying arbitrary query values', () => {
    const destination = new URL(mainAnatomyUrl('/bird/nervous', 'failed'))
    expect(destination.pathname).toBe('/anatomy')
    expect([...destination.searchParams]).toEqual([['hosted', '1'], ['view', '/bird/nervous'], ['auth', 'failed']])
    expect(new URL(mainAnatomyUrl('/', 'untrusted')).search).toBe('?hosted=1')
  })
  it('permits navbar navigation only to main internal paths', () => {
    expect(new URL(mainDestination('/services?tab=care')!).pathname).toBe('/services')
    for (const path of ['//evil.example', '/\\evil.example', 'https://evil.example', 'javascript:alert(1)', null]) {
      expect(mainDestination(path)).toBeNull()
    }
  })
})
