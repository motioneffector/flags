// Tests for @motioneffector/flags demo

// Import library to ensure it's available (also set by demo.js)
import * as Library from '../dist/index.js'
if (!window.Library) window.Library = Library

// ============================================
// DEMO INTEGRITY TESTS
// These tests verify the demo itself is correctly structured.
// They are IDENTICAL across all @motioneffector demos.
// Do not modify, skip, or weaken these tests.
// ============================================

function registerIntegrityTests() {
  // ─────────────────────────────────────────────
  // STRUCTURAL INTEGRITY
  // ─────────────────────────────────────────────

  testRunner.registerTest('[Integrity] Library is loaded', () => {
    if (typeof window.Library === 'undefined') {
      throw new Error('window.Library is undefined - library not loaded')
    }
  })

  testRunner.registerTest('[Integrity] Library has exports', () => {
    const exports = Object.keys(window.Library)
    if (exports.length === 0) {
      throw new Error('window.Library has no exports')
    }
  })

  testRunner.registerTest('[Integrity] Test runner exists', () => {
    const runner = document.getElementById('test-runner')
    if (!runner) {
      throw new Error('No element with id="test-runner"')
    }
  })

  testRunner.registerTest('[Integrity] Test runner is first section after header', () => {
    const main = document.querySelector('main')
    if (!main) {
      throw new Error('No <main> element found')
    }
    const firstSection = main.querySelector('section')
    if (!firstSection || firstSection.id !== 'test-runner') {
      throw new Error('Test runner must be the first <section> inside <main>')
    }
  })

  testRunner.registerTest('[Integrity] Run All Tests button exists with correct format', () => {
    const btn = document.getElementById('run-all-tests')
    if (!btn) {
      throw new Error('No button with id="run-all-tests"')
    }
    const text = btn.textContent.trim()
    if (!text.includes('Run All Tests')) {
      throw new Error(`Button text must include "Run All Tests", got: "${text}"`)
    }
    const icon = btn.querySelector('.btn-icon')
    if (!icon || !icon.textContent.includes('▶')) {
      throw new Error('Button must have play icon (▶) in .btn-icon element')
    }
  })

  testRunner.registerTest('[Integrity] At least one exhibit exists', () => {
    const exhibits = document.querySelectorAll('.exhibit')
    if (exhibits.length === 0) {
      throw new Error('No elements with class="exhibit"')
    }
  })

  testRunner.registerTest('[Integrity] All exhibits have unique IDs', () => {
    const exhibits = document.querySelectorAll('.exhibit')
    const ids = new Set()
    exhibits.forEach(ex => {
      if (!ex.id) {
        throw new Error('Exhibit missing id attribute')
      }
      if (ids.has(ex.id)) {
        throw new Error(`Duplicate exhibit id: ${ex.id}`)
      }
      ids.add(ex.id)
    })
  })

  testRunner.registerTest('[Integrity] All exhibits registered for walkthrough', () => {
    const exhibitElements = document.querySelectorAll('.exhibit')
    const registeredCount = testRunner.exhibits.length
    if (registeredCount < exhibitElements.length) {
      throw new Error(
        `Only ${registeredCount} exhibits registered for walkthrough, ` +
        `but ${exhibitElements.length} .exhibit elements exist`
      )
    }
  })

  testRunner.registerTest('[Integrity] CSS loaded from demo-files/', () => {
    const links = document.querySelectorAll('link[rel="stylesheet"]')
    const hasExternal = Array.from(links).some(link =>
      link.href.includes('demo-files/')
    )
    if (!hasExternal) {
      throw new Error('No stylesheet loaded from demo-files/ directory')
    }
  })

  testRunner.registerTest('[Integrity] No inline style tags', () => {
    const styles = document.querySelectorAll('style')
    if (styles.length > 0) {
      throw new Error(`Found ${styles.length} inline <style> tags - extract to demo-files/demo.css`)
    }
  })

  testRunner.registerTest('[Integrity] No inline onclick handlers', () => {
    const withOnclick = document.querySelectorAll('[onclick]')
    if (withOnclick.length > 0) {
      throw new Error(`Found ${withOnclick.length} elements with onclick - use addEventListener`)
    }
  })

  // ─────────────────────────────────────────────
  // NO AUTO-PLAY VERIFICATION
  // ─────────────────────────────────────────────

  testRunner.registerTest('[Integrity] Output areas are empty on load', () => {
    const outputs = document.querySelectorAll('.exhibit-output, .output, [data-output]')
    outputs.forEach(output => {
      const hasPlaceholder = output.dataset.placeholder ||
        output.classList.contains('placeholder') ||
        output.querySelector('.placeholder')

      const text = output.textContent.trim()
      const children = output.children.length

      if ((text.length > 50 || children > 1) && !hasPlaceholder) {
        throw new Error(
          `Output area appears pre-populated: "${text.substring(0, 50)}..." - ` +
          `outputs must be empty until user interaction`
        )
      }
    })
  })

  testRunner.registerTest('[Integrity] No setTimeout calls on module load', () => {
    if (window.__suspiciousTimersDetected) {
      throw new Error(
        'Detected setTimeout/setInterval during page load - ' +
        'demos must not auto-run'
      )
    }
  })

  // ─────────────────────────────────────────────
  // REAL LIBRARY VERIFICATION
  // ─────────────────────────────────────────────

  testRunner.registerTest('[Integrity] Library functions are callable', () => {
    const lib = window.Library
    const exports = Object.keys(lib)

    const hasFunctions = exports.some(key => typeof lib[key] === 'function')
    if (!hasFunctions) {
      throw new Error('Library exports no callable functions')
    }
  })

  testRunner.registerTest('[Integrity] No mock implementations detected', () => {
    const suspicious = [
      'mockParse', 'mockValidate', 'fakeParse', 'fakeValidate',
      'stubParse', 'stubValidate', 'testParse', 'testValidate'
    ]
    suspicious.forEach(name => {
      if (typeof window[name] === 'function') {
        throw new Error(`Detected mock function: window.${name} - use real library`)
      }
    })
  })

  // ─────────────────────────────────────────────
  // VISUAL FEEDBACK VERIFICATION
  // ─────────────────────────────────────────────

  testRunner.registerTest('[Integrity] CSS includes animation definitions', () => {
    const sheets = document.styleSheets
    let hasAnimations = false

    try {
      for (const sheet of sheets) {
        if (!sheet.href || sheet.href.includes('demo-files/')) {
          const rules = sheet.cssRules || sheet.rules
          for (const rule of rules) {
            if (rule.type === CSSRule.KEYFRAMES_RULE ||
                (rule.style && (
                  rule.style.animation ||
                  rule.style.transition ||
                  rule.style.animationName
                ))) {
              hasAnimations = true
              break
            }
          }
        }
        if (hasAnimations) break
      }
    } catch (e) {
      // CORS error - assume external sheet has animations
      hasAnimations = true
    }

    if (!hasAnimations) {
      throw new Error('No CSS animations or transitions found - visual feedback required')
    }
  })

  testRunner.registerTest('[Integrity] Interactive elements have hover states', () => {
    const buttons = document.querySelectorAll('button, .btn')
    if (buttons.length === 0) return // No buttons to check

    // Check that enabled buttons have pointer cursor (disabled buttons should have not-allowed)
    const enabledBtn = Array.from(buttons).find(btn => !btn.disabled)
    if (!enabledBtn) return // All buttons are disabled, skip check

    const styles = window.getComputedStyle(enabledBtn)
    if (styles.cursor !== 'pointer') {
      throw new Error('Buttons should have cursor: pointer')
    }
  })

  // ─────────────────────────────────────────────
  // WALKTHROUGH REGISTRATION VERIFICATION
  // ─────────────────────────────────────────────

  testRunner.registerTest('[Integrity] Walkthrough demonstrations are async functions', () => {
    testRunner.exhibits.forEach(exhibit => {
      if (typeof exhibit.demonstrate !== 'function') {
        throw new Error(`Exhibit "${exhibit.name}" has no demonstrate function`)
      }
      const result = exhibit.demonstrate.toString()
      if (!result.includes('async') && !result.includes('Promise')) {
        console.warn(`Exhibit "${exhibit.name}" demonstrate() may not be async`)
      }
    })
  })

  testRunner.registerTest('[Integrity] Each exhibit has required elements', () => {
    const exhibits = document.querySelectorAll('.exhibit')
    exhibits.forEach(exhibit => {
      const title = exhibit.querySelector('.exhibit-title, h2, h3')
      if (!title) {
        throw new Error(`Exhibit ${exhibit.id} missing title element`)
      }

      const interactive = exhibit.querySelector(
        '.exhibit-interactive, .exhibit-content, [data-interactive]'
      )
      if (!interactive) {
        throw new Error(`Exhibit ${exhibit.id} missing interactive area`)
      }
    })
  })
}

