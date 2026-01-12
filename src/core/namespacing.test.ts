import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFlagStore } from './store'
import type { FlagStore } from '../types'

describe('store.namespace(prefix)', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  describe('Basic Namespacing', () => {
    it('namespace() returns a scoped store view', () => {
      const scoped = store.namespace('prefix')
      expect(scoped).toBeDefined()
      expect(typeof scoped.get).toBe('function')
      expect(typeof scoped.set).toBe('function')
    })

    it("scoped.set('key', value) actually sets 'prefix.key' in root store", () => {
      const scoped = store.namespace('prefix')
      scoped.set('key', 'value')

      expect(store.get('prefix.key')).toBe('value')
    })

    it("scoped.get('key') retrieves 'prefix.key' from root store", () => {
      store.set('prefix.key', 'value')
      const scoped = store.namespace('prefix')

      expect(scoped.get('key')).toBe('value')
    })

    it("scoped.has('key') checks 'prefix.key' in root store", () => {
      store.set('prefix.key', 'value')
      const scoped = store.namespace('prefix')

      expect(scoped.has('key')).toBe(true)
      expect(scoped.has('other')).toBe(false)
    })

    it("scoped.delete('key') removes 'prefix.key' from root store", () => {
      store.set('prefix.key', 'value')
      const scoped = store.namespace('prefix')

      scoped.delete('key')

      expect(store.has('prefix.key')).toBe(false)
    })
  })

  describe('Separator (Decision 9.1: dot)', () => {
    it("namespace uses dot separator: 'prefix.key'", () => {
      const scoped = store.namespace('prefix')
      scoped.set('key', 'value')

      expect(store.get('prefix.key')).toBe('value')
    })

    it("namespace('player').set('health', 100) creates 'player.health'", () => {
      const player = store.namespace('player')
      player.set('health', 100)

      expect(store.get('player.health')).toBe(100)
    })

    it("namespace('game').namespace('player') creates 'game.player.key'", () => {
      const game = store.namespace('game')
      const player = game.namespace('player')
      player.set('health', 100)

      expect(store.get('game.player.health')).toBe(100)
    })
  })

  describe('Scoped Operations', () => {
    it("scoped.toggle('flag') toggles 'prefix.flag'", () => {
      const scoped = store.namespace('prefix')
      scoped.set('flag', true)

      scoped.toggle('flag')

      expect(store.get('prefix.flag')).toBe(false)
    })

    it("scoped.increment('count') increments 'prefix.count'", () => {
      const scoped = store.namespace('prefix')
      scoped.set('count', 10)

      scoped.increment('count', 5)

      expect(store.get('prefix.count')).toBe(15)
    })

    it("scoped.decrement('count') decrements 'prefix.count'", () => {
      const scoped = store.namespace('prefix')
      scoped.set('count', 10)

      scoped.decrement('count', 3)

      expect(store.get('prefix.count')).toBe(7)
    })

    it('scoped.all() returns only keys under prefix (without prefix in keys)', () => {
      store.set('prefix.a', 1)
      store.set('prefix.b', 2)
      store.set('other.c', 3)

      const scoped = store.namespace('prefix')
      const all = scoped.all()

      expect(all).toEqual({ a: 1, b: 2 })
      expect(all).not.toHaveProperty('c')
    })

    it('scoped.keys() returns only keys under prefix (without prefix in keys)', () => {
      store.set('prefix.a', 1)
      store.set('prefix.b', 2)
      store.set('other.c', 3)

      const scoped = store.namespace('prefix')
      const keys = scoped.keys()

      expect(keys).toContain('a')
      expect(keys).toContain('b')
      expect(keys).not.toContain('c')
      expect(keys).not.toContain('prefix.a')
    })

    it('scoped.clear() removes only keys under prefix', () => {
      store.set('prefix.a', 1)
      store.set('prefix.b', 2)
      store.set('other.c', 3)

      const scoped = store.namespace('prefix')
      scoped.clear()

      expect(store.has('prefix.a')).toBe(false)
      expect(store.has('prefix.b')).toBe(false)
      expect(store.has('other.c')).toBe(true)
    })
  })

  describe('Scoped Conditions (Decision 9.3: auto-prefix all flags)', () => {
    it("scoped.check('flag') checks 'prefix.flag'", () => {
      store.set('prefix.flag', true)
      const scoped = store.namespace('prefix')

      expect(scoped.check('flag')).toBe(true)
    })

    it("scoped.check('a AND b') checks 'prefix.a AND prefix.b'", () => {
      store.set('prefix.a', true)
      store.set('prefix.b', true)
      const scoped = store.namespace('prefix')

      expect(scoped.check('a AND b')).toBe(true)
    })

    it("scoped.check('count > 5') checks 'prefix.count > 5'", () => {
      store.set('prefix.count', 10)
      const scoped = store.namespace('prefix')

      expect(scoped.check('count > 5')).toBe(true)
    })

    it('scoped.check(\'flag == "value"\') checks \'prefix.flag == "value"\'', () => {
      store.set('prefix.flag', 'value')
      const scoped = store.namespace('prefix')

      expect(scoped.check('flag == "value"')).toBe(true)
    })

    it("scoped.check('(a OR b) AND c') prefixes all: 'prefix.a', 'prefix.b', 'prefix.c'", () => {
      store.set('prefix.a', false)
      store.set('prefix.b', true)
      store.set('prefix.c', true)
      const scoped = store.namespace('prefix')

      expect(scoped.check('(a OR b) AND c')).toBe(true)
    })
  })

  describe('Nested Namespaces', () => {
    it("namespace('a').namespace('b') creates prefix 'a.b'", () => {
      const a = store.namespace('a')
      const b = a.namespace('b')

      b.set('key', 'value')

      expect(store.get('a.b.key')).toBe('value')
    })

    it('deeply nested namespaces work correctly', () => {
      const ns = store.namespace('level1').namespace('level2').namespace('level3')

      ns.set('key', 'value')

      expect(store.get('level1.level2.level3.key')).toBe('value')
    })
  })

  describe('Namespace and Root Store Interaction', () => {
    it('changes via namespace are visible in root store', () => {
      const scoped = store.namespace('prefix')
      scoped.set('key', 'value')

      expect(store.get('prefix.key')).toBe('value')
    })

    it('changes via root store are visible in namespace', () => {
      const scoped = store.namespace('prefix')
      store.set('prefix.key', 'value')

      expect(scoped.get('key')).toBe('value')
    })

    it('subscriptions on root fire for namespace changes', () => {
      const callback = vi.fn()
      store.subscribe(callback)

      const scoped = store.namespace('prefix')
      scoped.set('key', 'value')

      expect(callback).toHaveBeenCalledWith('prefix.key', 'value', undefined)
    })

    it("subscriptions on namespace only fire for that namespace's changes", () => {
      const scoped = store.namespace('prefix')
      const callback = vi.fn()
      scoped.subscribe(callback)

      store.set('prefix.a', 1)
      store.set('other.b', 2)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith('a', 1, undefined)
    })
  })

  describe('Keys with Dots (Decision 9.2)', () => {
    it("root store can have keys with dots: set('a.b', true)", () => {
      store.set('a.b', true)
      expect(store.get('a.b')).toBe(true)
    })

    it("'a.b' key is distinct from namespace('a').set('b', true) - both create 'a.b'", () => {
      store.set('a.b', 'direct')
      const scoped = store.namespace('a')
      scoped.set('b', 'scoped')

      // Both operations set the same key 'a.b'
      expect(store.get('a.b')).toBe('scoped')
    })

    it("accessing via namespace('a').get('b') returns value set via set('a.b', true)", () => {
      store.set('a.b', 'value')
      const scoped = store.namespace('a')

      expect(scoped.get('b')).toBe('value')
    })
  })
})
