import { describe, it, expect, beforeEach } from 'vitest'
import { createFlagStore } from './store'
import { ValidationError } from '../errors'
import type { FlagStore } from '../types'

describe('createFlagStore(options?)', () => {
  describe('Basic Creation', () => {
    it('creates empty store when called with no arguments', () => {
      const store = createFlagStore()
      expect(store).toBeDefined()
      expect(typeof store.get).toBe('function')
      expect(typeof store.set).toBe('function')
      expect(typeof store.has).toBe('function')
      expect(typeof store.delete).toBe('function')
      expect(typeof store.clear).toBe('function')
    })

    it('creates empty store when called with empty options object', () => {
      const store = createFlagStore({})
      expect(store).toBeDefined()
      expect(typeof store.get).toBe('function')
      expect(typeof store.set).toBe('function')
      expect(typeof store.has).toBe('function')
      expect(typeof store.delete).toBe('function')
      expect(typeof store.clear).toBe('function')
    })

    it('store.all() returns empty object for new empty store', () => {
      const store = createFlagStore()
      expect(store.all()).toEqual({})
    })
  })

  describe('Initial Values', () => {
    it('creates store with initial boolean values', () => {
      const store = createFlagStore({ initial: { flag: true } })
      expect(store.get('flag')).toBe(true)
    })

    it('creates store with initial numeric values', () => {
      const store = createFlagStore({ initial: { count: 42 } })
      expect(store.get('count')).toBe(42)
    })

    it('creates store with initial string values', () => {
      const store = createFlagStore({ initial: { name: 'test' } })
      expect(store.get('name')).toBe('test')
    })

    it('creates store with mixed value types', () => {
      const store = createFlagStore({
        initial: {
          flag: true,
          count: 10,
          name: 'test',
        },
      })
      expect(store.get('flag')).toBe(true)
      expect(store.get('count')).toBe(10)
      expect(store.get('name')).toBe('test')
    })

    it('initial values are retrievable via get() immediately after creation', () => {
      const store = createFlagStore({ initial: { key: 'value' } })
      expect(store.get('key')).toBe('value')
    })

    it('initial values appear in all() immediately after creation', () => {
      const store = createFlagStore({ initial: { a: 1, b: 2 } })
      expect(store.all()).toEqual({ a: 1, b: 2 })
    })

    it("initial values with falsy values (false, 0, '') are set correctly", () => {
      const store = createFlagStore({
        initial: {
          boolFalse: false,
          numZero: 0,
          strEmpty: '',
        },
      })
      expect(store.get('boolFalse')).toBe(false)
      expect(store.get('numZero')).toBe(0)
      expect(store.get('strEmpty')).toBe('')
    })
  })

  describe('Options Validation', () => {
    it('accepts { initial: Record<string, boolean | number | string> }', () => {
      expect(() => createFlagStore({ initial: { a: true, b: 1, c: 'test' } })).not.toThrow()
    })

    it('accepts { persist: { storage: Storage } }', () => {
      const mockStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      } as Storage
      expect(() => createFlagStore({ persist: { storage: mockStorage } })).not.toThrow()
    })

    it('accepts { persist: { storage: Storage, key: string } }', () => {
      const mockStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      } as Storage
      expect(() =>
        createFlagStore({ persist: { storage: mockStorage, key: 'custom' } })
      ).not.toThrow()
    })

    it('accepts { persist: { storage: Storage, autoSave: boolean } }', () => {
      const mockStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      } as Storage
      expect(() =>
        createFlagStore({ persist: { storage: mockStorage, autoSave: false } })
      ).not.toThrow()
    })

    it('accepts { history: true }', () => {
      expect(() => createFlagStore({ history: true })).not.toThrow()
    })

    it('accepts { history: { maxHistory: number } }', () => {
      expect(() => createFlagStore({ history: { maxHistory: 50 } })).not.toThrow()
    })

    it('accepts combination of all options', () => {
      const mockStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      } as Storage
      expect(() =>
        createFlagStore({
          initial: { flag: true },
          persist: { storage: mockStorage, key: 'test' },
          history: { maxHistory: 100 },
        })
      ).not.toThrow()
    })

    it('throws ValidationError if initial contains null value', () => {
      expect(() => createFlagStore({ initial: { key: null as any } })).toThrow(ValidationError)
    })

    it('throws ValidationError if initial contains undefined value', () => {
      expect(() => createFlagStore({ initial: { key: undefined as any } })).toThrow(ValidationError)
    })

    it('throws ValidationError if initial contains object value', () => {
      expect(() => createFlagStore({ initial: { key: {} as any } })).toThrow(ValidationError)
    })

    it('throws ValidationError if initial contains array value', () => {
      expect(() => createFlagStore({ initial: { key: [] as any } })).toThrow(ValidationError)
    })

    it('throws ValidationError if initial key is empty string', () => {
      expect(() => createFlagStore({ initial: { '': 'value' } })).toThrow(ValidationError)
    })

    it('throws ValidationError if initial key contains spaces', () => {
      expect(() => createFlagStore({ initial: { 'my flag': 'value' } })).toThrow(ValidationError)
    })

    it('throws ValidationError if initial key contains comparison operator', () => {
      expect(() => createFlagStore({ initial: { 'key>5': 'value' } })).toThrow(ValidationError)
    })

    it('throws ValidationError if initial key starts with !', () => {
      expect(() => createFlagStore({ initial: { '!key': 'value' } })).toThrow(ValidationError)
    })

    it('throws ValidationError if initial key is reserved word (AND, OR, NOT)', () => {
      expect(() => createFlagStore({ initial: { AND: true } })).toThrow(ValidationError)
      expect(() => createFlagStore({ initial: { OR: true } })).toThrow(ValidationError)
      expect(() => createFlagStore({ initial: { NOT: true } })).toThrow(ValidationError)
    })
  })
})

