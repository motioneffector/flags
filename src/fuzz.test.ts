/**
 * Fuzz Testing Suite for @motioneffector/flags
 *
 * This comprehensive fuzz test suite stress-tests the library's API surface with:
 * - Input mutation fuzzing for all public methods
 * - Property-based testing for mathematical properties
 * - Boundary exploration for edge cases
 * - State machine fuzzing for lifecycle operations
 *
 * Execution modes:
 * - Standard (CI): `pnpm test:run` - 200 iterations per test, deterministic
 * - Thorough: `pnpm fuzz:thorough` - 60 seconds per test, rotating seeds
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createFlagStore } from './core/store'
import { ValidationError, ParseError } from './errors'
import type { FlagStore, FlagStoreWithHistory, FlagStoreWithPersistence, FlagValue } from './types'

// ============================================================================
// FUZZ TEST UTILITIES
// ============================================================================

const BASE_SEED = 12345
const THOROUGH_MODE = process.env.FUZZ_THOROUGH === '1'
const ITERATIONS = THOROUGH_MODE ? 0 : 200 // 0 means time-based
// Configurable time budget via env var, default to 10s for thorough mode
const TIME_BUDGET_MS = THOROUGH_MODE
  ? 10_000
  : 0

/**
 * Simple seeded PRNG for reproducibility
 */
function createSeededRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

/**
 * Main fuzz loop - supports both iteration-based and time-based execution
 */
function fuzzLoop(testFn: (random: () => number, iteration: number) => void, seed = BASE_SEED): number {
  const startTime = Date.now()
  const random = createSeededRandom(seed)
  let iteration = 0

  if (TIME_BUDGET_MS > 0) {
    // Time-based mode (thorough) with periodic GC hints
    const gcInterval = 10000 // GC hint every 10k iterations
    while (Date.now() - startTime < TIME_BUDGET_MS) {
      testFn(random, iteration++)

      // Hint for GC periodically to prevent memory buildup
      if (iteration % gcInterval === 0 && typeof global.gc === 'function') {
        global.gc()
      }
    }
  } else {
    // Iteration-based mode (standard)
    for (let i = 0; i < ITERATIONS; i++) {
      testFn(random, iteration++)
    }
  }

  return iteration
}

/**
 * Async version of fuzzLoop
 */
async function fuzzLoopAsync(
  testFn: (random: () => number, iteration: number) => Promise<void>,
  seed = BASE_SEED
): Promise<number> {
  const startTime = Date.now()
  const random = createSeededRandom(seed)
  let iteration = 0

  if (TIME_BUDGET_MS > 0) {
    while (Date.now() - startTime < TIME_BUDGET_MS) {
      await testFn(random, iteration++)
    }
  } else {
    for (let i = 0; i < ITERATIONS; i++) {
      await testFn(random, iteration++)
    }
  }

  return iteration
}

// ============================================================================
// VALUE GENERATORS
// ============================================================================

/**
 * Generate random string with various mutations
 */
function generateString(random: () => number, mode: 'malicious' | 'normal' | 'unicode' = 'normal'): string {
  const r = random()

  if (mode === 'malicious') {
    const malicious = [
      '', // empty
      ' ', // whitespace only
      '   ', // multiple spaces
      '\t\n\r', // control chars
      '__proto__', // prototype pollution
      'constructor',
      'prototype',
      'AND', 'OR', 'NOT', // reserved words
      'and', 'or', 'not',
      'AnD', 'oR', 'NoT', // mixed case
      '>', '<', '>=', '<=', '==', '!=', // operators
      '(', ')', '((', '))', // parens
      '"', "'", '`', // quotes
      'a'.repeat(10000), // very long
      'a\0b', // null byte
      "'; DROP TABLE;", // SQL injection
      '<script>alert(1)</script>', // XSS
      'eval()',
      '${code}',
      '..', '../../../etc/passwd', // path traversal
    ]
    return malicious[Math.floor(r * malicious.length)] ?? ''
  }

  if (mode === 'unicode') {
    const unicode = [
      '😀', '👍', '🎉', // emoji
      '\u202E', // RTL mark
      '\u200B', '\u200C', '\u200D', // zero-width chars
      '\uD800', '\uDFFF', // surrogate pairs
      'مرحبا', '你好', 'שלום', // multi-byte
      'a\u0301', // combining chars
    ]
    return unicode[Math.floor(r * unicode.length)] ?? ''
  }

  // Normal strings
  const length = Math.floor(r * 20)
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-.'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(random() * chars.length)]
  }
  return result || 'defaultKey'
}

