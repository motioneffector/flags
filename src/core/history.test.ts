import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFlagStore } from './store'
import type { FlagStore } from '../types'

describe('Store Without History', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('store created without { history: true } has no undo method', () => {
    expect(store).not.toHaveProperty('undo')
  })

  it('store created without { history: true } has no redo method', () => {
    expect(store).not.toHaveProperty('redo')
  })

  it('store created without { history: true } has no canUndo method', () => {
    expect(store).not.toHaveProperty('canUndo')
  })

  it('store created without { history: true } has no canRedo method', () => {
    expect(store).not.toHaveProperty('canRedo')
  })
})

describe('Store With History Enabled', () => {
  describe('Basic Undo', () => {
    it('undo() reverts last set() operation', () => {
      const store = createFlagStore({ history: true })
      store.set('key', 'value1')
      store.set('key', 'value2')

      store.undo()

      expect(store.get('key')).toBe('value1')
    })

    it('undo() reverts last delete() operation', () => {
      const store = createFlagStore({ history: true })
      store.set('key', 'value')
      store.delete('key')

      store.undo()

      expect(store.get('key')).toBe('value')
    })

    it('undo() reverts last toggle() operation', () => {
      const store = createFlagStore({ history: true })
      store.set('flag', true)
      store.toggle('flag')

      store.undo()

      expect(store.get('flag')).toBe(true)
    })

    it('undo() reverts last increment() operation', () => {
      const store = createFlagStore({ history: true })
      store.set('count', 10)
      store.increment('count', 5)

      store.undo()

      expect(store.get('count')).toBe(10)
    })

    it('undo() reverts last decrement() operation', () => {
      const store = createFlagStore({ history: true })
      store.set('count', 10)
      store.decrement('count', 3)

      store.undo()

      expect(store.get('count')).toBe(10)
    })

    it('undo() reverts last clear() operation', () => {
      const store = createFlagStore({ history: true, initial: { a: 1, b: 2 } })
      store.clear()

      store.undo()

      expect(store.get('a')).toBe(1)
      expect(store.get('b')).toBe(2)
    })

    it('undo() returns true when operation was undone', () => {
      const store = createFlagStore({ history: true })
      store.set('key', 'value')

      expect(store.undo()).toBe(true)
    })
  })

  describe('Multiple Undos', () => {
    it('multiple undo() calls walk back through history', () => {
      const store = createFlagStore({ history: true })
      store.set('key', 'value1')
      store.set('key', 'value2')
      store.set('key', 'value3')

      store.undo()
      expect(store.get('key')).toBe('value2')

      store.undo()
      expect(store.get('key')).toBe('value1')
    })

    it('can undo all changes back to initial state', () => {
      const store = createFlagStore({ history: true })
      store.set('key', 'value1')
      store.set('key', 'value2')

      store.undo()
      store.undo()

      expect(store.get('key')).toBeUndefined()
    })

    it('cannot undo past initial state (Decision 7.3)', () => {
      const store = createFlagStore({ history: true })
      store.set('key', 'value')

      store.undo()
      const result = store.undo()

      expect(result).toBe(false)
      expect(store.get('key')).toBeUndefined()
    })

    it('undo() returns false when nothing to undo (Decision 7.1)', () => {
      const store = createFlagStore({ history: true })

      expect(store.undo()).toBe(false)
    })
  })

  describe('Basic Redo', () => {
    it('redo() re-applies last undone change', () => {
      const store = createFlagStore({ history: true })
      store.set('key', 'value1')
      store.set('key', 'value2')
      store.undo()

      store.redo()

      expect(store.get('key')).toBe('value2')
    })

    it('redo() returns true when operation was redone', () => {
      const store = createFlagStore({ history: true })
      store.set('key', 'value')
      store.undo()

      expect(store.redo()).toBe(true)
    })

    it('redo() returns false when nothing to redo', () => {
      const store = createFlagStore({ history: true })

      expect(store.redo()).toBe(false)
    })
  })

  describe('Undo/Redo Interaction', () => {
    it('redo() after undo() restores the undone change', () => {
      const store = createFlagStore({ history: true })
      store.set('key', 'value')
      store.undo()

      store.redo()

      expect(store.get('key')).toBe('value')
    })

    it('multiple redo() calls walk forward through undo history', () => {
      const store = createFlagStore({ history: true })
      store.set('key', 'value1')
      store.set('key', 'value2')
      store.set('key', 'value3')
      store.undo()
      store.undo()

      store.redo()
      expect(store.get('key')).toBe('value2')

      store.redo()
      expect(store.get('key')).toBe('value3')
    })

    it('new change after undo() clears redo stack', () => {
      const store = createFlagStore({ history: true })
      store.set('key', 'value1')
      store.set('key', 'value2')
      store.undo()

      store.set('key', 'value3')

      expect(store.redo()).toBe(false)
    })

    it('redo() is no-op after new change (returns false)', () => {
      const store = createFlagStore({ history: true })
      store.set('key', 'value1')
      store.undo()
      store.set('key', 'value2')

      expect(store.redo()).toBe(false)
    })
  })

  describe('canUndo / canRedo', () => {
    it('canUndo() returns false on fresh store', () => {
      const store = createFlagStore({ history: true })

      expect(store.canUndo()).toBe(false)
    })

    it('canUndo() returns true after a change', () => {
      const store = createFlagStore({ history: true })
      store.set('key', 'value')

      expect(store.canUndo()).toBe(true)
    })

    it('canUndo() returns false after undoing all changes', () => {
      const store = createFlagStore({ history: true })
      store.set('key', 'value')
      store.undo()

      expect(store.canUndo()).toBe(false)
    })

    it('canRedo() returns false on fresh store', () => {
      const store = createFlagStore({ history: true })

      expect(store.canRedo()).toBe(false)
    })

    it('canRedo() returns false after a change (no undos yet)', () => {
      const store = createFlagStore({ history: true })
      store.set('key', 'value')

      expect(store.canRedo()).toBe(false)
    })

    it('canRedo() returns true after undo()', () => {
      const store = createFlagStore({ history: true })
      store.set('key', 'value')
      store.undo()

      expect(store.canRedo()).toBe(true)
    })

    it('canRedo() returns false after redo() exhausts redo stack', () => {
      const store = createFlagStore({ history: true })
      store.set('key', 'value')
      store.undo()
      store.redo()

      expect(store.canRedo()).toBe(false)
    })

    it('canRedo() returns false after new change clears redo stack', () => {
      const store = createFlagStore({ history: true })
      store.set('key', 'value1')
      store.undo()
      store.set('key', 'value2')

      expect(store.canRedo()).toBe(false)
    })
  })

  describe('clearHistory()', () => {
    it('clearHistory() clears undo stack', () => {
      const store = createFlagStore({ history: true })
      store.set('key', 'value')

      store.clearHistory()

      expect(store.canUndo()).toBe(false)
    })

    it('clearHistory() clears redo stack', () => {
      const store = createFlagStore({ history: true })
      store.set('key', 'value')
      store.undo()

      store.clearHistory()

      expect(store.canRedo()).toBe(false)
    })

    it('canUndo() returns false after clearHistory()', () => {
      const store = createFlagStore({ history: true })
      store.set('key', 'value')
      store.clearHistory()

      expect(store.canUndo()).toBe(false)
    })

    it('canRedo() returns false after clearHistory()', () => {
      const store = createFlagStore({ history: true })
      store.set('key', 'value')
      store.undo()
      store.clearHistory()

      expect(store.canRedo()).toBe(false)
    })

    it('current state is preserved after clearHistory()', () => {
      const store = createFlagStore({ history: true })
      store.set('key', 'value')

      store.clearHistory()

      expect(store.get('key')).toBe('value')
    })
  })
})