describe('store.set(key, value)', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  describe('Setting Values', () => {
    it('sets a boolean true value', () => {
      store.set('flag', true)
      expect(store.get('flag')).toBe(true)
    })

    it('sets a boolean false value', () => {
      store.set('flag', false)
      expect(store.get('flag')).toBe(false)
    })

    it('sets a positive integer', () => {
      store.set('count', 42)
      expect(store.get('count')).toBe(42)
    })

    it('sets zero', () => {
      store.set('count', 0)
      expect(store.get('count')).toBe(0)
    })

    it('sets a negative integer', () => {
      store.set('count', -5)
      expect(store.get('count')).toBe(-5)
    })

    it('sets a float value', () => {
      store.set('pi', 3.14)
      expect(store.get('pi')).toBe(3.14)
    })

    it('sets a non-empty string', () => {
      store.set('name', 'alice')
      expect(store.get('name')).toBe('alice')
    })

    it('sets an empty string', () => {
      store.set('empty', '')
      expect(store.get('empty')).toBe('')
    })

    it('overwrites existing boolean with boolean', () => {
      store.set('flag', true)
      store.set('flag', false)
      expect(store.get('flag')).toBe(false)
    })

    it('overwrites existing boolean with number', () => {
      store.set('key', true)
      store.set('key', 42)
      expect(store.get('key')).toBe(42)
    })

    it('overwrites existing boolean with string', () => {
      store.set('key', true)
      store.set('key', 'test')
      expect(store.get('key')).toBe('test')
    })

    it('overwrites existing number with different number', () => {
      store.set('count', 10)
      store.set('count', 20)
      expect(store.get('count')).toBe(20)
    })

    it('overwrites existing string with different string', () => {
      store.set('name', 'alice')
      store.set('name', 'bob')
      expect(store.get('name')).toBe('bob')
    })
  })

  describe('Null/Undefined as Delete (Decision 2.1)', () => {
    it('set(key, null) removes the key', () => {
      store.set('key', 'value')
      store.set('key', null as any)
      expect(store.has('key')).toBe(false)
    })

    it('set(key, undefined) removes the key', () => {
      store.set('key', 'value')
      store.set('key', undefined as any)
      expect(store.has('key')).toBe(false)
    })

    it('set(key, null) on non-existent key is a no-op (no error)', () => {
      expect(() => store.set('nonexistent', null as any)).not.toThrow()
    })

    it('get(key) returns undefined after set(key, null)', () => {
      store.set('key', 'value')
      store.set('key', null as any)
      expect(store.get('key')).toBeUndefined()
    })

    it('has(key) returns false after set(key, null)', () => {
      store.set('key', 'value')
      store.set('key', null as any)
      expect(store.has('key')).toBe(false)
    })
  })

  describe('Key Validation (Decision 2.2)', () => {
    it('allows alphanumeric keys', () => {
      expect(() => store.set('flag123', true)).not.toThrow()
    })

    it("allows keys with underscores: 'my_flag'", () => {
      expect(() => store.set('my_flag', true)).not.toThrow()
    })

    it("allows keys with hyphens: 'my-flag'", () => {
      expect(() => store.set('my-flag', true)).not.toThrow()
    })

    it("allows keys with dots: 'player.health' (not treated as namespace)", () => {
      expect(() => store.set('player.health', 100)).not.toThrow()
    })

    it('trims leading/trailing whitespace from key', () => {
      store.set('  key  ', 'value')
      expect(store.get('key')).toBe('value')
    })

    it('throws ValidationError for empty string key', () => {
      expect(() => store.set('', 'value')).toThrow(ValidationError)
    })

    it('throws ValidationError for whitespace-only key', () => {
      expect(() => store.set('   ', 'value')).toThrow(ValidationError)
    })

    it("throws ValidationError for key containing spaces: 'my flag'", () => {
      expect(() => store.set('my flag', true)).toThrow(ValidationError)
    })

    it("throws ValidationError for key containing '>'", () => {
      expect(() => store.set('key>5', true)).toThrow(ValidationError)
    })

    it("throws ValidationError for key containing '<'", () => {
      expect(() => store.set('key<5', true)).toThrow(ValidationError)
    })

    it("throws ValidationError for key containing '>='", () => {
      expect(() => store.set('key>=5', true)).toThrow(ValidationError)
    })

    it("throws ValidationError for key containing '<='", () => {
      expect(() => store.set('key<=5', true)).toThrow(ValidationError)
    })

    it("throws ValidationError for key containing '=='", () => {
      expect(() => store.set('key==5', true)).toThrow(ValidationError)
    })

    it("throws ValidationError for key containing '!='", () => {
      expect(() => store.set('key!=5', true)).toThrow(ValidationError)
    })

    it("throws ValidationError for key starting with '!'", () => {
      expect(() => store.set('!key', true)).toThrow(ValidationError)
    })

    it("throws ValidationError for key 'AND' (case-insensitive)", () => {
      expect(() => store.set('AND', true)).toThrow(ValidationError)
    })

    it("throws ValidationError for key 'and'", () => {
      expect(() => store.set('and', true)).toThrow(ValidationError)
    })

    it("throws ValidationError for key 'OR' (case-insensitive)", () => {
      expect(() => store.set('OR', true)).toThrow(ValidationError)
    })

    it("throws ValidationError for key 'or'", () => {
      expect(() => store.set('or', true)).toThrow(ValidationError)
    })

    it("throws ValidationError for key 'NOT' (case-insensitive)", () => {
      expect(() => store.set('NOT', true)).toThrow(ValidationError)
    })

    it("throws ValidationError for key 'not'", () => {
      expect(() => store.set('not', true)).toThrow(ValidationError)
    })
  })

  describe('Return Value', () => {
    it('returns the store instance (for chaining)', () => {
      const result = store.set('key', 'value')
      expect(result).toBe(store)
    })
  })
})

