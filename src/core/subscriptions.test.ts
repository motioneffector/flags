import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFlagStore } from './store'
import type { FlagStore } from '../types'

describe('store.subscribe(callback)', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  describe('Basic Subscription', () => {
    it('callback fires when any flag is set', () => {
      const callback = vi.fn()
      store.subscribe(callback)

      store.set('key', 'value')

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('callback fires when any flag is deleted', () => {
      const callback = vi.fn()
      store.set('key', 'value')
      store.subscribe(callback)

      store.delete('key')

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('callback fires when flag is toggled', () => {
      const callback = vi.fn()
      store.set('flag', true)
      store.subscribe(callback)

      store.toggle('flag')

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('callback fires when flag is incremented', () => {
      const callback = vi.fn()
      store.set('count', 0)
      store.subscribe(callback)

      store.increment('count')

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('callback fires when flag is decremented', () => {
      const callback = vi.fn()
      store.set('count', 10)
      store.subscribe(callback)

      store.decrement('count')

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('callback receives (key, newValue, oldValue) arguments', () => {
      const callback = vi.fn()
      store.subscribe(callback)

      store.set('key', 'value')

      expect(callback).toHaveBeenCalledWith('key', 'value', undefined)
    })

    it('callback receives correct key that was changed', () => {
      const callback = vi.fn()
      store.subscribe(callback)

      store.set('myKey', 'myValue')

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback.mock.calls[0]?.[0]).toBe('myKey')
    })

    it('callback receives correct newValue after change', () => {
      const callback = vi.fn()
      store.subscribe(callback)

      store.set('key', 'newValue')

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback.mock.calls[0]?.[1]).toBe('newValue')
    })

    it('callback receives correct oldValue before change', () => {
      const callback = vi.fn()
      store.set('key', 'oldValue')
      store.subscribe(callback)

      store.set('key', 'newValue')

      expect(callback).toHaveBeenCalledWith('key', 'newValue', 'oldValue')
    })

    it('callback receives undefined as oldValue for new key', () => {
      const callback = vi.fn()
      store.subscribe(callback)

      store.set('newKey', 'value')

      expect(callback).toHaveBeenCalledWith('newKey', 'value', undefined)
    })

    it('callback receives undefined as newValue for deleted key', () => {
      const callback = vi.fn()
      store.set('key', 'value')
      store.subscribe(callback)

      store.delete('key')

      expect(callback).toHaveBeenCalledWith('key', undefined, 'value')
    })
  })

  describe('Unsubscribe', () => {
    it('subscribe returns an unsubscribe function', () => {
      const callback = vi.fn()
      const unsubscribe = store.subscribe(callback)

      unsubscribe()
      store.set('key', 'value')
      expect(callback).not.toHaveBeenCalled()
    })

    it('calling unsubscribe stops future callbacks', () => {
      const callback = vi.fn()
      const unsubscribe = store.subscribe(callback)

      unsubscribe()
      store.set('key', 'value')

      expect(callback).not.toHaveBeenCalled()
    })

    it('calling unsubscribe multiple times is safe (no error)', () => {
      const callback = vi.fn()
      const unsubscribe = store.subscribe(callback)

      expect(() => {
        unsubscribe()
        unsubscribe()
        unsubscribe()
      }).not.toThrow()
    })

    it('unsubscribe only affects that specific subscription', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const unsubscribe1 = store.subscribe(callback1)
      store.subscribe(callback2)

      unsubscribe1()
      store.set('key', 'value')

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).toHaveBeenCalledTimes(1)
    })
  })

  describe('Multiple Subscribers', () => {
    it('multiple subscribers all receive notifications', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const callback3 = vi.fn()
      store.subscribe(callback1)
      store.subscribe(callback2)
      store.subscribe(callback3)

      store.set('key', 'value')

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
      expect(callback3).toHaveBeenCalledTimes(1)
    })

    it('subscribers are called in subscription order', () => {
      const callOrder: number[] = []
      const callback1 = vi.fn(() => callOrder.push(1))
      const callback2 = vi.fn(() => callOrder.push(2))
      const callback3 = vi.fn(() => callOrder.push(3))

      store.subscribe(callback1)
      store.subscribe(callback2)
      store.subscribe(callback3)

      store.set('key', 'value')

      expect(callOrder).toEqual([1, 2, 3])
    })

    it("unsubscribing one doesn't affect others", () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const callback3 = vi.fn()
      const unsubscribe1 = store.subscribe(callback1)
      store.subscribe(callback2)
      store.subscribe(callback3)

      unsubscribe1()
      store.set('key', 'value')

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).toHaveBeenCalledTimes(1)
      expect(callback3).toHaveBeenCalledTimes(1)
    })
  })

  describe('Duplicate Callbacks (Decision 6.4: allow)', () => {
    it('same callback can be subscribed multiple times', () => {
      const callback = vi.fn()
      store.subscribe(callback)
      store.subscribe(callback)

      store.set('key', 'value')

      expect(callback).toHaveBeenCalledTimes(2)
    })

    it('callback is invoked once per subscription', () => {
      const callback = vi.fn()
      store.subscribe(callback)
      store.subscribe(callback)
      store.subscribe(callback)

      store.set('key', 'value')

      expect(callback).toHaveBeenCalledTimes(3)
    })

    it('each subscription has independent unsubscribe function', () => {
      const callback = vi.fn()
      const unsub1 = store.subscribe(callback)
      const unsub2 = store.subscribe(callback)
      const unsub3 = store.subscribe(callback)

      unsub1()
      store.set('key', 'value')
      expect(callback).toHaveBeenCalledTimes(2)

      callback.mockClear()
      unsub2()
      store.set('key2', 'value2')
      expect(callback).toHaveBeenCalledTimes(1)

      callback.mockClear()
      unsub3()
      store.set('key3', 'value3')
      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('Callback Error Handling (Decision 6.2: catch, log, continue)', () => {
    it("error in one callback doesn't prevent other callbacks", () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error')
      })
      const goodCallback = vi.fn()

      store.subscribe(errorCallback)
      store.subscribe(goodCallback)

      store.set('key', 'value')

      expect(errorCallback).toHaveBeenCalledTimes(1)
      expect(goodCallback).toHaveBeenCalledTimes(1)
    })

    it('error in callback is logged to console.error', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error')
      })

      store.subscribe(errorCallback)
      store.set('key', 'value')

      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('store state is still updated even if callback throws', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error')
      })

      store.subscribe(errorCallback)
      store.set('key', 'value')

      expect(store.get('key')).toBe('value')
    })
  })

  describe('Subscription During Callback (Decision 6.3: after current cycle)', () => {
    it("new subscription during callback doesn't fire for current change", () => {
      const newCallback = vi.fn()
      const existingCallback = vi.fn(() => {
        store.subscribe(newCallback)
      })

      store.subscribe(existingCallback)
      store.set('key', 'value')

      expect(existingCallback).toHaveBeenCalledTimes(1)
      expect(newCallback).not.toHaveBeenCalled()
    })

    it('new subscription fires for subsequent changes', () => {
      const newCallback = vi.fn()
      const existingCallback = vi.fn(() => {
        if (existingCallback.mock.calls.length === 1) {
          store.subscribe(newCallback)
        }
      })

      store.subscribe(existingCallback)
      store.set('key1', 'value1')
      store.set('key2', 'value2')

      expect(newCallback).toHaveBeenCalledTimes(1)
      expect(newCallback).toHaveBeenCalledWith('key2', 'value2', undefined)
    })

    it('unsubscribe during callback prevents callback for current change', () => {
      const laterCallback = vi.fn()

      const earlyCallback = vi.fn(() => {
        unsub()
      })

      store.subscribe(earlyCallback)
      const unsub = store.subscribe(laterCallback)

      store.set('key', 'value')

      expect(earlyCallback).toHaveBeenCalledTimes(1)
      expect(earlyCallback).toHaveBeenCalledWith('key', 'value', undefined)
      expect(laterCallback).not.toHaveBeenCalled()
    })
  })
})

