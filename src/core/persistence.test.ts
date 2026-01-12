import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFlagStore } from './store'
import { MockStorage, FailingStorage } from '../test-utils'
import type { FlagStore } from '../types'

describe('Storage Interface', () => {
  it('storage object must have getItem(key) method', () => {
    const storage = new MockStorage()
    expect(typeof storage.getItem).toBe('function')
  })

  it('storage object must have setItem(key, value) method', () => {
    const storage = new MockStorage()
    expect(typeof storage.setItem).toBe('function')
  })

  it('storage object must have removeItem(key) method', () => {
    const storage = new MockStorage()
    expect(typeof storage.removeItem).toBe('function')
  })

  it.skipIf(typeof localStorage === 'undefined')('localStorage satisfies storage interface', () => {
    expect(typeof localStorage.getItem).toBe('function')
    expect(typeof localStorage.setItem).toBe('function')
    expect(typeof localStorage.removeItem).toBe('function')
  })

  it.skipIf(typeof sessionStorage === 'undefined')(
    'sessionStorage satisfies storage interface',
    () => {
      expect(typeof sessionStorage.getItem).toBe('function')
      expect(typeof sessionStorage.setItem).toBe('function')
      expect(typeof sessionStorage.removeItem).toBe('function')
    }
  )
})

describe('Auto-Save (Decision 8.1: configurable, default auto)', () => {
  let storage: MockStorage

  beforeEach(() => {
    storage = new MockStorage()
  })

  it('with { persist: { storage } }, auto-save is enabled by default', () => {
    const store = createFlagStore({ persist: { storage } })
    store.set('key', 'value')

    const saved = storage.getItem('@motioneffector/flags')
    expect(saved).toBeTruthy()
  })

  it('state saved after set()', () => {
    const store = createFlagStore({ persist: { storage } })
    store.set('key', 'value')

    const saved = storage.getItem('@motioneffector/flags')
    expect(saved).toContain('key')
    expect(saved).toContain('value')
  })

  it('state saved after delete()', () => {
    const store = createFlagStore({ persist: { storage }, initial: { key: 'value' } })
    store.delete('key')

    const saved = storage.getItem('@motioneffector/flags')
    expect(saved).not.toContain('key')
  })

  it('state saved after toggle()', () => {
    const store = createFlagStore({ persist: { storage } })
    store.set('flag', true)
    store.toggle('flag')

    const saved = storage.getItem('@motioneffector/flags')
    const parsed = JSON.parse(saved!)
    expect(parsed.flag).toBe(false)
  })

  it('state saved after increment()', () => {
    const store = createFlagStore({ persist: { storage } })
    store.set('count', 10)
    store.increment('count', 5)

    const saved = storage.getItem('@motioneffector/flags')
    const parsed = JSON.parse(saved!)
    expect(parsed.count).toBe(15)
  })

  it('state saved after decrement()', () => {
    const store = createFlagStore({ persist: { storage } })
    store.set('count', 10)
    store.decrement('count', 3)

    const saved = storage.getItem('@motioneffector/flags')
    const parsed = JSON.parse(saved!)
    expect(parsed.count).toBe(7)
  })

  it('state saved after clear()', () => {
    const store = createFlagStore({ persist: { storage }, initial: { a: 1, b: 2 } })
    store.clear()

    const saved = storage.getItem('@motioneffector/flags')
    const parsed = JSON.parse(saved!)
    expect(Object.keys(parsed)).toHaveLength(0)
  })

  it('state saved after setMany()', () => {
    const store = createFlagStore({ persist: { storage } })
    store.setMany({ a: 1, b: 2, c: 3 })

    const saved = storage.getItem('@motioneffector/flags')
    const parsed = JSON.parse(saved!)
    expect(parsed.a).toBe(1)
    expect(parsed.b).toBe(2)
    expect(parsed.c).toBe(3)
  })

  it('with { persist: { storage, autoSave: false } }, auto-save is disabled', () => {
    const store = createFlagStore({ persist: { storage, autoSave: false } })
    store.set('key', 'value')

    const saved = storage.getItem('@motioneffector/flags')
    expect(saved).toBeNull()
  })

  it('with autoSave disabled, changes are not persisted automatically', () => {
    const store = createFlagStore({ persist: { storage, autoSave: false } })
    store.set('a', 1)
    store.set('b', 2)

    const saved = storage.getItem('@motioneffector/flags')
    expect(saved).toBeNull()
  })
})