// ============================================
// LIBRARY-SPECIFIC TESTS
// ============================================

function registerLibraryTests() {
  const { createFlagStore, ValidationError, ParseError } = window.Library

  // Basic store operations
  testRunner.registerTest('createFlagStore returns store instance', () => {
    const store = createFlagStore()
    if (typeof store.set !== 'function') {
      throw new Error('Store missing set() method')
    }
  })

  testRunner.registerTest('store.set() accepts boolean values', () => {
    const store = createFlagStore()
    store.set('test', true)
    if (store.get('test') !== true) {
      throw new Error('Boolean value not stored correctly')
    }
  })

  testRunner.registerTest('store.set() accepts number values', () => {
    const store = createFlagStore()
    store.set('count', 42)
    if (store.get('count') !== 42) {
      throw new Error('Number value not stored correctly')
    }
  })

  testRunner.registerTest('store.set() accepts string values', () => {
    const store = createFlagStore()
    store.set('name', 'test')
    if (store.get('name') !== 'test') {
      throw new Error('String value not stored correctly')
    }
  })

  testRunner.registerTest('store.get() returns undefined for missing keys', () => {
    const store = createFlagStore()
    if (store.get('nonexistent') !== undefined) {
      throw new Error('Expected undefined for missing key')
    }
  })

  testRunner.registerTest('store.has() returns correct boolean', () => {
    const store = createFlagStore()
    store.set('exists', true)
    if (!store.has('exists') || store.has('missing')) {
      throw new Error('has() returned incorrect value')
    }
  })

  testRunner.registerTest('store.delete() removes keys', () => {
    const store = createFlagStore()
    store.set('temp', 123)
    store.delete('temp')
    if (store.has('temp')) {
      throw new Error('Key was not deleted')
    }
  })

  testRunner.registerTest('store.toggle() toggles boolean flags', () => {
    const store = createFlagStore()
    store.set('flag', false)
    const result = store.toggle('flag')
    if (result !== true || store.get('flag') !== true) {
      throw new Error('Toggle failed')
    }
  })

  testRunner.registerTest('store.increment() increments numbers', () => {
    const store = createFlagStore()
    store.set('count', 5)
    store.increment('count', 3)
    if (store.get('count') !== 8) {
      throw new Error('Increment failed')
    }
  })

  testRunner.registerTest('store.decrement() decrements numbers', () => {
    const store = createFlagStore()
    store.set('count', 10)
    store.decrement('count', 3)
    if (store.get('count') !== 7) {
      throw new Error('Decrement failed')
    }
  })

  // Condition checking
  testRunner.registerTest('store.check() evaluates AND conditions', () => {
    const store = createFlagStore({ initial: { a: true, b: true } })
    if (!store.check('a AND b')) {
      throw new Error('AND condition failed')
    }
  })

  testRunner.registerTest('store.check() evaluates OR conditions', () => {
    const store = createFlagStore({ initial: { a: true, b: false } })
    if (!store.check('a OR b')) {
      throw new Error('OR condition failed')
    }
  })

  testRunner.registerTest('store.check() evaluates NOT conditions', () => {
    const store = createFlagStore({ initial: { a: false } })
    if (!store.check('NOT a')) {
      throw new Error('NOT condition failed')
    }
  })

  testRunner.registerTest('store.check() evaluates comparison operators', () => {
    const store = createFlagStore({ initial: { count: 10 } })
    if (!store.check('count >= 5')) {
      throw new Error('Comparison failed')
    }
  })

  testRunner.registerTest('store.check() handles complex nested conditions', () => {
    const store = createFlagStore({
      initial: { a: true, b: false, c: 10 }
    })
    if (!store.check('(a AND NOT b) OR c > 5')) {
      throw new Error('Complex condition failed')
    }
  })

  // Subscriptions
  testRunner.registerTest('store.subscribe() calls handler on changes', () => {
    const store = createFlagStore()
    let called = false
    store.subscribe(() => { called = true })
    store.set('test', 1)
    if (!called) {
      throw new Error('Subscription handler not called')
    }
  })

  testRunner.registerTest('store.subscribeKey() calls handler for specific key', () => {
    const store = createFlagStore()
    let calls = 0
    store.subscribeKey('watched', () => { calls++ })
    store.set('other', 1)
    store.set('watched', 1)
    if (calls !== 1) {
      throw new Error(`Expected 1 call, got ${calls}`)
    }
  })

  // Computed flags
  testRunner.registerTest('store.compute() creates computed flags', () => {
    const store = createFlagStore({ initial: { a: 2, b: 3 } })
    store.compute('sum', ['a', 'b'], (a, b) => a + b)
    if (store.get('sum') !== 5) {
      throw new Error('Computed flag incorrect')
    }
  })

  testRunner.registerTest('Computed flags update when dependencies change', () => {
    const store = createFlagStore({ initial: { x: 5 } })
    store.compute('double', ['x'], (x) => x * 2)
    store.set('x', 10)
    if (store.get('double') !== 20) {
      throw new Error('Computed flag did not update')
    }
  })

  // Namespaces
  testRunner.registerTest('store.namespace() creates namespaced accessor', () => {
    const store = createFlagStore()
    const player = store.namespace('player')
    player.set('health', 100)
    if (store.get('player.health') !== 100) {
      throw new Error('Namespace set failed')
    }
  })

  testRunner.registerTest('Namespaced operations work correctly', () => {
    const store = createFlagStore()
    const ns = store.namespace('test')
    ns.set('a', 1)
    ns.set('b', 2)
    const keys = ns.keys()
    if (keys.length !== 2 || !keys.includes('a')) {
      throw new Error('Namespace keys incorrect')
    }
  })

  // Batch operations
  testRunner.registerTest('store.batch() groups multiple changes', () => {
    const store = createFlagStore()
    let callCount = 0
    store.subscribe(() => { callCount++ })
    store.batch(() => {
      store.set('a', 1)
      store.set('b', 2)
      store.set('c', 3)
    })
    // Should be called once for the batch, not 3 times
    if (callCount > 1) {
      throw new Error(`Expected 1 subscription call, got ${callCount}`)
    }
  })

  // History (undo/redo)
  testRunner.registerTest('store.undo() reverts last change', () => {
    const store = createFlagStore({ history: true })
    store.set('val', 1)
    store.set('val', 2)
    store.undo()
    if (store.get('val') !== 1) {
      throw new Error('Undo failed')
    }
  })

  testRunner.registerTest('store.redo() reapplies undone change', () => {
    const store = createFlagStore({ history: true })
    store.set('val', 1)
    store.set('val', 2)
    store.undo()
    store.redo()
    if (store.get('val') !== 2) {
      throw new Error('Redo failed')
    }
  })

  testRunner.registerTest('store.canUndo() returns correct state', () => {
    const store = createFlagStore({ history: true })
    if (store.canUndo()) {
      throw new Error('Should not be able to undo initially')
    }
    store.set('val', 1)
    if (!store.canUndo()) {
      throw new Error('Should be able to undo after change')
    }
  })

  testRunner.registerTest('store.canRedo() returns correct state', () => {
    const store = createFlagStore({ history: true })
    store.set('val', 1)
    if (store.canRedo()) {
      throw new Error('Should not be able to redo before undo')
    }
    store.undo()
    if (!store.canRedo()) {
      throw new Error('Should be able to redo after undo')
    }
  })

  // Validation errors
  testRunner.registerTest('ValidationError thrown for invalid keys', () => {
    const store = createFlagStore()
    try {
      store.set('invalid key', true) // Space in key
      throw new Error('Should have thrown ValidationError')
    } catch (e) {
      if (e.name !== 'ValidationError') {
        throw new Error(`Expected ValidationError, got ${e.name}`)
      }
    }
  })

  testRunner.registerTest('ParseError thrown for invalid conditions', () => {
    const store = createFlagStore()
    try {
      store.check('invalid ( condition')
      throw new Error('Should have thrown ParseError')
    } catch (e) {
      if (e.name !== 'ParseError') {
        throw new Error(`Expected ParseError, got ${e.name}`)
      }
    }
  })
}

