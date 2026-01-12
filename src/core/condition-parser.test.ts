import { describe, it, expect, beforeEach } from 'vitest'
import { createFlagStore } from './store'
import { ParseError } from '../errors'
import type { FlagStore } from '../types'
import { createTestStore } from '../test-utils'

describe('store.check(condition) - Simple Truthy Checks', () => {
  describe('Truthiness Semantics (Decision 5.1: JS semantics)', () => {
    let store: FlagStore

    beforeEach(() => {
      store = createTestStore()
    })

    it("'flag' returns true when flag is true", () => {
      store.set('flag', true)
      expect(store.check('flag')).toBe(true)
    })

    it("'flag' returns false when flag is false", () => {
      store.set('flag', false)
      expect(store.check('flag')).toBe(false)
    })

    it("'flag' returns true when flag is positive number", () => {
      store.set('flag', 5)
      expect(store.check('flag')).toBe(true)
    })

    it("'flag' returns false when flag is 0", () => {
      store.set('flag', 0)
      expect(store.check('flag')).toBe(false)
    })

    it("'flag' returns true when flag is negative number", () => {
      store.set('flag', -5)
      expect(store.check('flag')).toBe(true)
    })

    it("'flag' returns true when flag is non-empty string", () => {
      store.set('flag', 'hello')
      expect(store.check('flag')).toBe(true)
    })

    it("'flag' returns false when flag is empty string", () => {
      store.set('flag', '')
      expect(store.check('flag')).toBe(false)
    })

    it("'flag' returns false when flag doesn't exist (Decision 5.3)", () => {
      expect(store.check('nonexistent')).toBe(false)
    })
  })

  describe('Negation', () => {
    let store: FlagStore

    beforeEach(() => {
      store = createTestStore()
    })

    it("'!flag' returns false when flag is true", () => {
      store.set('flag', true)
      expect(store.check('!flag')).toBe(false)
    })

    it("'!flag' returns true when flag is false", () => {
      store.set('flag', false)
      expect(store.check('!flag')).toBe(true)
    })

    it("'!flag' returns true when flag is 0", () => {
      store.set('flag', 0)
      expect(store.check('!flag')).toBe(true)
    })

    it("'!flag' returns true when flag is empty string", () => {
      store.set('flag', '')
      expect(store.check('!flag')).toBe(true)
    })

    it("'!flag' returns true when flag doesn't exist", () => {
      expect(store.check('!nonexistent')).toBe(true)
    })

    it("'NOT flag' behaves same as '!flag'", () => {
      store.set('flag', true)
      expect(store.check('NOT flag')).toBe(false)
    })

    it("'not flag' behaves same as '!flag' (case-insensitive)", () => {
      store.set('flag', true)
      expect(store.check('not flag')).toBe(false)
    })

    it("'Not flag' behaves same as '!flag' (case-insensitive)", () => {
      store.set('flag', true)
      expect(store.check('Not flag')).toBe(false)
    })
  })
})

describe('store.check(condition) - Boolean Equality', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it("'flag == true' returns true when flag is true", () => {
    store.set('flag', true)
    expect(store.check('flag == true')).toBe(true)
  })

  it("'flag == true' returns false when flag is false", () => {
    store.set('flag', false)
    expect(store.check('flag == true')).toBe(false)
  })

  it("'flag == false' returns true when flag is false", () => {
    store.set('flag', false)
    expect(store.check('flag == false')).toBe(true)
  })

  it("'flag == false' returns false when flag is true", () => {
    store.set('flag', true)
    expect(store.check('flag == false')).toBe(false)
  })

  it("'flag != true' returns true when flag is false", () => {
    store.set('flag', false)
    expect(store.check('flag != true')).toBe(true)
  })

  it("'flag != false' returns true when flag is true", () => {
    store.set('flag', true)
    expect(store.check('flag != false')).toBe(true)
  })
})