describe('store.get(key)', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('returns boolean true for stored true', () => {
    store.set('flag', true)
    expect(store.get('flag')).toBe(true)
  })

  it('returns boolean false for stored false', () => {
    store.set('flag', false)
    expect(store.get('flag')).toBe(false)
  })

  it('returns number for stored number', () => {
    store.set('count', 42)
    expect(store.get('count')).toBe(42)
  })

  it('returns string for stored string', () => {
    store.set('name', 'alice')
    expect(store.get('name')).toBe('alice')
  })

  it('returns empty string for stored empty string', () => {
    store.set('empty', '')
    expect(store.get('empty')).toBe('')
  })

  it('returns 0 for stored 0', () => {
    store.set('zero', 0)
    expect(store.get('zero')).toBe(0)
  })

  it('returns undefined for non-existent key', () => {
    expect(store.get('nonexistent')).toBeUndefined()
  })

  it('does not throw for non-existent key', () => {
    expect(() => store.get('nonexistent')).not.toThrow()
  })
})

describe('store.has(key)', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('returns true if key exists with truthy value', () => {
    store.set('flag', true)
    expect(store.has('flag')).toBe(true)
  })

  it('returns true if key exists with value false', () => {
    store.set('flag', false)
    expect(store.has('flag')).toBe(true)
  })

  it('returns true if key exists with value 0', () => {
    store.set('count', 0)
    expect(store.has('count')).toBe(true)
  })

  it('returns true if key exists with empty string', () => {
    store.set('empty', '')
    expect(store.has('empty')).toBe(true)
  })

  it('returns false if key was never set', () => {
    expect(store.has('nonexistent')).toBe(false)
  })

  it('returns false if key was deleted', () => {
    store.set('key', 'value')
    store.delete('key')
    expect(store.has('key')).toBe(false)
  })

  it('returns false if key was set to null', () => {
    store.set('key', 'value')
    store.set('key', null as any)
    expect(store.has('key')).toBe(false)
  })
})