// ============================================
// EXHIBIT WALKTHROUGH REGISTRATION
// ============================================

function registerExhibitWalkthroughs() {
  // Helper function for delays
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  // Exhibit 1: Game State Dashboard
  testRunner.registerExhibit(
    'Game State Dashboard',
    document.getElementById('exhibit-1'),
    async () => {
      // Load "Near Death" scenario
      const dangerBtn = document.querySelector('[data-scenario="danger"]')
      dangerBtn?.click()
      await delay(800)

      // Heal by clicking health bar
      const healthBar = document.getElementById('health-bar-container')
      const healthRect = healthBar.getBoundingClientRect()
      const healthEvent = new MouseEvent('click', {
        clientX: healthRect.left + healthRect.width * 0.8,
        clientY: healthRect.top + healthRect.height / 2
      })
      healthBar.dispatchEvent(healthEvent)
      await delay(600)

      // Level up
      const levelUpBtn = document.getElementById('level-up-btn')
      levelUpBtn?.click()
      await delay(600)

      // Equip shield
      const shieldCard = document.querySelector('[data-item="shield"]')
      shieldCard?.click()
      await delay(600)
    }
  )

  // Exhibit 2: Live Condition Cards
  testRunner.registerExhibit(
    'Live Condition Cards',
    document.getElementById('exhibit-2'),
    async () => {
      // Conditions update automatically from store changes
      // Make some changes to show reactivity
      if (window.demoStore) {
        window.demoStore.set('player.gold', 250)
        await delay(800)

        window.demoStore.set('player.level', 12)
        await delay(800)

        window.demoStore.set('player.gold', 100)
        await delay(800)
      }
    }
  )

  // Exhibit 3: Time Machine
  testRunner.registerExhibit(
    'Time Machine',
    document.getElementById('exhibit-3'),
    async () => {
      // Demonstrate undo
      const undoBtn = document.getElementById('undo-btn')
      if (undoBtn && !undoBtn.disabled) {
        undoBtn.click()
        await delay(600)
        undoBtn.click()
        await delay(600)
      }

      // Demonstrate redo
      const redoBtn = document.getElementById('redo-btn')
      if (redoBtn && !redoBtn.disabled) {
        redoBtn.click()
        await delay(600)
      }

      // Demonstrate batch
      const batchBtn = document.getElementById('make-batch-3')
      batchBtn?.click()
      await delay(800)

      // Undo the batch
      if (undoBtn && !undoBtn.disabled) {
        undoBtn.click()
        await delay(600)
      }
    }
  )
}

// ============================================
// INITIALIZE TESTS
// ============================================

// Register all tests when script loads
registerIntegrityTests()
registerLibraryTests()
registerExhibitWalkthroughs()