describe('History and Events (Decision 7.2: fire normally)', () => {
  it('undo() fires subscribe callback with change info', () => {
    const store = createFlagStore({ history: true })
    const callback = vi.fn()
    store.set('key', 'value1')
    store.set('key', 'value2')
    store.subscribe(callback)

    store.undo()

    expect(callback).toHaveBeenCalledWith('key', 'value1', 'value2')
  })

  it('redo() fires subscribe callback with change info', () => {
    const store = createFlagStore({ history: true })
    const callback = vi.fn()
    store.set('key', 'value1')
    store.set('key', 'value2')
    store.undo()
    store.subscribe(callback)

    store.redo()

    expect(callback).toHaveBeenCalledWith('key', 'value2', 'value1')
  })

  it('undo() fires subscribeKey callback for affected key', () => {
    const store = createFlagStore({ history: true })
    const callback = vi.fn()
    store.set('key', 'value1')
    store.set('key', 'value2')
    store.subscribeKey('key', callback)

    store.undo()

    expect(callback).toHaveBeenCalledWith('value1', 'value2')
  })
})

describe('History Limits', () => {
  it('respects { history: { maxHistory: N } } option', () => {
    const store = createFlagStore({ history: { maxHistory: 3 } })
    store.set('key', 'value1')
    store.set('key', 'value2')
    store.set('key', 'value3')
    store.set('key', 'value4')

    // Can undo 3 times
    store.undo()
    expect(store.get('key')).toBe('value3')
    store.undo()
    expect(store.get('key')).toBe('value2')
    store.undo()
    expect(store.get('key')).toBe('value1')

    // Cannot undo further
    expect(store.undo()).toBe(false)
  })

  it('oldest entry dropped when limit exceeded', () => {
    const store = createFlagStore({ history: { maxHistory: 2 } })
    store.set('key', 'value1')
    store.set('key', 'value2')
    store.set('key', 'value3')

    // Undo twice brings us to value1
    store.undo()
    store.undo()
    expect(store.get('key')).toBe('value1')

    // Cannot undo further (value0 state was dropped)
    expect(store.undo()).toBe(false)
  })

  it('can still undo up to maxHistory changes', () => {
    const store = createFlagStore({ history: { maxHistory: 5 } })
    for (let i = 0; i < 10; i++) {
      store.set('key', `value${i}`)
    }

    // Can undo 5 times
    for (let i = 0; i < 5; i++) {
      expect(store.undo()).toBe(true)
    }

    // Cannot undo further
    expect(store.undo()).toBe(false)
  })

  it('default maxHistory is reasonable (e.g., 100)', () => {
    const store = createFlagStore({ history: true })

    // Make 100 changes
    for (let i = 0; i < 100; i++) {
      store.set('key', `value${i}`)
    }

    // Should be able to undo at least 50 times
    let undoCount = 0
    while (store.canUndo() && undoCount < 50) {
      store.undo()
      undoCount++
    }

    expect(undoCount).toBe(50)
  })
})

