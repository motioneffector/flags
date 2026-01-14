// Test Runner and Tests for the demo page
import { createFlagStore, ValidationError, ParseError } from '../dist/index.js'

// ============================================
// TEST RUNNER
// ============================================

const testRunner = {
  tests: [],
  results: [],
  running: false,

  register(name, fn) {
    this.tests.push({ name, fn })
  },

  async run() {
    if (this.running) return
    this.running = true
    this.results = []

    const output = document.getElementById('test-output')
    const progressFill = document.getElementById('progress-fill')
    const progressText = document.getElementById('progress-text')
    const summary = document.getElementById('test-summary')
    const passedCount = document.getElementById('passed-count')
    const failedCount = document.getElementById('failed-count')
    const skippedCount = document.getElementById('skipped-count')
    const runBtn = document.getElementById('run-tests')

    runBtn.disabled = true
    output.innerHTML = ''
    summary.classList.add('hidden')
    progressFill.style.width = '0%'
    progressFill.className = 'test-progress-fill'

    let passed = 0
    let failed = 0

    for (let i = 0; i < this.tests.length; i++) {
      const test = this.tests[i]
      const progress = ((i + 1) / this.tests.length) * 100

      progressFill.style.width = `${progress}%`
      progressText.textContent = `Running: ${test.name}`

      try {
        await test.fn()
        passed++
        this.results.push({ name: test.name, passed: true })
        output.innerHTML += `
          <div class="test-item">
            <span class="test-icon pass">✓</span>
            <span class="test-name">${escapeHtml(test.name)}</span>
          </div>
        `
      } catch (e) {
        failed++
        this.results.push({ name: test.name, passed: false, error: e.message })
        output.innerHTML += `
          <div class="test-item">
            <span class="test-icon fail">✗</span>
            <div>
              <div class="test-name">${escapeHtml(test.name)}</div>
              <div class="test-error">${escapeHtml(e.message)}</div>
            </div>
          </div>
        `
      }

      // Scroll to bottom
      output.scrollTop = output.scrollHeight

      // Small delay so user can see progress
      await new Promise(r => setTimeout(r, 15))
    }

    progressFill.classList.add(failed === 0 ? 'success' : 'failure')
    progressText.textContent = `Complete: ${passed}/${this.tests.length} passed`

    passedCount.textContent = passed
    failedCount.textContent = failed
    skippedCount.textContent = 0
    summary.classList.remove('hidden')

    runBtn.disabled = false
    this.running = false
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ============================================
// ASSERTION HELPERS
// ============================================

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed')
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`)
  }
}

function assertThrows(fn, errorType, message) {
  try {
    fn()
    throw new Error(message || `Expected ${errorType?.name || 'error'} to be thrown`)
  } catch (e) {
    if (errorType && !(e instanceof errorType)) {
      throw new Error(message || `Expected ${errorType.name}, got ${e.constructor.name}`)
    }
  }
}

// ============================================
// REGISTER TESTS
// ============================================

// Basic Store Creation
testRunner.register('creates empty store with no arguments', () => {
  const store = createFlagStore()
  assert(store !== undefined, 'Store should be defined')
  assertEqual(typeof store.get, 'function')
  assertEqual(typeof store.set, 'function')
})

testRunner.register('creates store with initial boolean values', () => {
  const store = createFlagStore({ initial: { flag: true } })
  assertEqual(store.get('flag'), true)
})

testRunner.register('creates store with initial numeric values', () => {
  const store = createFlagStore({ initial: { count: 42 } })
  assertEqual(store.get('count'), 42)
})

testRunner.register('creates store with initial string values', () => {
  const store = createFlagStore({ initial: { name: 'test' } })
  assertEqual(store.get('name'), 'test')
})

// Setting Values
testRunner.register('store.set() sets boolean values', () => {
  const store = createFlagStore()
  store.set('flag', true)
  assertEqual(store.get('flag'), true)
  store.set('flag', false)
  assertEqual(store.get('flag'), false)
})

testRunner.register('store.set() sets numeric values', () => {
  const store = createFlagStore()
  store.set('count', 42)
  assertEqual(store.get('count'), 42)
})

testRunner.register('store.set() sets string values', () => {
  const store = createFlagStore()
  store.set('name', 'alice')
  assertEqual(store.get('name'), 'alice')
})

testRunner.register('store.set(key, null) removes the key', () => {
  const store = createFlagStore()
  store.set('key', 'value')
  store.set('key', null)
  assertEqual(store.has('key'), false)
})

testRunner.register('store.set() returns store for chaining', () => {
  const store = createFlagStore()
  const result = store.set('a', 1)
  assertEqual(result, store)
})

// Getting Values
testRunner.register('store.get() returns undefined for non-existent key', () => {
  const store = createFlagStore()
  assertEqual(store.get('nonexistent'), undefined)
})

testRunner.register('store.get() returns stored values', () => {
  const store = createFlagStore({ initial: { x: 10 } })
  assertEqual(store.get('x'), 10)
})

// Has
testRunner.register('store.has() returns true for existing keys', () => {
  const store = createFlagStore({ initial: { flag: false } })
  assertEqual(store.has('flag'), true)
})

testRunner.register('store.has() returns false for non-existent keys', () => {
  const store = createFlagStore()
  assertEqual(store.has('nonexistent'), false)
})

// Delete
testRunner.register('store.delete() removes keys', () => {
  const store = createFlagStore()
  store.set('key', 'value')
  store.delete('key')
  assertEqual(store.has('key'), false)
})

// Clear
testRunner.register('store.clear() removes all flags', () => {
  const store = createFlagStore({ initial: { a: 1, b: 2, c: 3 } })
  store.clear()
  assertEqual(Object.keys(store.all()).length, 0)
})

// Toggle
testRunner.register('store.toggle() toggles boolean from true to false', () => {
  const store = createFlagStore({ initial: { flag: true } })
  store.toggle('flag')
  assertEqual(store.get('flag'), false)
})

testRunner.register('store.toggle() toggles boolean from false to true', () => {
  const store = createFlagStore({ initial: { flag: false } })
  store.toggle('flag')
  assertEqual(store.get('flag'), true)
})

testRunner.register('store.toggle() on non-existent key sets to true', () => {
  const store = createFlagStore()
  store.toggle('newFlag')
  assertEqual(store.get('newFlag'), true)
})

testRunner.register('store.toggle() throws for non-boolean values', () => {
  const store = createFlagStore({ initial: { count: 42 } })
  assertThrows(() => store.toggle('count'), TypeError)
})

// Increment/Decrement
testRunner.register('store.increment() increments by 1 by default', () => {
  const store = createFlagStore({ initial: { count: 10 } })
  store.increment('count')
  assertEqual(store.get('count'), 11)
})

testRunner.register('store.increment() increments by specified amount', () => {
  const store = createFlagStore({ initial: { count: 10 } })
  store.increment('count', 5)
  assertEqual(store.get('count'), 15)
})

testRunner.register('store.increment() auto-initializes to amount', () => {
  const store = createFlagStore()
  store.increment('newCount', 5)
  assertEqual(store.get('newCount'), 5)
})

testRunner.register('store.decrement() decrements by 1 by default', () => {
  const store = createFlagStore({ initial: { count: 10 } })
  store.decrement('count')
  assertEqual(store.get('count'), 9)
})

testRunner.register('store.decrement() decrements by specified amount', () => {
  const store = createFlagStore({ initial: { count: 10 } })
  store.decrement('count', 5)
  assertEqual(store.get('count'), 5)
})

// All and Keys
testRunner.register('store.all() returns all flags', () => {
  const store = createFlagStore({ initial: { a: 1, b: 2 } })
  const all = store.all()
  assertEqual(all.a, 1)
  assertEqual(all.b, 2)
})

testRunner.register('store.keys() returns all flag keys', () => {
  const store = createFlagStore({ initial: { a: 1, b: 2 } })
  const keys = store.keys()
  assert(keys.includes('a'))
  assert(keys.includes('b'))
})

// SetMany
testRunner.register('store.setMany() sets multiple values', () => {
  const store = createFlagStore()
  store.setMany({ a: 1, b: 2, c: 3 })
  assertEqual(store.get('a'), 1)
  assertEqual(store.get('b'), 2)
  assertEqual(store.get('c'), 3)
})

// Condition Checks
testRunner.register('store.check() returns true for truthy flag', () => {
  const store = createFlagStore({ initial: { flag: true } })
  assertEqual(store.check('flag'), true)
})

testRunner.register('store.check() returns false for falsy flag', () => {
  const store = createFlagStore({ initial: { flag: false } })
  assertEqual(store.check('flag'), false)
})

testRunner.register('store.check() returns false for non-existent flag', () => {
  const store = createFlagStore()
  assertEqual(store.check('nonexistent'), false)
})

testRunner.register('store.check() handles AND operator', () => {
  const store = createFlagStore({ initial: { a: true, b: true, c: false } })
  assertEqual(store.check('a AND b'), true)
  assertEqual(store.check('a AND c'), false)
})

testRunner.register('store.check() handles OR operator', () => {
  const store = createFlagStore({ initial: { a: true, b: false } })
  assertEqual(store.check('a OR b'), true)
  assertEqual(store.check('b OR a'), true)
})

testRunner.register('store.check() handles NOT operator', () => {
  const store = createFlagStore({ initial: { flag: true } })
  assertEqual(store.check('NOT flag'), false)
  assertEqual(store.check('!flag'), false)
})

testRunner.register('store.check() handles comparison operators', () => {
  const store = createFlagStore({ initial: { count: 10 } })
  assertEqual(store.check('count >= 10'), true)
  assertEqual(store.check('count > 10'), false)
  assertEqual(store.check('count == 10'), true)
  assertEqual(store.check('count < 20'), true)
})

testRunner.register('store.check() handles complex expressions', () => {
  const store = createFlagStore({ initial: { gold: 100, level: 5, has_key: true } })
  assertEqual(store.check('gold >= 100 AND level >= 5'), true)
  assertEqual(store.check('has_key AND (gold >= 50 OR level >= 10)'), true)
})

// Subscriptions
testRunner.register('store.subscribe() is called on changes', () => {
  const store = createFlagStore()
  let called = false
  store.subscribe(() => { called = true })
  store.set('flag', true)
  assertEqual(called, true)
})

testRunner.register('store.subscribeKey() only fires for specific key', () => {
  const store = createFlagStore()
  let calledForA = false
  let calledForB = false
  store.subscribeKey('a', () => { calledForA = true })
  store.subscribeKey('b', () => { calledForB = true })
  store.set('a', 1)
  assertEqual(calledForA, true)
  assertEqual(calledForB, false)
})

testRunner.register('unsubscribe function stops notifications', () => {
  const store = createFlagStore()
  let callCount = 0
  const unsubscribe = store.subscribe(() => { callCount++ })
  store.set('a', 1)
  unsubscribe()
  store.set('b', 2)
  assertEqual(callCount, 1)
})

// Namespaces
testRunner.register('store.namespace() creates scoped view', () => {
  const store = createFlagStore()
  const ns = store.namespace('player')
  ns.set('health', 100)
  assertEqual(store.get('player.health'), 100)
})

testRunner.register('namespaced store.get() reads from prefix', () => {
  const store = createFlagStore({ initial: { 'player.gold': 50 } })
  const ns = store.namespace('player')
  assertEqual(ns.get('gold'), 50)
})

// Batch Operations
testRunner.register('store.batch() groups changes', () => {
  const store = createFlagStore()
  let notifyCount = 0
  store.subscribe(() => { notifyCount++ })
  store.batch(() => {
    store.set('a', 1)
    store.set('b', 2)
    store.set('c', 3)
  })
  assertEqual(notifyCount, 1) // Single notification
})

testRunner.register('store.batch() rolls back on error', () => {
  const store = createFlagStore({ initial: { count: 0 } })
  try {
    store.batch(() => {
      store.set('count', 100)
      throw new Error('Oops')
    })
  } catch (e) {}
  assertEqual(store.get('count'), 0) // Rolled back
})

// History
testRunner.register('store with history supports undo', () => {
  const store = createFlagStore({ history: true })
  store.set('count', 1)
  store.set('count', 2)
  store.undo()
  assertEqual(store.get('count'), 1)
})

testRunner.register('store with history supports redo', () => {
  const store = createFlagStore({ history: true })
  store.set('count', 1)
  store.set('count', 2)
  store.undo()
  store.redo()
  assertEqual(store.get('count'), 2)
})

testRunner.register('store.canUndo() reflects history state', () => {
  const store = createFlagStore({ history: true })
  assertEqual(store.canUndo(), false)
  store.set('x', 1)
  assertEqual(store.canUndo(), true)
})

testRunner.register('store.canRedo() reflects redo state', () => {
  const store = createFlagStore({ history: true })
  store.set('x', 1)
  assertEqual(store.canRedo(), false)
  store.undo()
  assertEqual(store.canRedo(), true)
})

// Computed Flags
testRunner.register('store.compute() creates derived values', () => {
  const store = createFlagStore({ initial: { a: 5, b: 3 } })
  store.compute('sum', ['a', 'b'], (a, b) => a + b)
  assertEqual(store.get('sum'), 8)
})

testRunner.register('computed values update when dependencies change', () => {
  const store = createFlagStore({ initial: { a: 5, b: 3 } })
  store.compute('sum', ['a', 'b'], (a, b) => a + b)
  store.set('a', 10)
  assertEqual(store.get('sum'), 13)
})

// Validation
testRunner.register('rejects empty string keys', () => {
  const store = createFlagStore()
  assertThrows(() => store.set('', 'value'), ValidationError)
})

testRunner.register('rejects keys with spaces', () => {
  const store = createFlagStore()
  assertThrows(() => store.set('my flag', 'value'), ValidationError)
})

testRunner.register('rejects reserved word keys (AND, OR, NOT)', () => {
  const store = createFlagStore()
  assertThrows(() => store.set('AND', true), ValidationError)
  assertThrows(() => store.set('OR', true), ValidationError)
  assertThrows(() => store.set('NOT', true), ValidationError)
})

testRunner.register('rejects NaN values', () => {
  const store = createFlagStore()
  assertThrows(() => store.set('key', NaN), ValidationError)
})

testRunner.register('rejects Infinity values', () => {
  const store = createFlagStore()
  assertThrows(() => store.set('key', Infinity), ValidationError)
})

// ============================================
// INITIALIZE
// ============================================

export function initTests() {
  document.getElementById('run-tests').addEventListener('click', () => testRunner.run())
}
