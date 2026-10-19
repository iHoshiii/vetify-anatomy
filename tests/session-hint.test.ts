import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hasSessionHint, sessionHintKey, sessionHintLifetime, updateSessionHint } from '../src/session-hint'

const values = new Map<string, string>()
beforeEach(() => {
  values.clear()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-19T04:00:00Z'))
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  })
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

describe('temporary session display hint', () => {
  it('restores recent layout state without storing identity or credentials', () => {
    expect(hasSessionHint()).toBe(false)
    updateSessionHint(true)
    expect(hasSessionHint()).toBe(true)
    expect([...values]).toEqual([[sessionHintKey, String(Date.now())]])
    vi.advanceTimersByTime(sessionHintLifetime)
    expect(hasSessionHint()).toBe(false)
  })
  it('clears the hint on refusal, logout or unavailable validation', () => {
    updateSessionHint(true)
    updateSessionHint(false)
    expect(hasSessionHint()).toBe(false)
    expect(values.size).toBe(0)
  })
  it('ignores invalid and future timestamps', () => {
    for (const value of ['nonsense', '0', String(Date.now() + 1)]) {
      values.set(sessionHintKey, value)
      expect(hasSessionHint()).toBe(false)
    }
  })
  it('falls back to normal validation when browser storage is blocked', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => { throw new Error('Blocked') },
      setItem: () => { throw new Error('Blocked') },
      removeItem: () => { throw new Error('Blocked') },
    })
    expect(hasSessionHint()).toBe(false)
    expect(() => updateSessionHint(true)).not.toThrow()
    expect(() => updateSessionHint(false)).not.toThrow()
  })
})