describe('store.subscribeKey(key, callback)', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  describe('Basic Key Subscription', () => {
    it('callback fires only when specified key changes', () => {
      const callback = vi.fn()
      store.subscribeKey('targetKey', callback)

      store.set('targetKey', 'value')

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('callback does not fire for other key changes', () => {
      const callback = vi.fn()
      store.subscribeKey('targetKey', callback)

      store.set('otherKey', 'value')

      expect(callback).not.toHaveBeenCalled()
    })

    it('callback receives (newValue, oldValue) arguments', () => {
      const callback = vi.fn()
      store.set('key', 'oldValue')
      store.subscribeKey('key', callback)

      store.set('key', 'newValue')

      expect(callback).toHaveBeenCalledWith('newValue', 'oldValue')
    })

    it('callback receives correct newValue after change', () => {
      const callback = vi.fn()
      store.subscribeKey('key', callback)

      store.set('key', 'myNewValue')

      expect(callback).toHaveBeenCalledWith('myNewValue', undefined)
    })

    it('callback receives correct oldValue before change', () => {
      const callback = vi.fn()
      store.set('key', 'myOldValue')
      store.subscribeKey('key', callback)

      store.set('key', 'newValue')

      expect(callback).toHaveBeenCalledWith('newValue', 'myOldValue')
    })
  })

  describe('Unsubscribe', () => {
    it('returns unsubscribe function', () => {
      const callback = vi.fn()
      const unsubscribe = store.subscribeKey('key', callback)

      unsubscribe()
      store.set('key', 'value')
      expect(callback).not.toHaveBeenCalled()
    })

    it('calling unsubscribe stops future callbacks for that key', () => {
      const callback = vi.fn()
      const unsubscribe = store.subscribeKey('key', callback)

      unsubscribe()
      store.set('key', 'value')

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('Multiple Key Subscriptions', () => {
    it('can subscribe to multiple different keys', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      store.subscribeKey('key1', callback1)
      store.subscribeKey('key2', callback2)

      store.set('key1', 'value1')
      store.set('key2', 'value2')

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
    })

    it('can subscribe multiple callbacks to same key', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      store.subscribeKey('key', callback1)
      store.subscribeKey('key', callback2)

      store.set('key', 'value')

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)
    })

    it('each subscription is independent', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const unsub1 = store.subscribeKey('key', callback1)
      store.subscribeKey('key', callback2)

      unsub1()
      store.set('key', 'value')

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).toHaveBeenCalledTimes(1)
    })
  })
})