describe('History with Batch', () => {
  it('batch() records as single history entry', () => {
    const store = createFlagStore({ history: true })

    store.batch(() => {
      store.set('a', 1)
      store.set('b', 2)
      store.set('c', 3)
    })

    // Single undo reverts all changes
    store.undo()

    expect(store.get('a')).toBeUndefined()
    expect(store.get('b')).toBeUndefined()
    expect(store.get('c')).toBeUndefined()
  })

  it('undo() after batch reverts entire batch', () => {
    const store = createFlagStore({ history: true })
    store.set('a', 0)
    store.set('b', 0)

    store.batch(() => {
      store.set('a', 1)
      store.set('b', 2)
    })

    store.undo()

    expect(store.get('a')).toBe(0)
    expect(store.get('b')).toBe(0)
  })
})

describe('History with setMany', () => {
  it('setMany() records as single history entry', () => {
    const store = createFlagStore({ history: true })

    store.setMany({ a: 1, b: 2, c: 3 })

    // Single undo reverts all changes
    store.undo()

    expect(store.get('a')).toBeUndefined()
    expect(store.get('b')).toBeUndefined()
    expect(store.get('c')).toBeUndefined()
  })

  it('undo() after setMany reverts all changes from setMany', () => {
    const store = createFlagStore({ history: true })
    store.set('a', 0)
    store.set('b', 0)

    store.setMany({ a: 1, b: 2, c: 3 })

    store.undo()

    expect(store.get('a')).toBe(0)
    expect(store.get('b')).toBe(0)
    expect(store.get('c')).toBeUndefined()
  })
})