describe('store.delete(key)', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('removes an existing key', () => {
    store.set('key', 'value')
    store.delete('key')
    expect(store.has('key')).toBe(false)
  })

  it('get() returns undefined after delete', () => {
    store.set('key', 'value')
    store.delete('key')
    expect(store.get('key')).toBeUndefined()
  })

  it('has() returns false after delete', () => {
    store.set('key', 'value')
    store.delete('key')
    expect(store.has('key')).toBe(false)
  })

  it("no-op if key doesn't exist (no error thrown)", () => {
    expect(() => store.delete('nonexistent')).not.toThrow()
  })

  it('returns the store instance (for chaining)', () => {
    const result = store.delete('key')
    expect(result).toBe(store)
  })
})

describe('store.clear()', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore({ initial: { a: 1, b: 2, c: 3 } })
  })

  it('removes all flags from store', () => {
    store.clear()
    expect(store.has('a')).toBe(false)
    expect(store.has('b')).toBe(false)
    expect(store.has('c')).toBe(false)
  })

  it('all() returns empty object after clear', () => {
    store.clear()
    expect(store.all()).toEqual({})
  })

  it('has() returns false for all previously existing keys', () => {
    store.clear()
    expect(store.has('a')).toBe(false)
    expect(store.has('b')).toBe(false)
    expect(store.has('c')).toBe(false)
  })

  it('no-op on already empty store (no error)', () => {
    const emptyStore = createFlagStore()
    expect(() => emptyStore.clear()).not.toThrow()
  })

  it('returns the store instance (for chaining)', () => {
    const result = store.clear()
    expect(result).toBe(store)
  })
})

describe('store.toggle(key)', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  describe('Existing Boolean Keys', () => {
    it('toggles true to false', () => {
      store.set('flag', true)
      store.toggle('flag')
      expect(store.get('flag')).toBe(false)
    })

    it('toggles false to true', () => {
      store.set('flag', false)
      store.toggle('flag')
      expect(store.get('flag')).toBe(true)
    })

    it('multiple toggles alternate value correctly', () => {
      store.set('flag', true)
      store.toggle('flag')
      expect(store.get('flag')).toBe(false)
      store.toggle('flag')
      expect(store.get('flag')).toBe(true)
      store.toggle('flag')
      expect(store.get('flag')).toBe(false)
    })
  })

  describe('Non-Existent Key (Decision 4.1)', () => {
    it('toggle on non-existent key sets it to true', () => {
      store.toggle('newFlag')
      expect(store.get('newFlag')).toBe(true)
    })

    it('subsequent toggle changes it to false', () => {
      store.toggle('newFlag')
      store.toggle('newFlag')
      expect(store.get('newFlag')).toBe(false)
    })
  })

  describe('Type Errors', () => {
    it('throws TypeError when key exists with numeric value', () => {
      store.set('count', 42)
      expect(() => store.toggle('count')).toThrow(TypeError)
    })

    it('throws TypeError when key exists with string value', () => {
      store.set('name', 'alice')
      expect(() => store.toggle('name')).toThrow(TypeError)
    })
  })

  describe('Return Value', () => {
    it('returns the new boolean value after toggle', () => {
      store.set('flag', true)
      expect(store.toggle('flag')).toBe(false)
      expect(store.toggle('flag')).toBe(true)
    })
  })
})