describe('Manual Save/Load', () => {
  let storage: MockStorage

  beforeEach(() => {
    storage = new MockStorage()
  })

  it('store.save() persists current state', () => {
    const store = createFlagStore({ persist: { storage, autoSave: false } })
    store.set('key', 'value')

    store.save()

    const saved = storage.getItem('@motioneffector/flags')
    expect(saved).toBeTruthy()
  })

  it('store.load() restores state from storage', () => {
    const store1 = createFlagStore({ persist: { storage } })
    store1.set('key', 'value')

    const store2 = createFlagStore({ persist: { storage, autoSave: false } })
    store2.load()

    expect(store2.get('key')).toBe('value')
  })

  it('load() overwrites current state', () => {
    const store1 = createFlagStore({ persist: { storage } })
    store1.set('key', 'value1')

    const store2 = createFlagStore({ persist: { storage, autoSave: false } })
    store2.set('key', 'value2')
    store2.load()

    expect(store2.get('key')).toBe('value1')
  })

  it('load() fires change events for changed keys', () => {
    const store1 = createFlagStore({ persist: { storage } })
    store1.set('key', 'value1')

    const store2 = createFlagStore({ persist: { storage, autoSave: false } })
    const callback = vi.fn()
    store2.subscribe(callback)
    store2.load()

    expect(callback).toHaveBeenCalled()
  })
})

describe('Storage Key (Decision 8.3: configurable with default)', () => {
  let storage: MockStorage

  beforeEach(() => {
    storage = new MockStorage()
  })

  it("default storage key is '@motioneffector/flags'", () => {
    const store = createFlagStore({ persist: { storage } })
    store.set('key', 'value')

    expect(storage.getItem('@motioneffector/flags')).toBeTruthy()
  })

  it("custom key via { persist: { storage, key: 'custom' } }", () => {
    const store = createFlagStore({ persist: { storage, key: 'custom' } })
    store.set('key', 'value')

    expect(storage.getItem('custom')).toBeTruthy()
    expect(storage.getItem('@motioneffector/flags')).toBeNull()
  })

  it("different stores with different keys don't conflict", () => {
    const store1 = createFlagStore({ persist: { storage, key: 'store1' } })
    const store2 = createFlagStore({ persist: { storage, key: 'store2' } })

    store1.set('key', 'value1')
    store2.set('key', 'value2')

    expect(store1.get('key')).toBe('value1')
    expect(store2.get('key')).toBe('value2')
  })
})

describe('Restore on Creation', () => {
  let storage: MockStorage

  beforeEach(() => {
    storage = new MockStorage()
  })

  it('if storage has data, state is restored on store creation', () => {
    const store1 = createFlagStore({ persist: { storage } })
    store1.set('key', 'value')

    const store2 = createFlagStore({ persist: { storage } })
    expect(store2.get('key')).toBe('value')
  })

  it('initial option values are overwritten by persisted state', () => {
    const store1 = createFlagStore({ persist: { storage } })
    store1.set('key', 'persisted')

    const store2 = createFlagStore({
      persist: { storage },
      initial: { key: 'initial' },
    })

    expect(store2.get('key')).toBe('persisted')
  })

  it('if storage is empty, initial values are used', () => {
    const store = createFlagStore({
      persist: { storage },
      initial: { key: 'initial' },
    })

    expect(store.get('key')).toBe('initial')
  })
})

