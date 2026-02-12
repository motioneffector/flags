import { describe, it, expect } from 'vitest'
import { ValidationError, ParseError } from './errors'
import { createFlagStore } from './core/store'

describe('ValidationError', () => {
  it('thrown for invalid key names', () => {
    const store = createFlagStore()

    expect(() => store.set('', 'value')).toThrow(/Key cannot be empty/)
    expect(() => store.set('invalid key', 'value')).toThrow(/cannot contain spaces/)
    expect(() => store.set('!invalid', 'value')).toThrow(/cannot start with/)
  })

  it('thrown for invalid value types', () => {
    expect(() => createFlagStore({ initial: { key: null as any } })).toThrow(/must be boolean, number, or string/)
    expect(() => createFlagStore({ initial: { key: {} as any } })).toThrow(/must be boolean, number, or string/)
    expect(() => createFlagStore({ initial: { key: [] as any } })).toThrow(/must be boolean, number, or string/)
  })

  it("has name 'ValidationError'", () => {
    expect.assertions(2)
    try {
      createFlagStore({ initial: { key: null as any } })
      throw new Error('Should have thrown ValidationError')
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError)
      expect((e as Error).name).toBe('ValidationError')
    }
  })

  it('has descriptive message', () => {
    expect.assertions(1)
    try {
      const store = createFlagStore()
      store.set('', 'value')
      throw new Error('Should have thrown ValidationError')
    } catch (e) {
      expect((e as Error).message).toContain('Key cannot be empty')
    }
  })

  it('instanceof ValidationError', () => {
    expect.assertions(1)
    try {
      createFlagStore({ initial: { key: null as any } })
      throw new Error('Should have thrown ValidationError')
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError)
    }
  })

  it('instanceof Error', () => {
    expect.assertions(1)
    try {
      createFlagStore({ initial: { key: null as any } })
      throw new Error('Should have thrown ValidationError')
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError)
    }
  })
})

describe('ParseError', () => {
  it('thrown for invalid condition syntax', () => {
    const store = createFlagStore()

    expect(() => store.check('a AND AND b')).toThrow(/Unexpected token/)
    expect(() => store.check('(a AND b')).toThrow(/Expected/)
    expect(() => store.check('a >> 5')).toThrow(/Unexpected token/)
  })

  it('thrown for empty condition', () => {
    const store = createFlagStore()

    expect(() => store.check('')).toThrow(/Condition cannot be empty/)
    expect(() => store.check('   ')).toThrow(/Condition cannot be empty/)
  })

  it("has name 'ParseError'", () => {
    const store = createFlagStore()

    expect.assertions(2)
    try {
      store.check('')
      throw new Error('Should have thrown ParseError')
    } catch (e) {
      expect(e).toBeInstanceOf(ParseError)
      expect((e as Error).name).toBe('ParseError')
    }
  })

  it("has descriptive message indicating what's wrong", () => {
    const store = createFlagStore()

    expect.assertions(3)
    try {
      store.check('')
      throw new Error('Should have thrown ParseError')
    } catch (e) {
      expect((e as Error).message).toContain('empty')
    }

    try {
      store.check('(a AND b')
      throw new Error('Should have thrown ParseError')
    } catch (e) {
      expect((e as Error).message).toContain('Expected')
      expect((e as Error).message.length).toBeGreaterThan(10)
    }
  })

  it('instanceof ParseError', () => {
    const store = createFlagStore()

    expect.assertions(1)
    try {
      store.check('')
      throw new Error('Should have thrown ParseError')
    } catch (e) {
      expect(e).toBeInstanceOf(ParseError)
    }
  })

  it('instanceof Error', () => {
    const store = createFlagStore()

    expect.assertions(1)
    try {
      store.check('')
      throw new Error('Should have thrown ParseError')
    } catch (e) {
      expect(e).toBeInstanceOf(ParseError)
    }
  })
})

describe('TypeError (native)', () => {
  it('thrown when toggle() called on non-boolean', () => {
    const store = createFlagStore()
    store.set('count', 42)

    expect(() => store.toggle('count')).toThrow(/toggle.*boolean/i)
  })

  it('thrown when increment() called on non-number', () => {
    const store = createFlagStore()
    store.set('flag', true)

    expect(() => store.increment('flag')).toThrow(/Cannot increment non-numeric/)
  })

  it('thrown when decrement() called on non-number', () => {
    const store = createFlagStore()
    store.set('name', 'alice')

    expect(() => store.decrement('name')).toThrow(/Cannot decrement non-numeric/)
  })
})