describe('store.check(condition) - Numeric Equality', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it("'count == 5' returns true when count is 5", () => {
    store.set('count', 5)
    expect(store.check('count == 5')).toBe(true)
  })

  it("'count == 5' returns false when count is not 5", () => {
    store.set('count', 3)
    expect(store.check('count == 5')).toBe(false)
  })

  it("'count == 0' returns true when count is 0", () => {
    store.set('count', 0)
    expect(store.check('count == 0')).toBe(true)
  })

  it("'count == -10' returns true when count is -10", () => {
    store.set('count', -10)
    expect(store.check('count == -10')).toBe(true)
  })

  it("'count == 3.14' returns true when count is 3.14", () => {
    store.set('count', 3.14)
    expect(store.check('count == 3.14')).toBe(true)
  })

  it("'count != 5' returns true when count is not 5", () => {
    store.set('count', 3)
    expect(store.check('count != 5')).toBe(true)
  })

  it("'count != 5' returns false when count is 5", () => {
    store.set('count', 5)
    expect(store.check('count != 5')).toBe(false)
  })
})

describe('store.check(condition) - Numeric Comparisons', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it("'count > 5' returns true when count is 6", () => {
    store.set('count', 6)
    expect(store.check('count > 5')).toBe(true)
  })

  it("'count > 5' returns false when count is 5", () => {
    store.set('count', 5)
    expect(store.check('count > 5')).toBe(false)
  })

  it("'count > 5' returns false when count is 4", () => {
    store.set('count', 4)
    expect(store.check('count > 5')).toBe(false)
  })

  it("'count < 5' returns true when count is 4", () => {
    store.set('count', 4)
    expect(store.check('count < 5')).toBe(true)
  })

  it("'count < 5' returns false when count is 5", () => {
    store.set('count', 5)
    expect(store.check('count < 5')).toBe(false)
  })

  it("'count < 5' returns false when count is 6", () => {
    store.set('count', 6)
    expect(store.check('count < 5')).toBe(false)
  })

  it("'count >= 5' returns true when count is 5", () => {
    store.set('count', 5)
    expect(store.check('count >= 5')).toBe(true)
  })

  it("'count >= 5' returns true when count is 6", () => {
    store.set('count', 6)
    expect(store.check('count >= 5')).toBe(true)
  })

  it("'count >= 5' returns false when count is 4", () => {
    store.set('count', 4)
    expect(store.check('count >= 5')).toBe(false)
  })

  it("'count <= 5' returns true when count is 5", () => {
    store.set('count', 5)
    expect(store.check('count <= 5')).toBe(true)
  })

  it("'count <= 5' returns true when count is 4", () => {
    store.set('count', 4)
    expect(store.check('count <= 5')).toBe(true)
  })

  it("'count <= 5' returns false when count is 6", () => {
    store.set('count', 6)
    expect(store.check('count <= 5')).toBe(false)
  })

  it("'count > -5' works with negative numbers", () => {
    store.set('count', -3)
    expect(store.check('count > -5')).toBe(true)
  })

  it("'count < -5' works with negative numbers", () => {
    store.set('count', -7)
    expect(store.check('count < -5')).toBe(true)
  })

  it("'count >= 0' boundary check", () => {
    store.set('count', 0)
    expect(store.check('count >= 0')).toBe(true)
  })

  it("'count > 0.5' works with floats", () => {
    store.set('count', 1)
    expect(store.check('count > 0.5')).toBe(true)
  })

  it("'count <= 3.14159' works with floats", () => {
    store.set('count', 3)
    expect(store.check('count <= 3.14159')).toBe(true)
  })
})

describe('store.check(condition) - String Equality (Decision 5.5: == and != only)', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('\'name == "alice"\' returns true when name is "alice"', () => {
    store.set('name', 'alice')
    expect(store.check('name == "alice"')).toBe(true)
  })

  it('\'name == "alice"\' returns false when name is "bob"', () => {
    store.set('name', 'bob')
    expect(store.check('name == "alice"')).toBe(false)
  })

  it('\'name == "alice"\' is case-sensitive (false for "Alice")', () => {
    store.set('name', 'Alice')
    expect(store.check('name == "alice"')).toBe(false)
  })

  it('\'name == ""\' returns true when name is empty string', () => {
    store.set('name', '')
    expect(store.check('name == ""')).toBe(true)
  })

  it('\'name != "alice"\' returns true when name is "bob"', () => {
    store.set('name', 'bob')
    expect(store.check('name != "alice"')).toBe(true)
  })

  it('\'name != "alice"\' returns false when name is "alice"', () => {
    store.set('name', 'alice')
    expect(store.check('name != "alice"')).toBe(false)
  })

  describe('Quote Styles (Decision 5.6)', () => {
    it('\'name == "alice"\' works with double quotes', () => {
      store.set('name', 'alice')
      expect(store.check('name == "alice"')).toBe(true)
    })

    it('"name == \'alice\'" works with single quotes', () => {
      store.set('name', 'alice')
      expect(store.check("name == 'alice'")).toBe(true)
    })

    it("'name == \"it's\"' works with escaped single quote in double-quoted string", () => {
      store.set('name', "it's")
      expect(store.check('name == "it\'s"')).toBe(true)
    })

    it('"name == \'say "hi"\'" works with escaped double quote in single-quoted string', () => {
      store.set('name', 'say "hi"')
      expect(store.check('name == \'say "hi"\'')).toBe(true)
    })
  })

  describe('Escaped Quotes (Decision 5.7)', () => {
    it('\'msg == "He said \\"hello\\""\' matches string with embedded quotes', () => {
      store.set('msg', 'He said "hello"')
      expect(store.check('msg == "He said \\"hello\\""')).toBe(true)
    })

    it("\"msg == 'It\\'s fine'\" matches string with embedded apostrophe", () => {
      store.set('msg', "It's fine")
      expect(store.check("msg == 'It\\'s fine'")).toBe(true)
    })
  })
})

