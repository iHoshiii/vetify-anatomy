import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readSelection, rememberSelection, selectionKey } from '../src/selection'

describe('saved anatomy selection', () => {
  let values: Map<string, string>
  beforeEach(() => {
    values = new Map()
    vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) })
  })
  afterEach(() => vi.unstubAllGlobals())
  it('restores the last view at the root while an explicit deep link takes precedence', () => {
    rememberSelection({ animal: 'cat', system: 'digestive' })
    expect(readSelection('/')).toEqual({ animal: 'cat', system: 'digestive' })
    expect(readSelection('/anatomy/')).toEqual({ animal: 'cat', system: 'digestive' })
    expect(readSelection('/anatomy/bird/nervous')).toEqual({ animal: 'bird', system: 'nervous' })
    expect(readSelection('/dog/skeletal')).toEqual({ animal: 'dog', system: 'skeletal' })
  })
  it('ignores corrupt or unsupported saved selections', () => {
    for (const value of ['{', 'null', '{"animal":"rabbit","system":"skeletal"}', '{"animal":"cat","system":"missing"}']) {
      values.set(selectionKey, value)
      expect(readSelection('/')).toEqual({ animal: 'dog', system: 'skeletal' })
    }
  })
  it('remains usable when browser storage is unavailable', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('Blocked') }, setItem: () => { throw new Error('Blocked') } })
    expect(() => rememberSelection({ animal: 'bird', system: 'nervous' })).not.toThrow()
    expect(readSelection('/')).toEqual({ animal: 'dog', system: 'skeletal' })
  })
})