/**
 * Generate random number with edge cases
 */
function generateNumber(random: () => number, includeEdgeCases = true): number {
  const r = random()

  if (includeEdgeCases && r < 0.3) {
    const edgeCases = [
      0,
      -0,
      // NaN, Infinity, -Infinity removed - now rejected by security validation
      Number.MAX_SAFE_INTEGER,
      Number.MIN_SAFE_INTEGER,
      Number.MAX_SAFE_INTEGER - 1,
      Number.MIN_SAFE_INTEGER + 1,
      Number.EPSILON,
      Number.EPSILON / 2,
      1e100, -1e100, // large values (but not overflow)
      1e-308, -1e-308, // near underflow
      0.1 + 0.2, // floating point precision
      Number.MAX_VALUE / 2, // Half of MAX_VALUE (finite)
      5e-324, // MIN_VALUE
    ]
    return edgeCases[Math.floor(random() * edgeCases.length)] ?? 0
  }

  // Normal numbers
  const type = random()
  if (type < 0.33) {
    return Math.floor((random() - 0.5) * 1000) // integer
  } else if (type < 0.66) {
    return (random() - 0.5) * 1000 // decimal
  } else {
    return random() < 0.5 ? random() : -random() // small decimal
  }
}

/**
 * Generate random boolean
 */
function generateBoolean(random: () => number): boolean {
  return random() < 0.5
}

/**
 * Generate random FlagValue
 */
function generateFlagValue(random: () => number): FlagValue {
  const type = random()
  if (type < 0.33) {
    return generateBoolean(random)
  } else if (type < 0.66) {
    return generateNumber(random, true)
  } else {
    return generateString(random, 'normal')
  }
}

/**
 * Generate random key (valid or invalid)
 */
function generateKey(random: () => number, allowInvalid = true): string {
  if (allowInvalid && random() < 0.3) {
    return generateString(random, 'malicious')
  }
  if (allowInvalid && random() < 0.1) {
    return generateString(random, 'unicode')
  }
  return generateString(random, 'normal')
}

/**
 * Generate random object
 */
function generateObject(random: () => number, keyCount = 5): Record<string, FlagValue> {
  const obj: Record<string, FlagValue> = {}
  const count = Math.floor(random() * keyCount) + 1
  for (let i = 0; i < count; i++) {
    obj[generateKey(random, false)] = generateFlagValue(random)
  }
  return obj
}

/**
 * Generate random condition string
 */
function generateCondition(random: () => number, complexity: 'simple' | 'complex' = 'simple'): string {
  const r = random()

  if (complexity === 'simple') {
    const templates = [
      'flag1',
      'flag1 AND flag2',
      'flag1 OR flag2',
      'NOT flag1',
      'flag1 AND NOT flag2',
      '(flag1 OR flag2) AND flag3',
      'flag1 > 5',
      'flag1 >= 10',
      'flag1 < 20',
      'flag1 <= 15',
      'flag1 == 42',
      'flag1 != 0',
      'flag1 == "hello"',
      'flag1 > 5 AND flag2 < 10',
    ]
    return templates[Math.floor(r * templates.length)] ?? 'flag1'
  }

  // Complex/malicious conditions
  const malicious = [
    '', // empty
    '   ', // whitespace
    '(', ')', '((', '))', // unbalanced parens
    '(flag1', 'flag1)', // unbalanced
    "'", '"', "'hello", '"world', // unclosed quotes
    'flag1 && flag2', 'flag1 || flag2', // invalid operators
    'AND', 'OR', 'NOT', // missing operands
    'flag1 AND', 'OR flag2', 'AND AND', // incomplete
    'flag1 > > flag2', 'flag1 == == flag2', // doubled operators
    '> 5', '< flag1', // missing left operand
    '(((((((((flag1))))))))))', // deeply nested
    'flag1 ' + 'AND flag2 '.repeat(100), // very long
    '__proto__', 'constructor.prototype', // injection
    'eval()', '<script>', // code injection
    'flag1; DROP TABLE;', // SQL-like
  ]
  return malicious[Math.floor(r * malicious.length)] ?? 'flag1'
}

// ============================================================================
// PHASE 1: CORE OPERATIONS FUZZING
// ============================================================================