describe('store.check(condition) - Logical Operators', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  describe('AND', () => {
    it("'a AND b' returns true when both true", () => {
      store.set('a', true)
      store.set('b', true)
      expect(store.check('a AND b')).toBe(true)
    })

    it("'a AND b' returns false when a is false", () => {
      store.set('a', false)
      store.set('b', true)
      expect(store.check('a AND b')).toBe(false)
    })

    it("'a AND b' returns false when b is false", () => {
      store.set('a', true)
      store.set('b', false)
      expect(store.check('a AND b')).toBe(false)
    })

    it("'a AND b' returns false when both false", () => {
      store.set('a', false)
      store.set('b', false)
      expect(store.check('a AND b')).toBe(false)
    })

    it("'a and b' works (case-insensitive)", () => {
      store.set('a', true)
      store.set('b', true)
      expect(store.check('a and b')).toBe(true)
    })

    it("'a And b' works (case-insensitive)", () => {
      store.set('a', true)
      store.set('b', true)
      expect(store.check('a And b')).toBe(true)
    })
  })

  describe('OR', () => {
    it("'a OR b' returns true when both true", () => {
      store.set('a', true)
      store.set('b', true)
      expect(store.check('a OR b')).toBe(true)
    })

    it("'a OR b' returns true when only a is true", () => {
      store.set('a', true)
      store.set('b', false)
      expect(store.check('a OR b')).toBe(true)
    })

    it("'a OR b' returns true when only b is true", () => {
      store.set('a', false)
      store.set('b', true)
      expect(store.check('a OR b')).toBe(true)
    })

    it("'a OR b' returns false when both false", () => {
      store.set('a', false)
      store.set('b', false)
      expect(store.check('a OR b')).toBe(false)
    })

    it("'a or b' works (case-insensitive)", () => {
      store.set('a', true)
      store.set('b', false)
      expect(store.check('a or b')).toBe(true)
    })

    it("'a Or b' works (case-insensitive)", () => {
      store.set('a', true)
      store.set('b', false)
      expect(store.check('a Or b')).toBe(true)
    })
  })

  describe('Chained Operators', () => {
    it("'a AND b AND c' requires all three true", () => {
      store.set('a', true)
      store.set('b', true)
      store.set('c', true)
      expect(store.check('a AND b AND c')).toBe(true)
    })

    it("'a AND b AND c' returns false if any one is false", () => {
      store.set('a', true)
      store.set('b', false)
      store.set('c', true)
      expect(store.check('a AND b AND c')).toBe(false)
    })

    it("'a OR b OR c' returns true if any one is true", () => {
      store.set('a', false)
      store.set('b', true)
      store.set('c', false)
      expect(store.check('a OR b OR c')).toBe(true)
    })

    it("'a OR b OR c' returns false only if all are false", () => {
      store.set('a', false)
      store.set('b', false)
      store.set('c', false)
      expect(store.check('a OR b OR c')).toBe(false)
    })
  })

  describe('Operator Precedence (AND higher than OR)', () => {
    it("'a AND b OR c' with a=T, b=F, c=T returns true (c is true)", () => {
      store.set('a', true)
      store.set('b', false)
      store.set('c', true)
      expect(store.check('a AND b OR c')).toBe(true)
    })

    it("'a AND b OR c' with a=T, b=F, c=F returns false", () => {
      store.set('a', true)
      store.set('b', false)
      store.set('c', false)
      expect(store.check('a AND b OR c')).toBe(false)
    })

    it("'a OR b AND c' with a=F, b=T, c=T returns true (b AND c is true)", () => {
      store.set('a', false)
      store.set('b', true)
      store.set('c', true)
      expect(store.check('a OR b AND c')).toBe(true)
    })

    it("'a OR b AND c' with a=F, b=T, c=F returns false", () => {
      store.set('a', false)
      store.set('b', true)
      store.set('c', false)
      expect(store.check('a OR b AND c')).toBe(false)
    })

    it("'a AND b OR c AND d' evaluates as '(a AND b) OR (c AND d)'", () => {
      store.set('a', false)
      store.set('b', true)
      store.set('c', true)
      store.set('d', true)
      expect(store.check('a AND b OR c AND d')).toBe(true)
    })
  })

  describe('Parentheses Override Precedence', () => {
    it("'(a OR b) AND c' with a=T, b=F, c=F returns false", () => {
      store.set('a', true)
      store.set('b', false)
      store.set('c', false)
      expect(store.check('(a OR b) AND c')).toBe(false)
    })

    it("'(a OR b) AND c' with a=T, b=F, c=T returns true", () => {
      store.set('a', true)
      store.set('b', false)
      store.set('c', true)
      expect(store.check('(a OR b) AND c')).toBe(true)
    })

    it("'a AND (b OR c)' with a=T, b=F, c=T returns true", () => {
      store.set('a', true)
      store.set('b', false)
      store.set('c', true)
      expect(store.check('a AND (b OR c)')).toBe(true)
    })

    it("'a AND (b OR c)' with a=T, b=F, c=F returns false", () => {
      store.set('a', true)
      store.set('b', false)
      store.set('c', false)
      expect(store.check('a AND (b OR c)')).toBe(false)
    })

    it("'NOT (a AND b)' with a=T, b=T returns false", () => {
      store.set('a', true)
      store.set('b', true)
      expect(store.check('NOT (a AND b)')).toBe(false)
    })

    it("'NOT (a AND b)' with a=T, b=F returns true", () => {
      store.set('a', true)
      store.set('b', false)
      expect(store.check('NOT (a AND b)')).toBe(true)
    })

    it("'!(a OR b)' with a=F, b=F returns true", () => {
      store.set('a', false)
      store.set('b', false)
      expect(store.check('!(a OR b)')).toBe(true)
    })

    it("'!(a OR b)' with a=T, b=F returns false", () => {
      store.set('a', true)
      store.set('b', false)
      expect(store.check('!(a OR b)')).toBe(false)
    })
  })

  describe('Nested Parentheses', () => {
    it("'((a AND b) OR c) AND d' evaluates correctly", () => {
      store.set('a', true)
      store.set('b', true)
      store.set('c', false)
      store.set('d', true)
      expect(store.check('((a AND b) OR c) AND d')).toBe(true)
    })

    it("'(a AND (b OR (c AND d)))' evaluates correctly", () => {
      store.set('a', true)
      store.set('b', false)
      store.set('c', true)
      store.set('d', true)
      expect(store.check('(a AND (b OR (c AND d)))')).toBe(true)
    })

    it('deeply nested parentheses (5+ levels) work correctly', () => {
      store.set('a', true)
      store.set('b', true)
      store.set('c', true)
      store.set('d', true)
      store.set('e', true)
      expect(store.check('(((((a) AND b) AND c) AND d) AND e)')).toBe(true)
    })
  })
})