describe('store.increment(key, amount?)', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  describe('Basic Incrementing', () => {
    it('increments by 1 when no amount specified', () => {
      store.set('count', 10)
      store.increment('count')
      expect(store.get('count')).toBe(11)
    })

    it('increments by positive integer amount', () => {
      store.set('count', 10)
      store.increment('count', 5)
      expect(store.get('count')).toBe(15)
    })

    it('increments by negative amount (effectively decrement)', () => {
      store.set('count', 10)
      store.increment('count', -3)
      expect(store.get('count')).toBe(7)
    })

    it('increments by float amount (Decision 3.2)', () => {
      store.set('count', 10)
      store.increment('count', 0.5)
      expect(store.get('count')).toBe(10.5)
    })

    it('increments by 0 (no change)', () => {
      store.set('count', 10)
      store.increment('count', 0)
      expect(store.get('count')).toBe(10)
    })
  })

  describe('Non-Existent Key (Decision 3.1)', () => {
    it('auto-initializes non-existent key to 0, then increments', () => {
      store.increment('newCount', 5)
      expect(store.get('newCount')).toBe(5)
    })

    it("increment('newKey') results in value 1", () => {
      store.increment('newKey')
      expect(store.get('newKey')).toBe(1)
    })

    it("increment('newKey', 5) results in value 5", () => {
      store.increment('newKey', 5)
      expect(store.get('newKey')).toBe(5)
    })

    it("increment('newKey', -3) results in value -3", () => {
      store.increment('newKey', -3)
      expect(store.get('newKey')).toBe(-3)
    })
  })

  describe('Type Errors', () => {
    it('throws TypeError when key exists with boolean value', () => {
      store.set('flag', true)
      expect(() => store.increment('flag')).toThrow(TypeError)
    })

    it('throws TypeError when key exists with string value', () => {
      store.set('name', 'alice')
      expect(() => store.increment('name')).toThrow(TypeError)
    })
  })

  describe('Return Value', () => {
    it('returns the new numeric value after increment', () => {
      store.set('count', 10)
      expect(store.increment('count', 5)).toBe(15)
    })
  })
})

describe('store.decrement(key, amount?)', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  describe('Basic Decrementing', () => {
    it('decrements by 1 when no amount specified', () => {
      store.set('count', 10)
      store.decrement('count')
      expect(store.get('count')).toBe(9)
    })

    it('decrements by positive integer amount', () => {
      store.set('count', 10)
      store.decrement('count', 5)
      expect(store.get('count')).toBe(5)
    })

    it('decrements by negative amount (effectively increment)', () => {
      store.set('count', 10)
      store.decrement('count', -3)
      expect(store.get('count')).toBe(13)
    })

    it('decrements by float amount', () => {
      store.set('count', 10)
      store.decrement('count', 0.5)
      expect(store.get('count')).toBe(9.5)
    })

    it('decrements by 0 (no change)', () => {
      store.set('count', 10)
      store.decrement('count', 0)
      expect(store.get('count')).toBe(10)
    })
  })

  describe('Non-Existent Key', () => {
    it('auto-initializes non-existent key to 0, then decrements', () => {
      store.decrement('newCount', 5)
      expect(store.get('newCount')).toBe(-5)
    })

    it("decrement('newKey') results in value -1", () => {
      store.decrement('newKey')
      expect(store.get('newKey')).toBe(-1)
    })

    it("decrement('newKey', 5) results in value -5", () => {
      store.decrement('newKey', 5)
      expect(store.get('newKey')).toBe(-5)
    })
  })

  describe('Type Errors', () => {
    it('throws TypeError when key exists with boolean value', () => {
      store.set('flag', true)
      expect(() => store.decrement('flag')).toThrow(TypeError)
    })

    it('throws TypeError when key exists with string value', () => {
      store.set('name', 'alice')
      expect(() => store.decrement('name')).toThrow(TypeError)
    })
  })

  describe('Return Value', () => {
    it('returns the new numeric value after decrement', () => {
      store.set('count', 10)
      expect(store.decrement('count', 3)).toBe(7)
    })
  })
})