describe("Clear Event (Decision 6.1: single 'clear' event)", () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore({ initial: { a: 1, b: 2, c: 3 } })
  })

  it('clear() fires subscribe callback once (not per key)', () => {
    const callback = vi.fn()
    store.subscribe(callback)

    store.clear()

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it("callback receives ('__clear__', undefined, undefined) or similar marker", () => {
    const callback = vi.fn()
    store.subscribe(callback)

    store.clear()

    expect(callback).toHaveBeenCalledWith('__clear__', undefined, undefined)
  })

  it('clear() does not fire subscribeKey callbacks', () => {
    const callback = vi.fn()
    store.subscribeKey('a', callback)

    store.clear()

    expect(callback).not.toHaveBeenCalled()
  })
})

describe('setMany Event', () => {
  let store: FlagStore

  beforeEach(() => {
    store = createFlagStore()
  })

  it('setMany fires single subscribe callback (not per key)', () => {
    const callback = vi.fn()
    store.subscribe(callback)

    store.setMany({ a: 1, b: 2, c: 3 })

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('callback receives bulk change information', () => {
    const callback = vi.fn()
    store.subscribe(callback)

    store.setMany({ a: 1, b: 2 })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback.mock.calls[0]?.[0]).toBe('__setMany__')
  })
})