describe('store.check(condition) - Complex Conditions', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it("'(has_key OR has_lockpick) AND !alarm_triggered'", () => {
    store.set('has_key', false)
    store.set('has_lockpick', true)
    store.set('alarm_triggered', false)
    expect(store.check('(has_key OR has_lockpick) AND !alarm_triggered')).toBe(true)
  })

  it("'gold >= 100 AND reputation > 50 AND NOT is_banished'", () => {
    store.set('gold', 150)
    store.set('reputation', 75)
    store.set('is_banished', false)
    expect(store.check('gold >= 100 AND reputation > 50 AND NOT is_banished')).toBe(true)
  })

  it('\'level >= 5 AND (class == "warrior" OR class == "paladin")\'', () => {
    store.set('level', 10)
    store.set('class', 'paladin')
    expect(store.check('level >= 5 AND (class == "warrior" OR class == "paladin")')).toBe(true)
  })

  it("'health > 0 AND health <= 100' (range check)", () => {
    store.set('health', 50)
    expect(store.check('health > 0 AND health <= 100')).toBe(true)
  })

  it("'(a == 1 OR a == 2 OR a == 3) AND b' (multiple equality checks)", () => {
    store.set('a', 2)
    store.set('b', true)
    expect(store.check('(a == 1 OR a == 2 OR a == 3) AND b')).toBe(true)
  })

  it("'score > 100 AND (bonus == true OR multiplier >= 2)'", () => {
    store.set('score', 150)
    store.set('bonus', false)
    store.set('multiplier', 3)
    expect(store.check('score > 100 AND (bonus == true OR multiplier >= 2)')).toBe(true)
  })
})