describe('store.all()', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('returns object with all flags and their values', () => {
    store.set('a', 1)
    store.set('b', true)
    store.set('c', 'test')
    expect(store.all()).toEqual({ a: 1, b: true, c: 'test' })
  })

  it('returns empty object if no flags set', () => {
    expect(store.all()).toEqual({})
  })

  it('returned object contains correct types (boolean, number, string)', () => {
    store.set('bool', true)
    store.set('num', 42)
    store.set('str', 'hello')
    const all = store.all()
    expect(typeof all.bool).toBe('boolean')
    expect(typeof all.num).toBe('number')
    expect(typeof all.str).toBe('string')
  })

  it("returned object is a shallow copy (mutations don't affect store)", () => {
    store.set('key', 'value')
    const all = store.all()
    all.key = 'modified'
    expect(store.get('key')).toBe('value')
  })

  it("modifying returned object doesn't affect subsequent all() calls", () => {
    store.set('key', 'value')
    const first = store.all()
    first.key = 'modified'
    const second = store.all()
    expect(second.key).toBe('value')
  })
})

describe('store.keys()', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('returns array of all flag keys', () => {
    store.set('a', 1)
    store.set('b', 2)
    store.set('c', 3)
    const keys = store.keys()
    expect(keys).toContain('a')
    expect(keys).toContain('b')
    expect(keys).toContain('c')
  })

  it('returns empty array if no flags set', () => {
    expect(store.keys()).toEqual([])
  })

  it('returned array contains strings only', () => {
    store.set('a', 1)
    store.set('b', true)
    const keys = store.keys()
    expect(keys.every(k => typeof k === 'string')).toBe(true)
  })

  it('keys are in insertion order (or document if different)', () => {
    store.set('first', 1)
    store.set('second', 2)
    store.set('third', 3)
    const keys = store.keys()
    expect(keys).toEqual(['first', 'second', 'third'])
  })

  it("returned array is a copy (mutations don't affect store)", () => {
    store.set('a', 1)
    const keys = store.keys()
    keys.push('b')
    expect(store.has('b')).toBe(false)
  })
})

describe('store.setMany(object)', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('sets multiple boolean flags at once', () => {
    store.setMany({ a: true, b: false })
    expect(store.get('a')).toBe(true)
    expect(store.get('b')).toBe(false)
  })

  it('sets multiple numeric flags at once', () => {
    store.setMany({ x: 10, y: 20 })
    expect(store.get('x')).toBe(10)
    expect(store.get('y')).toBe(20)
  })

  it('sets multiple string flags at once', () => {
    store.setMany({ name: 'alice', city: 'boston' })
    expect(store.get('name')).toBe('alice')
    expect(store.get('city')).toBe('boston')
  })

  it('sets mixed types at once', () => {
    store.setMany({ flag: true, count: 42, name: 'test' })
    expect(store.get('flag')).toBe(true)
    expect(store.get('count')).toBe(42)
    expect(store.get('name')).toBe('test')
  })

  it('overwrites existing values', () => {
    store.set('a', 1)
    store.setMany({ a: 2 })
    expect(store.get('a')).toBe(2)
  })

  it('can add new keys and overwrite existing in same call', () => {
    store.set('a', 1)
    store.setMany({ a: 10, b: 20 })
    expect(store.get('a')).toBe(10)
    expect(store.get('b')).toBe(20)
  })

  it('setting a value to null removes that key', () => {
    store.set('key', 'value')
    store.setMany({ key: null as any })
    expect(store.has('key')).toBe(false)
  })

  it('setting a value to undefined removes that key', () => {
    store.set('key', 'value')
    store.setMany({ key: undefined as any })
    expect(store.has('key')).toBe(false)
  })

  it('empty object is a no-op (no error)', () => {
    expect(() => store.setMany({})).not.toThrow()
  })

  it('validates all keys before setting any (atomic validation)', () => {
    expect(() => store.setMany({ valid: true, 'invalid key': false })).toThrow(ValidationError)
    expect(store.has('valid')).toBe(false)
  })

  it('throws ValidationError if any key is invalid (none are set)', () => {
    expect(() => store.setMany({ a: 1, '!invalid': 2 })).toThrow(ValidationError)
    expect(store.has('a')).toBe(false)
  })

  it('returns the store instance (for chaining)', () => {
    const result = store.setMany({ a: 1 })
    expect(result).toBe(store)
  })
})