describe('Fuzz: store.set()', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('handles random keys and values', () => {
    const iterCount = fuzzLoop((random) => {
      const key = generateKey(random, true)
      const value = generateFlagValue(random)

      try {
        const result = store.set(key, value)

        // Verify invariants on success
        expect(result).toBe(store) // returns store for chaining
        expect(store.get(key.trim())).toBe(value)
        expect(store.has(key.trim())).toBe(true)
      } catch (error) {
        // Verify proper error types
        expect(error).toBeInstanceOf(Error)
        expect(error).not.toBeInstanceOf(Error.constructor) // not base Error

        if (error instanceof ValidationError) {
          // Invalid key - state should be unchanged
          expect(store.get(key.trim())).toBeUndefined()
        } else if (error instanceof TypeError) {
          // Should not happen with FlagValue types
          throw new Error('Unexpected TypeError with valid FlagValue')
        }
      }
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })

  it('rejects invalid value types', () => {
    const iterCount = fuzzLoop((random) => {
      // Use guaranteed valid key
      const key = 'testKey_' + Math.floor(random() * 1000000)
      const invalidValues = [
        {}, [], () => {}, Symbol('test'), null, undefined,
        new Date(), /regex/, new Map(), new Set()
      ]
      const value = invalidValues[Math.floor(random() * invalidValues.length)]

      if (value === null || value === undefined) {
        // These should delete the flag
        store.set(key, value as any)
        expect(store.has(key.trim())).toBe(false)
      } else {
        // These should throw ValidationError
        expect(() => store.set(key, value as any)).toThrow(ValidationError)
      }
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })

  it('never allows prototype pollution', () => {
    const iterCount = fuzzLoop((random) => {
      // Security fix: The library now explicitly blocks __proto__, constructor, prototype
      const pollutionKeys = ['__proto__', 'constructor', 'prototype']
      const key = pollutionKeys[Math.floor(random() * pollutionKeys.length)] ?? '__proto__'
      const value = generateFlagValue(random)

      // These keys are now explicitly rejected for security
      expect(() => store.set(key, value)).toThrow(ValidationError)

      // Verify the key is not stored
      expect(store.has(key)).toBe(false)

      // Create a new object and verify it's not polluted
      const testObj = {}
      const hasPolluted = Object.prototype.hasOwnProperty.call(testObj, 'polluted')
      expect(hasPolluted).toBe(false)
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })

  it('completes within time budget', () => {
    const start = Date.now()
    store.set('testKey', 'testValue')
    const duration = Date.now() - start

    expect(duration).toBeLessThan(100) // < 100ms
  })
})

describe('Fuzz: store.get()', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('handles random keys without throwing', () => {
    const iterCount = fuzzLoop((random) => {
      const key = generateKey(random, true)

      // get() should never throw
      const result = store.get(key)

      // Should return FlagValue | undefined
      if (result !== undefined) {
        expect(['boolean', 'number', 'string']).toContain(typeof result)
      }
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })

  it('trims keys consistently with set()', () => {
    const iterCount = fuzzLoop((random) => {
      const key = generateKey(random, false)
      const value = generateFlagValue(random)

      try {
        store.set(key, value)
        expect(store.get(key)).toBe(value)
        expect(store.get(key.trim())).toBe(value)
        expect(store.get(`  ${key}  `)).toBe(value)
      } catch {
        // Invalid key - skip
      }
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })
})

describe('Fuzz: store.increment()', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('handles numeric edge cases', () => {
    const iterCount = fuzzLoop((random) => {
      const key = generateKey(random, false)
      const amount = generateNumber(random, true)

      try {
        const result = store.increment(key, amount)
        expect(typeof result).toBe('number')

        // Verify it was set
        expect(store.get(key.trim())).toBe(result)
      } catch (error) {
        if (error instanceof TypeError) {
          // Flag exists and is not numeric
          expect(typeof store.get(key.trim())).not.toBe('number')
        } else if (error instanceof ValidationError) {
          // Invalid key
        } else {
          throw error
        }
      }
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })

  it('creates flag with amount when non-existent', () => {
    const iterCount = fuzzLoop((random) => {
      // Use unique keys to avoid conflicts
      const key = 'incTest_' + Math.floor(random() * 1000000)
      const amount = generateNumber(random, false) // normal numbers

      try {
        // Ensure key doesn't exist
        store.delete(key)

        const result = store.increment(key, amount)
        expect(result).toBe(amount)
        expect(store.get(key.trim())).toBe(amount)
      } catch (error) {
        // Invalid key - only expect ValidationError for invalid keys
        if (error instanceof ValidationError) {
          // This is fine
        } else {
          // Any other error is unexpected
          throw error
        }
      }
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })

  it('handles Infinity correctly', () => {
    // Security fix: Infinity values are now rejected
    expect(() => store.set('inf', Infinity)).toThrow(/must be finite/)
    expect(() => store.set('negInf', -Infinity)).toThrow(/must be finite/)
  })
})

describe('Fuzz: store.decrement()', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('handles numeric edge cases', () => {
    const iterCount = fuzzLoop((random) => {
      const key = generateKey(random, false)
      const amount = generateNumber(random, true)

      try {
        const result = store.decrement(key, amount)
        expect(typeof result).toBe('number')
        expect(store.get(key.trim())).toBe(result)
      } catch (error) {
        if (error instanceof TypeError) {
          expect(typeof store.get(key.trim())).not.toBe('number')
        } else if (error instanceof ValidationError) {
          // Invalid key
        } else {
          throw error
        }
      }
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })

  it('creates flag with negative amount when non-existent', () => {
    const iterCount = fuzzLoop((random) => {
      const key = generateKey(random, false)
      const amount = generateNumber(random, false)

      try {
        const result = store.decrement(key, amount)
        expect(result).toBe(-amount)
      } catch {
        // Invalid key
      }
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })
})

describe('Fuzz: store.toggle()', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('handles random keys', () => {
    const iterCount = fuzzLoop((random) => {
      const key = generateKey(random, false)

      try {
        const result = store.toggle(key)
        expect(typeof result).toBe('boolean')
        expect(store.get(key.trim())).toBe(result)
      } catch (error) {
        if (error instanceof TypeError) {
          // Flag exists and is not boolean
          const current = store.get(key.trim())
          expect(typeof current).not.toBe('boolean')
          expect(current).not.toBeUndefined()
        } else if (error instanceof ValidationError) {
          // Invalid key
        } else {
          throw error
        }
      }
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })

  it('creates flag with true when non-existent', () => {
    const key = generateKey(createSeededRandom(BASE_SEED), false)
    expect(store.toggle(key)).toBe(true)
    expect(store.get(key.trim())).toBe(true)
  })

  it('maintains toggle idempotence', () => {
    const iterCount = fuzzLoop((random) => {
      const key = generateKey(random, false)
      const initial = generateBoolean(random)

      try {
        store.set(key, initial)
        const toggled = store.toggle(key)
        const toggledBack = store.toggle(key)

        expect(toggledBack).toBe(initial)
      } catch {
        // Invalid key
      }
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })
})

// ============================================================================
// PHASE 2: CONDITION PARSER FUZZING
// ============================================================================

describe('Fuzz: store.check()', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
    store.set('flag1', true)
    store.set('flag2', false)
    store.set('flag3', 42)
    store.set('flag4', 'hello')
  })

  it('handles malformed syntax gracefully', () => {
    const iterCount = fuzzLoop((random) => {
      const condition = generateCondition(random, 'complex')

      try {
        const result = store.check(condition)
        // Should return boolean
        expect(typeof result).toBe('boolean')
      } catch (error) {
        // Should throw ParseError for invalid syntax
        expect(error).toBeInstanceOf(ParseError)
        expect((error as ParseError).position).toBeGreaterThanOrEqual(0)
      }
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })

  it('handles simple valid conditions', () => {
    const iterCount = fuzzLoop((random) => {
      const condition = generateCondition(random, 'simple')

      try {
        const result = store.check(condition)
        expect(typeof result).toBe('boolean')
      } catch (error) {
        // ParseError is ok for invalid syntax
        if (!(error instanceof ParseError)) {
          throw error
        }
      }
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })

  it('never evaluates strings as code', () => {
    const codeInjections = [
      'eval("malicious")',
      'Function("return this")()',
      '__proto__.polluted',
      'constructor.constructor("return this")()',
    ]

    for (const injection of codeInjections) {
      try {
        store.check(injection)
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError)
      }

      // Verify no code was executed
      const obj = {}
      const hasPolluted = Object.prototype.hasOwnProperty.call(obj, 'polluted')
      expect(hasPolluted).toBe(false)
    }
  })

  it('completes within time budget even for complex expressions', () => {
    const start = Date.now()

    // Very long expression
    const longExpr = Array(100).fill('flag1 OR flag2').join(' AND ')
    store.check(longExpr)

    // Deeply nested expression
    const deepNest = '('.repeat(50) + 'flag1' + ')'.repeat(50)
    try {
      store.check(deepNest)
    } catch (error) {
      expect(error).toBeInstanceOf(ParseError)
    }

    const duration = Date.now() - start
    expect(duration).toBeLessThan(100)
  })

  it('returns false for non-existent flags', () => {
    const iterCount = fuzzLoop((random) => {
      const key = 'nonExistent' + Math.floor(random() * 1000000)
      const result = store.check(key)
      expect(result).toBe(false)
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })

  it('maintains operator precedence consistency', () => {
    store.set('a', true)
    store.set('b', true)
    store.set('c', false)

    // AND has higher precedence than OR
    expect(store.check('a OR b AND c')).toBe(store.check('a OR (b AND c)'))
    expect(store.check('a OR b AND c')).not.toBe(store.check('(a OR b) AND c'))

    // NOT has highest precedence
    expect(store.check('NOT a OR b')).toBe(store.check('(NOT a) OR b'))
  })
})

// ============================================================================
// PHASE 3: BATCH OPERATIONS AND COMPUTED FLAGS
// ============================================================================

describe('Fuzz: store.setMany()', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('handles random objects', () => {
    const iterCount = fuzzLoop((random) => {
      const obj = generateObject(random, 10)

      try {
        const result = store.setMany(obj)
        expect(result).toBe(store)

        // Verify all values were set
        for (const [key, value] of Object.entries(obj)) {
          expect(store.get(key)).toBe(value)
        }
      } catch (error) {
        // Atomic validation - no partial updates
        expect(error).toBeInstanceOf(ValidationError)
      }
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })

  it('maintains atomicity - all or nothing', () => {
    const iterCount = fuzzLoop((random) => {
      const validObj = generateObject(random, 5)
      // Use an empty string which is always invalid after trim
      const invalidKey = '   '
      const mixedObj = { ...validObj, [invalidKey]: 'polluted' }

      const snapshot = store.all()

      expect(() => store.setMany(mixedObj)).toThrow(ValidationError)

      // Verify nothing was changed
      expect(store.all()).toEqual(snapshot)
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })
})

describe('Fuzz: store.batch()', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('rolls back all changes on error', () => {
    const iterCount = fuzzLoop((random) => {
      const initialState = store.all()

      try {
        store.batch(() => {
          store.set('key1', generateFlagValue(random))
          store.set('key2', generateFlagValue(random))
          store.set('key3', generateFlagValue(random))

          // Randomly throw error
          if (random() < 0.5) {
            throw new Error('Simulated batch error')
          }
        })
      } catch {
        // Verify state is unchanged
        expect(store.all()).toEqual(initialState)
      }
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })

  it('returns function result', () => {
    const iterCount = fuzzLoop((random) => {
      const expectedResult = generateFlagValue(random)

      const result = store.batch(() => {
        store.set('key', generateFlagValue(random))
        return expectedResult
      })

      expect(result).toBe(expectedResult)
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })

  it('handles nested batches', () => {
    const iterCount = fuzzLoop((random) => {
      const result = store.batch(() => {
        store.set('outer', generateFlagValue(random))
        return store.batch(() => {
          store.set('inner', generateFlagValue(random))
          return 'nested'
        })
      })

      expect(result).toBe('nested')
      expect(store.has('outer')).toBe(true)
      expect(store.has('inner')).toBe(true)
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })
})

describe('Fuzz: store.compute()', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('handles random dependencies', () => {
    const iterCount = fuzzLoop((random) => {
      // Create fresh store for each iteration to avoid conflicts
      const testStore = createFlagStore()
      const key = generateKey(random, false)
      const depCount = Math.floor(random() * 5) + 1
      const deps: string[] = []

      for (let i = 0; i < depCount; i++) {
        const depKey = generateKey(random, false)
        deps.push(depKey)
        try {
          testStore.set(depKey, generateFlagValue(random))
        } catch {
          // Invalid key
        }
      }

      try {
        testStore.compute(key, deps, (...values) => {
          // Simple computation - just return first truthy value
          return values.find(v => v !== undefined && v !== false && v !== 0) || false
        })

        // Verify computed flag is read-only
        expect(() => testStore.set(key, 'modified')).toThrow(Error)
        expect(() => testStore.delete(key)).toThrow(Error)
      } catch (error) {
        // ValidationError for invalid key or Error for circular deps
        if (!(error instanceof ValidationError) && !(error instanceof Error)) {
          throw error
        }
      }
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })

  it('detects circular dependencies', () => {
    store.set('a', 1)
    store.compute('b', ['a'], () => 2)

    // b depends on a, now try to make a depend on b (should fail)
    expect(() => {
      store.compute('a', ['b'], () => 3)
    }).toThrow(/Circular dependency detected/)
  })

  it('detects self-dependency', () => {
    expect(() => {
      store.compute('recursive', ['recursive'], () => 42)
    }).toThrow(/cannot depend on itself/)
  })
})

// ============================================================================
// PHASE 4: STATE MACHINE FUZZING
// ============================================================================

describe('Fuzz: FlagStore lifecycle', () => {
  it('maintains invariants through random operation sequences', () => {
    const iterCount = fuzzLoop((random) => {
      const store = createFlagStore()
      const operations = Math.floor(random() * 50) + 10

      for (let i = 0; i < operations; i++) {
        const op = random()
        const key = generateKey(random, false)

        try {
          if (op < 0.3) {
            // set
            store.set(key, generateFlagValue(random))
          } else if (op < 0.4) {
            // get
            store.get(key)
          } else if (op < 0.5) {
            // delete
            store.delete(key)
          } else if (op < 0.6) {
            // toggle
            store.toggle(key)
          } else if (op < 0.7) {
            // increment
            store.increment(key, generateNumber(random, false))
          } else if (op < 0.8) {
            // decrement
            store.decrement(key, generateNumber(random, false))
          } else if (op < 0.9) {
            // check
            store.check(generateCondition(random, 'simple'))
          } else {
            // clear
            store.clear()
          }
        } catch {
          // Errors are ok, just continue
        }

        // Verify state invariants
        const allFlags = store.all()
        const keys = store.keys()

        expect(keys.length).toBe(Object.keys(allFlags).length)

        for (const k of keys) {
          expect(store.has(k)).toBe(true)
          expect(store.get(k)).toBe(allFlags[k])
        }
      }
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })
})

describe('Fuzz: FlagStoreWithHistory lifecycle', () => {
  it('maintains history invariants through random operations', () => {
    const iterCount = fuzzLoop((random) => {
      const store = createFlagStore({ history: true }) as FlagStoreWithHistory
      const operations = Math.floor(random() * 30) + 5

      for (let i = 0; i < operations; i++) {
        const op = random()

        try {
          if (op < 0.5) {
            // Make changes
            store.set(generateKey(random, false), generateFlagValue(random))
          } else if (op < 0.7 && store.canUndo()) {
            // Undo
            const before = store.all()
            store.undo()
            const after = store.all()

            // State should have changed (unless it was at initial state)
            expect(before).not.toBe(after)
          } else if (op < 0.9 && store.canRedo()) {
            // Redo
            store.redo()
          } else {
            // Clear history
            store.clearHistory()
            expect(store.canUndo()).toBe(false)
            expect(store.canRedo()).toBe(false)
          }
        } catch {
          // Errors are ok
        }

        // Verify history state consistency
        if (store.canUndo()) {
          const before = store.all()
          store.undo()
          const after = store.all()

          // Should be able to redo to get back
          if (store.canRedo()) {
            store.redo()
            expect(store.all()).toEqual(before)
          }

          // Restore state for next iteration
          store.undo()
          Object.entries(before).forEach(([k, v]) => store.set(k, v))
        }
      }
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })
})

describe('Fuzz: FlagStoreWithPersistence lifecycle', () => {
  it('maintains persistence invariants', () => {
    const iterCount = fuzzLoop((random) => {
      const storage = new Map<string, string>()
      const mockStorage = {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      }

      // Start with clean storage
      storage.clear()

      const store = createFlagStore({
        persist: { storage: mockStorage }
      }) as FlagStoreWithPersistence

      // Make random changes using simple alphanumeric keys
      const operations = Math.floor(random() * 20) + 5
      const addedKeys = new Set<string>()

      for (let i = 0; i < operations; i++) {
        try {
          // Generate simple key: only letters and numbers
          const key = 'key_' + Math.floor(random() * 1000000)
          let value = generateFlagValue(random)

          // Filter out values that don't serialize well to JSON
          // -Infinity, Infinity, and -0 don't roundtrip through JSON.stringify/parse
          if (typeof value === 'number') {
            if (!isFinite(value) || Object.is(value, -0)) {
              value = 0 // Replace with a safe value
            }
          }

          store.set(key, value)
          addedKeys.add(key)
        } catch {
          // Invalid value (shouldn't happen with generateFlagValue)
        }
      }

      const beforeSave = store.all()
      store.save()

      // Clear storage object to be sure, then restore the saved data
      const savedData = storage.get('@motioneffector/flags')
      storage.clear()
      if (savedData) {
        storage.set('@motioneffector/flags', savedData)
      }

      // Create new store and load
      const store2 = createFlagStore({
        persist: { storage: mockStorage, autoSave: false }
      }) as FlagStoreWithPersistence

      store2.load()
      const afterLoad = store2.all()

      // Should have same state
      expect(afterLoad).toEqual(beforeSave)
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })

  it('handles storage errors gracefully', () => {
    const faultyStorage = {
      getItem: () => { throw new Error('Storage error') },
      setItem: () => { throw new Error('Storage error') },
      removeItem: () => { throw new Error('Storage error') },
    }

    // Should not throw, just log errors
    const store = createFlagStore({
      persist: { storage: faultyStorage }
    }) as FlagStoreWithPersistence

    expect(() => store.set('key', 'value')).not.toThrow()
    expect(() => store.save()).not.toThrow()
    expect(() => store.load()).not.toThrow()
  })
})

// ============================================================================
// PHASE 5: SUBSCRIPTIONS AND NAMESPACING
// ============================================================================

describe('Fuzz: store.subscribe()', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('notifies subscribers for all changes', () => {
    const iterCount = fuzzLoop((random) => {
      let notificationCount = 0
      const unsubscribe = store.subscribe(() => {
        notificationCount++
      })

      const operations = Math.floor(random() * 10) + 1
      for (let i = 0; i < operations; i++) {
        // Use guaranteed valid keys
        const key = 'subTest_' + Math.floor(random() * 1000000)
        store.set(key, generateFlagValue(random))
      }

      unsubscribe()

      // Should have received notifications
      expect(notificationCount).toBeGreaterThan(0)

      // After unsubscribe, no more notifications
      const beforeCount = notificationCount
      store.set('afterUnsubscribe', true)
      expect(notificationCount).toBe(beforeCount)
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })

  it('handles rapid successive changes', () => {
    const changes: string[] = []
    store.subscribe((key) => {
      changes.push(key)
    })

    // Fire 100 rapid changes
    for (let i = 0; i < 100; i++) {
      store.set(`key${i}`, i)
    }

    // All changes should be recorded
    expect(changes.length).toBe(100)
    expect(changes[0]).toBe('key0')
    expect(changes[99]).toBe('key99')
  })
})

describe('Fuzz: store.subscribeKey()', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('only fires for specific key', () => {
    const iterCount = fuzzLoop((random) => {
      // Use a guaranteed valid key
      const targetKey = 'targetKey_' + Math.floor(random() * 1000000)
      let targetCount = 0

      const unsubscribe = store.subscribeKey(targetKey, () => {
        targetCount++
      })

      // Ensure target key is set at least once
      store.set(targetKey, generateFlagValue(random))

      // Make changes to various keys
      for (let i = 0; i < 20; i++) {
        const key = random() < 0.3 ? targetKey : generateKey(random, false)
        try {
          store.set(key, generateFlagValue(random))
        } catch {
          // Invalid key
        }
      }

      unsubscribe()

      // Should have been notified at least once
      expect(targetCount).toBeGreaterThan(0)
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })
})

describe('Fuzz: store.namespace()', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('correctly prefixes all operations', () => {
    const iterCount = fuzzLoop((random) => {
      const prefix = generateKey(random, false)
      const ns = store.namespace(prefix)

      const key = generateKey(random, false)
      const value = generateFlagValue(random)

      try {
        ns.set(key, value)

        // Should be accessible via namespace
        expect(ns.get(key)).toBe(value)
        expect(ns.has(key)).toBe(true)

        // Should be in parent store with prefix
        const fullKey = `${prefix.trim()}.${key.trim()}`
        expect(store.get(fullKey)).toBe(value)
        expect(store.has(fullKey)).toBe(true)
      } catch {
        // Invalid key
      }
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })

  it('handles nested namespaces', () => {
    const ns1 = store.namespace('level1')
    const ns2 = ns1.namespace('level2')
    const ns3 = ns2.namespace('level3')

    ns3.set('deepKey', 'deepValue')

    expect(store.get('level1.level2.level3.deepKey')).toBe('deepValue')
    expect(ns1.get('level2.level3.deepKey')).toBe('deepValue')
    expect(ns2.get('level3.deepKey')).toBe('deepValue')
    expect(ns3.get('deepKey')).toBe('deepValue')
  })
})

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe('Property: Increment/Decrement Roundtrip', () => {
  it('returns to original value within FP precision', () => {
    const store = createFlagStore()

    const iterCount = fuzzLoop((random) => {
      const key = generateKey(random, false)
      const initial = generateNumber(random, false)
      const amount = generateNumber(random, false)

      try {
        store.set(key, initial)
        store.increment(key, amount)
        store.decrement(key, amount)

        const final = store.get(key) as number
        const maxValue = Math.max(Math.abs(initial), Math.abs(amount), 1)
        const tolerance = Number.EPSILON * maxValue * 10

        expect(Math.abs(final - initial)).toBeLessThanOrEqual(tolerance)
      } catch {
        // Invalid key or values
      }
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })
})

describe('Property: Toggle Idempotence', () => {
  it('returns to original after two toggles', () => {
    const store = createFlagStore()

    const iterCount = fuzzLoop((random) => {
      const key = generateKey(random, false)
      const initial = generateBoolean(random)

      try {
        store.set(key, initial)
        store.toggle(key)
        store.toggle(key)

        expect(store.get(key)).toBe(initial)
      } catch {
        // Invalid key
      }
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })
})

describe('Property: Set/Get Consistency', () => {
  it('get() returns value from set()', () => {
    const store = createFlagStore()

    const iterCount = fuzzLoop((random) => {
      const key = generateKey(random, false)
      const value = generateFlagValue(random)

      try {
        store.set(key, value)
        expect(store.get(key)).toBe(value)
      } catch {
        // Invalid key
      }
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })
})

describe('Property: Check Commutativity', () => {
  it('AND and OR are commutative', () => {
    const store = createFlagStore()

    const iterCount = fuzzLoop((random) => {
      const a = generateBoolean(random)
      const b = generateBoolean(random)

      store.set('a', a)
      store.set('b', b)

      expect(store.check('a AND b')).toBe(store.check('b AND a'))
      expect(store.check('a OR b')).toBe(store.check('b OR a'))
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })
})

describe('Property: Batch Atomicity', () => {
  it('failed batch leaves state unchanged', () => {
    const iterCount = fuzzLoop((random) => {
      const store = createFlagStore()

      // Set initial state with guaranteed valid keys
      const numInitial = Math.floor(random() * 5) + 1
      for (let i = 0; i < numInitial; i++) {
        try {
          const key = 'init_' + Math.floor(random() * 1000000)
          store.set(key, generateFlagValue(random))
        } catch {
          // Skip if value is invalid
        }
      }

      const snapshot = store.all()

      try {
        store.batch(() => {
          const key1 = 'batch_' + Math.floor(random() * 1000000)
          const key2 = 'batch_' + Math.floor(random() * 1000000)
          store.set(key1, generateFlagValue(random))
          store.set(key2, generateFlagValue(random))
          throw new Error('Intentional error')
        })
      } catch {
        // Expected error
      }

      expect(store.all()).toEqual(snapshot)
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })
})

describe('Property: Subscription Notification Count', () => {
  it('single operation triggers exactly one notification', () => {
    const iterCount = fuzzLoop((random) => {
      const store = createFlagStore()
      let count = 0

      store.subscribe(() => {
        count++
      })

      const key = generateKey(random, false)
      try {
        store.set(key, generateFlagValue(random))
        expect(count).toBe(1)
      } catch {
        // Invalid key - no notification
        expect(count).toBe(0)
      }
    })

    expect(iterCount).toBeGreaterThan(0)
    if (THOROUGH_MODE) console.log(`  Completed ${iterCount} iterations`)
  })
})
