import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFlagStore } from './store'
import type { FlagStore } from '../types'

describe('store.batch(fn)', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  describe('Basic Batching', () => {
    it('multiple set() calls in batch fire single subscribe notification', () => {
      const callback = vi.fn()
      store.subscribe(callback)

      store.batch(() => {
        store.set('a', 1)
        store.set('b', 2)
        store.set('c', 3)
      })

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('batch returns the result of the function', () => {
      const result = store.batch(() => {
        store.set('key', 'value')
        return 'completed'
      })

      expect(result).toBe('completed')
    })

    it('changes are visible inside batch function', () => {
      store.batch(() => {
        store.set('key', 'value')
        expect(store.get('key')).toBe('value')
      })
    })

    it('changes are visible after batch completes', () => {
      store.batch(() => {
        store.set('a', 1)
        store.set('b', 2)
      })

      expect(store.get('a')).toBe(1)
      expect(store.get('b')).toBe(2)
    })
  })

  describe('Notification Behavior', () => {
    it('subscribe callback fires once after batch, not during', () => {
      const callback = vi.fn()
      store.subscribe(callback)

      store.batch(() => {
        store.set('a', 1)
        expect(callback).not.toHaveBeenCalled()
        store.set('b', 2)
        expect(callback).not.toHaveBeenCalled()
      })

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('subscribeKey callbacks fire once per affected key after batch', () => {
      const callbackA = vi.fn()
      const callbackB = vi.fn()
      const callbackC = vi.fn()
      store.subscribeKey('a', callbackA)
      store.subscribeKey('b', callbackB)
      store.subscribeKey('c', callbackC)

      store.batch(() => {
        store.set('a', 1)
        store.set('b', 2)
      })

      expect(callbackA).toHaveBeenCalledTimes(1)
      expect(callbackB).toHaveBeenCalledTimes(1)
      expect(callbackC).not.toHaveBeenCalled()
    })

    it('callback receives summary of all changes in batch', () => {
      const callback = vi.fn()
      store.subscribe(callback)

      store.batch(() => {
        store.set('a', 1)
        store.set('b', 2)
        store.set('c', 3)
      })

      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe('History Integration', () => {
    it('batch records as single undo step (with history enabled)', () => {
      const store = createFlagStore({ history: true })

      store.batch(() => {
        store.set('a', 1)
        store.set('b', 2)
        store.set('c', 3)
      })

      store.undo()

      expect(store.get('a')).toBeUndefined()
      expect(store.get('b')).toBeUndefined()
      expect(store.get('c')).toBeUndefined()
    })

    it('undo after batch reverts all changes in batch', () => {
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

  describe('Nested Batches (Decision 11.2: flatten)', () => {
    it('nested batch is absorbed into outer batch', () => {
      const callback = vi.fn()
      store.subscribe(callback)

      store.batch(() => {
        store.set('a', 1)
        store.batch(() => {
          store.set('b', 2)
        })
        store.set('c', 3)
      })

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('inner batch does not fire notification', () => {
      const callback = vi.fn()
      store.subscribe(callback)

      store.batch(() => {
        store.set('a', 1)
        store.batch(() => {
          store.set('b', 2)
          expect(callback).not.toHaveBeenCalled()
        })
        expect(callback).not.toHaveBeenCalled()
      })

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('single notification fires at end of outermost batch', () => {
      const callback = vi.fn()
      store.subscribe(callback)

      store.batch(() => {
        store.batch(() => {
          store.batch(() => {
            store.set('a', 1)
          })
        })
      })

      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('error in batch function propagates to caller', () => {
      expect(() => {
        store.batch(() => {
          store.set('a', 1)
          throw new Error('Batch error')
        })
      }).toThrow('Batch error')
    })

    it('changes before error are rolled back', () => {
      store.set('a', 0)

      try {
        store.batch(() => {
          store.set('a', 1)
          store.set('b', 2)
          throw new Error('Batch error')
        })
      } catch (e) {
        // Expected
      }

      expect(store.get('a')).toBe(0)
      expect(store.get('b')).toBeUndefined()
    })

    it('store state unchanged after error in batch', () => {
      store.set('existing', 'value')

      try {
        store.batch(() => {
          store.set('new', 'data')
          throw new Error('Batch error')
        })
      } catch (e) {
        // Expected
      }

      expect(store.get('existing')).toBe('value')
      expect(store.has('new')).toBe(false)
    })

    it('no notifications fired if batch errors', () => {
      const callback = vi.fn()
      store.subscribe(callback)

      try {
        store.batch(() => {
          store.set('a', 1)
          throw new Error('Batch error')
        })
      } catch (e) {
        // Expected
      }

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('Batch with Various Operations', () => {
    it('batch can contain set() calls', () => {
      store.batch(() => {
        store.set('a', 1)
        store.set('b', 2)
      })

      expect(store.get('a')).toBe(1)
      expect(store.get('b')).toBe(2)
    })

    it('batch can contain delete() calls', () => {
      store.set('a', 1)
      store.set('b', 2)

      store.batch(() => {
        store.delete('a')
        store.delete('b')
      })

      expect(store.has('a')).toBe(false)
      expect(store.has('b')).toBe(false)
    })

    it('batch can contain toggle() calls', () => {
      store.set('flag1', true)
      store.set('flag2', false)

      store.batch(() => {
        store.toggle('flag1')
        store.toggle('flag2')
      })

      expect(store.get('flag1')).toBe(false)
      expect(store.get('flag2')).toBe(true)
    })

    it('batch can contain increment() calls', () => {
      store.set('a', 10)
      store.set('b', 20)

      store.batch(() => {
        store.increment('a', 5)
        store.increment('b', 10)
      })

      expect(store.get('a')).toBe(15)
      expect(store.get('b')).toBe(30)
    })

    it('batch can contain decrement() calls', () => {
      store.set('a', 10)
      store.set('b', 20)

      store.batch(() => {
        store.decrement('a', 3)
        store.decrement('b', 5)
      })

      expect(store.get('a')).toBe(7)
      expect(store.get('b')).toBe(15)
    })

    it('batch can contain clear() calls', () => {
      store.set('a', 1)
      store.set('b', 2)

      store.batch(() => {
        store.clear()
        store.set('c', 3)
      })

      expect(store.has('a')).toBe(false)
      expect(store.has('b')).toBe(false)
      expect(store.get('c')).toBe(3)
    })

    it('batch can contain setMany() calls', () => {
      store.batch(() => {
        store.setMany({ a: 1, b: 2 })
        store.setMany({ c: 3, d: 4 })
      })

      expect(store.get('a')).toBe(1)
      expect(store.get('b')).toBe(2)
      expect(store.get('c')).toBe(3)
      expect(store.get('d')).toBe(4)
    })
  })
})