describe('Security: prototype pollution prevention', () => {
  it('rejects __proto__ as flag key', () => {
    const store = createFlagStore()
    expect(() => store.set('__proto__', 'polluted')).toThrow(ValidationError)
    expect(() => store.set('__proto__', 'polluted')).toThrow(/prototype property/)
  })

  it('rejects constructor as flag key', () => {
    const store = createFlagStore()
    expect(() => store.set('constructor', 'polluted')).toThrow(ValidationError)
    expect(() => store.set('constructor', 'polluted')).toThrow(/prototype property/)
  })

  it('rejects prototype as flag key', () => {
    const store = createFlagStore()
    expect(() => store.set('prototype', 'polluted')).toThrow(ValidationError)
    expect(() => store.set('prototype', 'polluted')).toThrow(/prototype property/)
  })

  it('filters __proto__ from JSON deserialization in loadFromStorage', () => {
    const mockStorage = {
      getItem: () => JSON.stringify({ __proto__: { polluted: true }, validKey: 'value' }),
      setItem: () => {},
      removeItem: () => {},
    }
    const store = createFlagStore({ persist: { storage: mockStorage } })

    // __proto__ should not be loaded
    expect(store.has('__proto__')).toBe(false)
    // Valid key should be loaded
    expect(store.get('validKey')).toBe('value')
    // Prototype should not be polluted
    expect(({} as any).polluted).toBeUndefined()
  })

  it('filters constructor from JSON deserialization in loadFromStorage', () => {
    const mockStorage = {
      getItem: () => JSON.stringify({ constructor: { prototype: { polluted: true } }, validKey: 'value' }),
      setItem: () => {},
      removeItem: () => {},
    }
    const store = createFlagStore({ persist: { storage: mockStorage } })

    expect(store.has('constructor')).toBe(false)
    expect(store.get('validKey')).toBe('value')
    expect(({} as any).polluted).toBeUndefined()
  })

  it('filters prototype from JSON deserialization in loadFromStorage', () => {
    const mockStorage = {
      getItem: () => JSON.stringify({ prototype: { polluted: true }, validKey: 'value' }),
      setItem: () => {},
      removeItem: () => {},
    }
    const store = createFlagStore({ persist: { storage: mockStorage } })

    expect(store.has('prototype')).toBe(false)
    expect(store.get('validKey')).toBe('value')
    expect(({} as any).polluted).toBeUndefined()
  })

  it('filters dangerous keys in store.load() method', () => {
    const mockStorage = {
      getItem: () => JSON.stringify({ __proto__: { polluted: true }, constructor: 'bad', validKey: 'value' }),
      setItem: () => {},
      removeItem: () => {},
    }
    const store = createFlagStore({ persist: { storage: mockStorage, autoSave: false } }) as any

    // Clear and manually load
    store.clear()
    store.load()

    expect(store.has('__proto__')).toBe(false)
    expect(store.has('constructor')).toBe(false)
    expect(store.get('validKey')).toBe('value')
    expect(({} as any).polluted).toBeUndefined()
  })

  it('handles __proto__ in setMany safely (JS ignores it in object literals)', () => {
    const store = createFlagStore()
    // JavaScript automatically filters __proto__ from Object.keys/entries
    // This test verifies the behavior is safe
    store.setMany({ __proto__: 'polluted' as any, validKey: 'value' })
    expect(store.has('__proto__')).toBe(false)
    expect(store.get('validKey')).toBe('value')
    expect(({} as any).polluted).toBeUndefined()
  })

  it('handles __proto__ in initial values safely (JS ignores it in object literals)', () => {
    // JavaScript automatically filters __proto__ from Object.keys/entries
    // This test verifies the behavior is safe
    const store = createFlagStore({ initial: { __proto__: 'polluted' as any, validKey: 'value' } })
    expect(store.has('__proto__')).toBe(false)
    expect(store.get('validKey')).toBe('value')
    expect(({} as any).polluted).toBeUndefined()
  })
})