describe('store.check(condition) - Edge Cases', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  describe('Missing Flags (Decision 5.3: treated as 0)', () => {
    it("'nonexistent' returns false (0 is falsy)", () => {
      expect(store.check('nonexistent')).toBe(false)
    })

    it("'existing AND nonexistent' returns false", () => {
      store.set('existing', true)
      expect(store.check('existing AND nonexistent')).toBe(false)
    })

    it("'existing OR nonexistent' returns true if existing is true", () => {
      store.set('existing', true)
      expect(store.check('existing OR nonexistent')).toBe(true)
    })

    it("'missing > 5' returns false (0 > 5 is false)", () => {
      expect(store.check('missing > 5')).toBe(false)
    })

    it("'missing < 5' returns true (0 < 5 is true)", () => {
      expect(store.check('missing < 5')).toBe(true)
    })

    it("'missing == 0' returns true (0 == 0 is true)", () => {
      expect(store.check('missing == 0')).toBe(true)
    })

    it("'missing >= 0' returns true (0 >= 0 is true)", () => {
      expect(store.check('missing >= 0')).toBe(true)
    })

    it("'missing != 0' returns false (0 != 0 is false)", () => {
      expect(store.check('missing != 0')).toBe(false)
    })

    it("'missing <= -1' returns false (0 <= -1 is false)", () => {
      expect(store.check('missing <= -1')).toBe(false)
    })
  })

  describe('Type Mismatches (Decision 5.4: return false)', () => {
    it("'boolFlag > 5' returns false when boolFlag is true", () => {
      store.set('boolFlag', true)
      expect(store.check('boolFlag > 5')).toBe(false)
    })

    it("'boolFlag < 5' returns false when boolFlag is false", () => {
      store.set('boolFlag', false)
      expect(store.check('boolFlag < 5')).toBe(false)
    })

    it("'stringFlag > 5' returns false", () => {
      store.set('stringFlag', 'hello')
      expect(store.check('stringFlag > 5')).toBe(false)
    })

    it("'stringFlag >= 100' returns false", () => {
      store.set('stringFlag', 'hello')
      expect(store.check('stringFlag >= 100')).toBe(false)
    })

    it('\'numericFlag == "5"\' returns false (number vs string)', () => {
      store.set('numericFlag', 5)
      expect(store.check('numericFlag == "5"')).toBe(false)
    })

    it("'stringFlag == 5' returns false (string vs number)", () => {
      store.set('stringFlag', '5')
      expect(store.check('stringFlag == 5')).toBe(false)
    })

    it("'boolFlag == 1' returns false (boolean vs number)", () => {
      store.set('boolFlag', true)
      expect(store.check('boolFlag == 1')).toBe(false)
    })

    it('\'boolFlag == "true"\' returns false (boolean vs string)', () => {
      store.set('boolFlag', true)
      expect(store.check('boolFlag == "true"')).toBe(false)
    })
  })

  describe('String Ordering Not Supported (Decision 5.5: throws ParseError)', () => {
    it('\'name > "alice"\' throws ParseError with message indicating ordering not supported for strings', () => {
      store.set('name', 'bob')
      expect(() => store.check('name > "alice"')).toThrow(ParseError)
      expect(() => store.check('name > "alice"')).toThrow(/ordering not supported for strings/)
    })

    it('\'name < "zebra"\' throws ParseError', () => {
      store.set('name', 'alice')
      expect(() => store.check('name < "zebra"')).toThrow(ParseError)
    })

    it('\'name >= "a"\' throws ParseError', () => {
      store.set('name', 'alice')
      expect(() => store.check('name >= "a"')).toThrow(ParseError)
    })

    it('\'name <= "z"\' throws ParseError', () => {
      store.set('name', 'alice')
      expect(() => store.check('name <= "z"')).toThrow(ParseError)
    })
  })

  describe('Whitespace Handling', () => {
    it("'a AND b' works (single space)", () => {
      store.set('a', true)
      store.set('b', true)
      expect(store.check('a AND b')).toBe(true)
    })

    it("'a  AND  b' works (multiple spaces)", () => {
      store.set('a', true)
      store.set('b', true)
      expect(store.check('a  AND  b')).toBe(true)
    })

    it("'  a AND b  ' works (leading/trailing whitespace)", () => {
      store.set('a', true)
      store.set('b', true)
      expect(store.check('  a AND b  ')).toBe(true)
    })

    it("'a\\tAND\\tb' works (tabs)", () => {
      store.set('a', true)
      store.set('b', true)
      expect(store.check('a\tAND\tb')).toBe(true)
    })

    it("'a\\nAND\\nb' works (newlines)", () => {
      store.set('a', true)
      store.set('b', true)
      expect(store.check('a\nAND\nb')).toBe(true)
    })
  })

  describe('Case Sensitivity', () => {
    it("flag names are case-sensitive: 'Flag' != 'flag'", () => {
      store.set('flag', true)
      store.set('Flag', false)
      expect(store.check('flag')).toBe(true)
      expect(store.check('Flag')).toBe(false)
    })

    it('operators are case-insensitive: AND, and, And all work', () => {
      store.set('a', true)
      store.set('b', true)
      expect(store.check('a AND b')).toBe(true)
      expect(store.check('a and b')).toBe(true)
      expect(store.check('a And b')).toBe(true)
    })

    it('boolean literals are case-insensitive: true, TRUE, True all work', () => {
      store.set('flag', true)
      expect(store.check('flag == true')).toBe(true)
      expect(store.check('flag == TRUE')).toBe(true)
      expect(store.check('flag == True')).toBe(true)
    })

    it('string comparisons are case-sensitive: "Alice" != "alice"', () => {
      store.set('name', 'Alice')
      expect(store.check('name == "Alice"')).toBe(true)
      expect(store.check('name == "alice"')).toBe(false)
    })
  })

  describe('Empty/Invalid Conditions (Decision 5.2: throw)', () => {
    it('check(\'\') throws ParseError with message "Condition cannot be empty"', () => {
      expect(() => store.check('')).toThrow(ParseError)
      expect(() => store.check('')).toThrow(/Condition cannot be empty/)
    })

    it('check(\'   \') throws ParseError with message "Condition cannot be empty"', () => {
      expect(() => store.check('   ')).toThrow(ParseError)
      expect(() => store.check('   ')).toThrow(/Condition cannot be empty/)
    })

    it("check('AND') throws ParseError (operator without operands)", () => {
      expect(() => store.check('AND')).toThrow(ParseError)
    })

    it("check('a AND') throws ParseError (incomplete expression)", () => {
      expect(() => store.check('a AND')).toThrow(ParseError)
    })

    it("check('AND b') throws ParseError (incomplete expression)", () => {
      expect(() => store.check('AND b')).toThrow(ParseError)
    })

    it("check('a AND AND b') throws ParseError (consecutive operators)", () => {
      expect(() => store.check('a AND AND b')).toThrow(ParseError)
    })

    it("check('(a AND b') throws ParseError (unclosed parenthesis)", () => {
      expect(() => store.check('(a AND b')).toThrow(ParseError)
    })

    it("check('a AND b)') throws ParseError (unmatched closing parenthesis)", () => {
      expect(() => store.check('a AND b)')).toThrow(ParseError)
    })

    it("check('()') throws ParseError (empty parentheses)", () => {
      expect(() => store.check('()')).toThrow(ParseError)
    })

    it("check('a == ') throws ParseError (missing value)", () => {
      expect(() => store.check('a == ')).toThrow(ParseError)
    })

    it("check('== 5') throws ParseError (missing flag name)", () => {
      expect(() => store.check('== 5')).toThrow(ParseError)
    })

    it("check('a >> 5') throws ParseError (invalid operator)", () => {
      expect(() => store.check('a >> 5')).toThrow(ParseError)
    })

    it("check('a === 5') throws ParseError (invalid operator)", () => {
      expect(() => store.check('a === 5')).toThrow(ParseError)
    })
  })
})
