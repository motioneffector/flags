import { describe, it, expect } from 'vitest'
import { ValidationError, ParseError } from './errors'
import { createFlagStore } from './core/store'

describe('ValidationError', () => {
  it('thrown for invalid key names', () => {
    const store = createFlagStore()

    expect(() => store.set('', 'value')).toThrow(ValidationError)
    expect(() => store.set('invalid key', 'value')).toThrow(ValidationError)
    expect(() => store.set('!invalid', 'value')).toThrow(ValidationError)
  })

  it('thrown for invalid value types', () => {
    expect(() =>
      createFlagStore({ initial: { key: null as any } })
    ).toThrow(ValidationError)
    expect(() =>
      createFlagStore({ initial: { key: {} as any } })
    ).toThrow(ValidationError)
    expect(() =>
      createFlagStore({ initial: { key: [] as any } })
    ).toThrow(ValidationError)
  })

  it('has name \'ValidationError\'', () => {
    try {
      createFlagStore({ initial: { key: null as any } })
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
      expect((e as Error).name).toBe('ValidationError')
    }
  })

  it('has descriptive message', () => {
    try {
      const store = createFlagStore()
      store.set('', 'value')
    } catch (e) {
      expect((e as Error).message).toBeTruthy()
      expect((e as Error).message.length).toBeGreaterThan(10)
    }
  })

  it('instanceof ValidationError', () => {
    try {
      createFlagStore({ initial: { key: null as any } })
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError)
    }
  })

  it('instanceof Error', () => {
    try {
      createFlagStore({ initial: { key: null as any } })
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
    }
  })
})

describe('ParseError', () => {
  it('thrown for invalid condition syntax', () => {
    const store = createFlagStore()

    expect(() => store.check('a AND AND b')).toThrow(ParseError)
    expect(() => store.check('(a AND b')).toThrow(ParseError)
    expect(() => store.check('a >> 5')).toThrow(ParseError)
  })

  it('thrown for empty condition', () => {
    const store = createFlagStore()

    expect(() => store.check('')).toThrow(ParseError)
    expect(() => store.check('   ')).toThrow(ParseError)
  })

  it('has name \'ParseError\'', () => {
    const store = createFlagStore()

    try {
      store.check('')
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
      expect((e as Error).name).toBe('ParseError')
    }
  })

  it('has descriptive message indicating what\'s wrong', () => {
    const store = createFlagStore()

    try {
      store.check('')
    } catch (e) {
      expect((e as Error).message).toBeTruthy()
      expect((e as Error).message).toContain('empty')
    }

    try {
      store.check('(a AND b')
    } catch (e) {
      expect((e as Error).message).toBeTruthy()
      expect((e as Error).message.length).toBeGreaterThan(10)
    }
  })

  it('instanceof ParseError', () => {
    const store = createFlagStore()

    try {
      store.check('')
    } catch (e) {
      expect(e).toBeInstanceOf(ParseError)
    }
  })

  it('instanceof Error', () => {
    const store = createFlagStore()

    try {
      store.check('')
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
    }
  })
})

describe('TypeError (native)', () => {
  it('thrown when toggle() called on non-boolean', () => {
    const store = createFlagStore()
    store.set('count', 42)

    expect(() => store.toggle('count')).toThrow(TypeError)
  })

  it('thrown when increment() called on non-number', () => {
    const store = createFlagStore()
    store.set('flag', true)

    expect(() => store.increment('flag')).toThrow(TypeError)
  })

  it('thrown when decrement() called on non-number', () => {
    const store = createFlagStore()
    store.set('name', 'alice')

    expect(() => store.decrement('name')).toThrow(TypeError)
  })
})