describe('Security: integer overflow and bounds checking', () => {
  it('rejects NaN values', () => {
    const store = createFlagStore()
    expect(() => store.set('key', NaN)).toThrow(ValidationError)
    expect(() => store.set('key', NaN)).toThrow(/finite/)
  })

  it('rejects Infinity values', () => {
    const store = createFlagStore()
    expect(() => store.set('key', Infinity)).toThrow(ValidationError)
    expect(() => store.set('key', Infinity)).toThrow(/finite/)
  })

  it('rejects -Infinity values', () => {
    const store = createFlagStore()
    expect(() => store.set('key', -Infinity)).toThrow(ValidationError)
    expect(() => store.set('key', -Infinity)).toThrow(/finite/)
  })

  it('handles NaN in computed flags by converting to 0', () => {
    const store = createFlagStore()
    store.set('a', 1)
    store.compute('result', ['a'], () => NaN)
    expect(store.get('result')).toBe(0)
  })

  it('handles Infinity in computed flags by clamping to MAX_SAFE_INTEGER', () => {
    const store = createFlagStore()
    store.set('a', 1)
    store.compute('result', ['a'], () => Infinity)
    expect(store.get('result')).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('handles -Infinity in computed flags by clamping to MIN_SAFE_INTEGER', () => {
    const store = createFlagStore()
    store.set('a', 1)
    store.compute('result', ['a'], () => -Infinity)
    expect(store.get('result')).toBe(Number.MIN_SAFE_INTEGER)
  })

  it('allows maximum safe integers', () => {
    const store = createFlagStore()
    expect(() => store.set('key', Number.MAX_SAFE_INTEGER)).not.toThrow()
    expect(() => store.set('key', Number.MIN_SAFE_INTEGER)).not.toThrow()
  })
})

describe('Security: input length limits', () => {
  it('rejects keys exceeding maximum length', () => {
    const store = createFlagStore()
    const longKey = 'a'.repeat(1001)
    expect(() => store.set(longKey, true)).toThrow(ValidationError)
    expect(() => store.set(longKey, true)).toThrow(/maximum length/)
  })

  it('accepts keys at maximum length', () => {
    const store = createFlagStore()
    const maxKey = 'a'.repeat(1000)
    expect(() => store.set(maxKey, true)).not.toThrow()
    expect(store.get(maxKey)).toBe(true)
  })

  it('rejects string values exceeding maximum length', () => {
    const store = createFlagStore()
    const longValue = 'a'.repeat(100_001)
    expect(() => store.set('key', longValue)).toThrow(ValidationError)
    expect(() => store.set('key', longValue)).toThrow(/maximum length/)
  })

  it('accepts string values at maximum length', () => {
    const store = createFlagStore()
    const maxValue = 'a'.repeat(100_000)
    expect(() => store.set('key', maxValue)).not.toThrow()
    expect(store.get('key')).toBe(maxValue)
  })

  it('rejects condition strings exceeding maximum length', () => {
    const store = createFlagStore()
    const longCondition = 'a and b and c'.repeat(1000)
    expect(() => store.check(longCondition)).toThrow(ValidationError)
    expect(() => store.check(longCondition)).toThrow(/maximum length/)
  })

  it('accepts condition strings at maximum length', () => {
    const store = createFlagStore({ initial: { a: true } })
    const maxCondition = 'a'.repeat(10_000)
    // This will fail to parse but won't throw length error
    expect(() => store.check(maxCondition)).not.toThrow(ValidationError)
  })

  it('enforces key length limit in setMany', () => {
    const store = createFlagStore()
    const longKey = 'a'.repeat(1001)
    expect(() => store.setMany({ [longKey]: true })).toThrow(ValidationError)
  })

  it('enforces string value length limit in setMany', () => {
    const store = createFlagStore()
    const longValue = 'a'.repeat(100_001)
    expect(() => store.setMany({ key: longValue })).toThrow(ValidationError)
  })
})
