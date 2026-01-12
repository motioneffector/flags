import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFlagStore } from './store'
import type { FlagStore } from '../types'

describe('Key Edge Cases', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('very long key names (1000+ characters) work', () => {
    const longKey = 'a'.repeat(1000)

    expect(() => store.set(longKey, 'value')).not.toThrow()
    expect(store.get(longKey)).toBe('value')
  })

  it("Unicode in key names works: 'über_flag', '日本語'", () => {
    store.set('über_flag', true)
    store.set('日本語', 'value')

    expect(store.get('über_flag')).toBe(true)
    expect(store.get('日本語')).toBe('value')
  })

  it("key with only numbers: '123'", () => {
    store.set('123', 'value')

    expect(store.get('123')).toBe('value')
  })

  it('key with leading/trailing spaces is trimmed', () => {
    store.set('  key  ', 'value')

    expect(store.get('key')).toBe('value')
    expect(store.has('  key  ')).toBe(false)
  })
})

describe('Value Edge Cases', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('very large numbers (near MAX_SAFE_INTEGER) work', () => {
    const largeNum = Number.MAX_SAFE_INTEGER - 1
    store.set('large', largeNum)

    expect(store.get('large')).toBe(largeNum)
  })

  it('very small numbers (near MIN_SAFE_INTEGER) work', () => {
    const smallNum = Number.MIN_SAFE_INTEGER + 1
    store.set('small', smallNum)

    expect(store.get('small')).toBe(smallNum)
  })

  it('very long strings (10000+ characters) work', () => {
    const longString = 'x'.repeat(10000)
    store.set('long', longString)

    expect(store.get('long')).toBe(longString)
  })

  it('Unicode in string values works', () => {
    store.set('emoji', '🎮🎯🎨')
    store.set('japanese', '今日は良い日です')
    store.set('arabic', 'مرحبا')

    expect(store.get('emoji')).toBe('🎮🎯🎨')
    expect(store.get('japanese')).toBe('今日は良い日です')
    expect(store.get('arabic')).toBe('مرحبا')
  })

  it('string with newlines works', () => {
    const multiline = 'line1\nline2\nline3'
    store.set('text', multiline)

    expect(store.get('text')).toBe(multiline)
  })

  it('string with special characters works', () => {
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    store.set('special', special)

    expect(store.get('special')).toBe(special)
  })
})

describe('Condition Edge Cases', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('very long condition (many AND/OR) parses correctly', () => {
    for (let i = 0; i < 50; i++) {
      store.set(`flag${i}`, true)
    }

    const conditions = Array.from({ length: 50 }, (_, i) => `flag${i}`).join(' AND ')

    expect(store.check(conditions)).toBe(true)
  })

  it('deeply nested parentheses (20+ levels) work', () => {
    store.set('flag', true)

    const condition = '('.repeat(20) + 'flag' + ')'.repeat(20)

    expect(store.check(condition)).toBe(true)
  })

  it("numeric-looking flag name '123' can be used in conditions", () => {
    store.set('123', true)

    expect(store.check('123')).toBe(true)
  })
})

describe('Concurrency', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('rapid successive set() calls all succeed', () => {
    for (let i = 0; i < 1000; i++) {
      store.set(`key${i}`, i)
    }

    expect(store.keys().length).toBe(1000)
    expect(store.get('key999')).toBe(999)
  })

  it('set() during subscribe callback works', () => {
    const callback = vi.fn(() => {
      if (store.get('counter') !== undefined && (store.get('counter') as number) < 5) {
        store.set('counter', (store.get('counter') as number) + 1)
      }
    })

    store.subscribe(callback)
    store.set('counter', 0)

    expect(store.get('counter')).toBe(5)
  })

  it('delete() during subscribe callback works', () => {
    const callback = vi.fn(() => {
      if (store.has('toDelete')) {
        store.delete('toDelete')
      }
    })

    store.set('toDelete', 'value')
    store.set('trigger', 'value')
    store.subscribe(callback)

    store.set('trigger', 'newValue')

    expect(store.has('toDelete')).toBe(false)
  })

  it('store remains consistent after many rapid operations', () => {
    for (let i = 0; i < 100; i++) {
      store.set('a', i)
      store.set('b', i * 2)
      store.delete('a')
      store.set('c', i * 3)
    }

    expect(store.has('a')).toBe(false)
    expect(store.get('b')).toBe(198)
    expect(store.get('c')).toBe(297)
  })
})

describe('Memory', () => {
  it('unsubscribe properly cleans up references', () => {
    const store = createFlagStore()
    const callbacks: Array<() => void> = []

    // Subscribe and unsubscribe many times
    for (let i = 0; i < 1000; i++) {
      const unsubscribe = store.subscribe(() => {})
      callbacks.push(unsubscribe)
    }

    // Unsubscribe all
    callbacks.forEach(unsub => unsub())

    // Store should still work normally
    store.set('key', 'value')
    expect(store.get('key')).toBe('value')
  })

  it('delete properly cleans up flag', () => {
    const store = createFlagStore()

    for (let i = 0; i < 1000; i++) {
      store.set(`key${i}`, i)
    }

    for (let i = 0; i < 1000; i++) {
      store.delete(`key${i}`)
    }

    expect(store.keys().length).toBe(0)
  })

  it('clear() properly cleans up all flags', () => {
    const store = createFlagStore()

    for (let i = 0; i < 1000; i++) {
      store.set(`key${i}`, i)
    }

    store.clear()

    expect(store.keys().length).toBe(0)
    expect(Object.keys(store.all()).length).toBe(0)
  })
})