describe('Serialization', () => {
  let storage: MockStorage

  beforeEach(() => {
    storage = new MockStorage()
  })

  it('boolean true survives round-trip', () => {
    const store1 = createFlagStore({ persist: { storage } })
    store1.set('flag', true)

    const store2 = createFlagStore({ persist: { storage } })
    expect(store2.get('flag')).toBe(true)
    expect(typeof store2.get('flag')).toBe('boolean')
  })

  it('boolean false survives round-trip', () => {
    const store1 = createFlagStore({ persist: { storage } })
    store1.set('flag', false)

    const store2 = createFlagStore({ persist: { storage } })
    expect(store2.get('flag')).toBe(false)
    expect(typeof store2.get('flag')).toBe('boolean')
  })

  it('positive integer survives round-trip', () => {
    const store1 = createFlagStore({ persist: { storage } })
    store1.set('count', 42)

    const store2 = createFlagStore({ persist: { storage } })
    expect(store2.get('count')).toBe(42)
    expect(typeof store2.get('count')).toBe('number')
  })

  it('negative integer survives round-trip', () => {
    const store1 = createFlagStore({ persist: { storage } })
    store1.set('count', -10)

    const store2 = createFlagStore({ persist: { storage } })
    expect(store2.get('count')).toBe(-10)
  })

  it('zero survives round-trip', () => {
    const store1 = createFlagStore({ persist: { storage } })
    store1.set('count', 0)

    const store2 = createFlagStore({ persist: { storage } })
    expect(store2.get('count')).toBe(0)
  })

  it('float survives round-trip', () => {
    const store1 = createFlagStore({ persist: { storage } })
    store1.set('pi', 3.14159)

    const store2 = createFlagStore({ persist: { storage } })
    expect(store2.get('pi')).toBe(3.14159)
  })

  it('non-empty string survives round-trip', () => {
    const store1 = createFlagStore({ persist: { storage } })
    store1.set('name', 'alice')

    const store2 = createFlagStore({ persist: { storage } })
    expect(store2.get('name')).toBe('alice')
    expect(typeof store2.get('name')).toBe('string')
  })

  it('empty string survives round-trip', () => {
    const store1 = createFlagStore({ persist: { storage } })
    store1.set('empty', '')

    const store2 = createFlagStore({ persist: { storage } })
    expect(store2.get('empty')).toBe('')
  })

  it('types are preserved (not coerced to strings)', () => {
    const store1 = createFlagStore({ persist: { storage } })
    store1.set('bool', true)
    store1.set('num', 42)
    store1.set('str', 'hello')

    const store2 = createFlagStore({ persist: { storage } })
    expect(typeof store2.get('bool')).toBe('boolean')
    expect(typeof store2.get('num')).toBe('number')
    expect(typeof store2.get('str')).toBe('string')
  })
})

describe('Error Handling', () => {
  it('handles storage.getItem() throwing gracefully', () => {
    const storage = new FailingStorage()

    expect(() => createFlagStore({ persist: { storage } })).not.toThrow()
  })

  it('handles storage.setItem() throwing gracefully (e.g., quota exceeded)', () => {
    const storage = new FailingStorage()
    const store = createFlagStore({ persist: { storage } })

    expect(() => store.set('key', 'value')).not.toThrow()
  })

  it('handles corrupted JSON in storage gracefully', () => {
    const storage = new MockStorage()
    storage.setItem('@motioneffector/flags', 'invalid json{]')

    expect(() => createFlagStore({ persist: { storage } })).not.toThrow()
  })

  it('handles storage returning null gracefully', () => {
    const storage = new MockStorage()

    expect(() => createFlagStore({ persist: { storage } })).not.toThrow()
  })

  it('store remains functional after storage error', () => {
    const storage = new FailingStorage()
    const store = createFlagStore({ persist: { storage } })

    store.set('key', 'value')
    expect(store.get('key')).toBe('value')
  })
})

describe('Multiple Stores (Decision 8.4: yes)', () => {
  let storage: MockStorage

  beforeEach(() => {
    storage = new MockStorage()
  })

  it('multiple stores can exist with different storage keys', () => {
    const store1 = createFlagStore({ persist: { storage, key: 'store1' } })
    const store2 = createFlagStore({ persist: { storage, key: 'store2' } })

    store1.set('key', 'value1')
    store2.set('key', 'value2')

    expect(store1.get('key')).toBe('value1')
    expect(store2.get('key')).toBe('value2')
  })

  it("stores don't interfere with each other", () => {
    const store1 = createFlagStore({ persist: { storage, key: 'store1' } })
    const store2 = createFlagStore({ persist: { storage, key: 'store2' } })

    store1.set('shared', 'from-store1')
    store2.set('shared', 'from-store2')

    // Recreate to verify persistence isolation
    const store1Copy = createFlagStore({ persist: { storage, key: 'store1' } })
    const store2Copy = createFlagStore({ persist: { storage, key: 'store2' } })

    expect(store1Copy.get('shared')).toBe('from-store1')
    expect(store2Copy.get('shared')).toBe('from-store2')
  })
})
