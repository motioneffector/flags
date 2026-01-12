import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFlagStore } from './store'
import type { FlagStore } from '../types'

describe('store.compute(key, dependencies, fn)', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  describe('Basic Computed Values', () => {
    it('creates derived value from other flags', () => {
      store.set('a', 10)
      store.set('b', 20)
      store.compute('sum', ['a', 'b'], (a, b) => (a as number) + (b as number))

      expect(store.get('sum')).toBe(30)
    })

    it('computed value is immediately available via get()', () => {
      store.set('base', 100)
      store.compute('doubled', ['base'], base => (base as number) * 2)

      expect(store.get('doubled')).toBe(200)
    })

    it('computed value updates when dependency changes', () => {
      store.set('x', 5)
      store.compute('squared', ['x'], x => (x as number) ** 2)

      store.set('x', 10)

      expect(store.get('squared')).toBe(100)
    })

    it('computed function receives dependency values as arguments', () => {
      const computeFn = vi.fn((a, b, c) => (a as number) + (b as number) + (c as number))
      store.set('a', 1)
      store.set('b', 2)
      store.set('c', 3)

      store.compute('result', ['a', 'b', 'c'], computeFn)

      expect(computeFn).toHaveBeenCalledWith(1, 2, 3)
    })
  })

  describe('Example', () => {
    it('computed with single dependency', () => {
      store.set('radius', 5)
      store.compute('area', ['radius'], radius => Math.PI * (radius as number) ** 2)

      expect(store.get('area')).toBeCloseTo(78.54, 2)
    })

    it('computed with multiple dependencies', () => {
      store.set('baseScore', 100)
      store.set('bonus', 20)
      store.compute(
        'totalScore',
        ['baseScore', 'bonus'],
        (base, bonus) => (base as number) + (bonus as number)
      )

      expect(store.get('totalScore')).toBe(120)
    })

    it('computed updates when any dependency changes', () => {
      store.set('a', 10)
      store.set('b', 20)
      store.compute('sum', ['a', 'b'], (a, b) => (a as number) + (b as number))

      store.set('a', 15)
      expect(store.get('sum')).toBe(35)

      store.set('b', 25)
      expect(store.get('sum')).toBe(40)
    })

    it('computed does not update when unrelated flag changes', () => {
      const computeFn = vi.fn((a, b) => (a as number) + (b as number))
      store.set('a', 10)
      store.set('b', 20)
      store.compute('sum', ['a', 'b'], computeFn)

      computeFn.mockClear()
      store.set('c', 30)

      expect(computeFn).not.toHaveBeenCalled()
    })
  })

  describe('Computed in Conditions (Decision 10.3: yes)', () => {
    it('check() can reference computed flags', () => {
      store.set('a', 10)
      store.set('b', 20)
      store.compute('sum', ['a', 'b'], (a, b) => (a as number) + (b as number))

      expect(store.check('sum')).toBe(true)
    })

    it("check('computedFlag > 100') works", () => {
      store.set('baseScore', 100)
      store.set('bonus', 50)
      store.compute(
        'totalScore',
        ['baseScore', 'bonus'],
        (base, bonus) => (base as number) + (bonus as number)
      )

      expect(store.check('totalScore > 100')).toBe(true)
    })

    it("check('computedFlag AND otherFlag') works", () => {
      store.set('a', 1)
      store.set('b', 2)
      store.compute('sum', ['a', 'b'], (a, b) => (a as number) + (b as number))
      store.set('flag', true)

      expect(store.check('sum AND flag')).toBe(true)
    })
  })

  describe('Read-Only Nature', () => {
    it('set() on computed key throws Error', () => {
      store.set('a', 10)
      store.compute('doubled', ['a'], a => (a as number) * 2)

      expect(() => store.set('doubled', 100)).toThrow(Error)
    })

    it('delete() on computed key throws Error', () => {
      store.set('a', 10)
      store.compute('doubled', ['a'], a => (a as number) * 2)

      expect(() => store.delete('doubled')).toThrow(Error)
    })

    it('toggle() on computed key throws Error', () => {
      store.set('a', true)
      store.compute('negated', ['a'], a => !(a as boolean))

      expect(() => store.toggle('negated')).toThrow(Error)
    })

    it('increment() on computed key throws Error', () => {
      store.set('a', 10)
      store.compute('doubled', ['a'], a => (a as number) * 2)

      expect(() => store.increment('doubled')).toThrow(Error)
    })
  })

  describe('Computed and has/keys/all', () => {
    it('has(computedKey) returns true', () => {
      store.set('a', 10)
      store.compute('doubled', ['a'], a => (a as number) * 2)

      expect(store.has('doubled')).toBe(true)
    })

    it('keys() includes computed keys', () => {
      store.set('a', 10)
      store.compute('doubled', ['a'], a => (a as number) * 2)

      expect(store.keys()).toContain('doubled')
    })

    it('all() includes computed values', () => {
      store.set('a', 10)
      store.compute('doubled', ['a'], a => (a as number) * 2)

      const all = store.all()
      expect(all.doubled).toBe(20)
    })
  })

  describe('Computed and Subscriptions', () => {
    it('subscribe fires when computed value changes', () => {
      const callback = vi.fn()
      store.set('a', 10)
      store.compute('doubled', ['a'], a => (a as number) * 2)
      store.subscribe(callback)

      store.set('a', 20)

      expect(callback).toHaveBeenCalledWith('doubled', 40, 20)
    })

    it('subscribeKey on computed key fires when value changes', () => {
      const callback = vi.fn()
      store.set('a', 10)
      store.compute('doubled', ['a'], a => (a as number) * 2)
      store.subscribeKey('doubled', callback)

      store.set('a', 20)

      expect(callback).toHaveBeenCalledWith(40, 20)
    })

    it('subscription receives computed value, not dependency values', () => {
      const callback = vi.fn()
      store.set('a', 10)
      store.set('b', 20)
      store.compute('sum', ['a', 'b'], (a, b) => (a as number) + (b as number))
      store.subscribeKey('sum', callback)

      store.set('a', 15)

      expect(callback).toHaveBeenCalledWith(35, 30)
    })
  })

  describe('Error Handling', () => {
    it('compute() with non-existent dependency works (dependency is undefined)', () => {
      store.compute('result', ['missing'], val => val ?? 0)

      expect(store.get('result')).toBe(0)
    })

    it('compute function throwing is handled gracefully', () => {
      store.set('a', 10)
      store.compute('error', ['a'], () => {
        throw new Error('Compute error')
      })

      expect(() => store.get('error')).not.toThrow()
    })

    it('circular dependency (a depends on b, b depends on a) throws Error', () => {
      expect(() => {
        store.compute('a', ['b'], b => b)
        store.compute('b', ['a'], a => a)
      }).toThrow(Error)
    })

    it('self-referential compute throws Error', () => {
      expect(() => {
        store.compute('self', ['self'], val => val)
      }).toThrow(Error)
    })
  })

  describe('Computed Flags are Permanent', () => {
    it('there is no removeComputed() method', () => {
      expect(store).not.toHaveProperty('removeComputed')
    })

    it('computed flags persist for lifetime of store', () => {
      store.set('a', 10)
      store.compute('doubled', ['a'], a => (a as number) * 2)

      store.set('a', 20)
      store.set('a', 30)

      expect(store.get('doubled')).toBe(60)
    })

    it('clear() does not remove computed flag definitions (only regular flags)', () => {
      store.set('a', 10)
      store.compute('doubled', ['a'], a => (a as number) * 2)

      store.clear()

      expect(store.has('a')).toBe(false)
      expect(store.has('doubled')).toBe(true)
      expect(store.get('doubled')).toBe(0) // or undefined, depending on implementation
    })
  })

  describe('Synchronous (Decision 10.2)', () => {
    it('computed function must be synchronous', () => {
      store.set('a', 10)
      store.compute('result', ['a'], a => (a as number) * 2)

      expect(store.get('result')).toBe(20)
    })

    it('async function is not allowed (or its return value is the promise, not resolved value)', () => {
      store.set('a', 10)
      store.compute('result', ['a'], async a => (a as number) * 2)

      const result = store.get('result')
      expect(result).toBeInstanceOf(Promise)
    })
  })
})
