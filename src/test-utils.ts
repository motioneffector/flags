/**
 * Test utility helpers for the @motioneffector/flags library
 */

import { createFlagStore } from './core/store'
import type { FlagStore } from './types'

/**
 * Helper to create store with common test flags
 */
export function createTestStore(): FlagStore {
  return createFlagStore({
    initial: {
      boolTrue: true,
      boolFalse: false,
      numPositive: 42,
      numZero: 0,
      numNegative: -10,
      strNonEmpty: 'hello',
      strEmpty: '',
    },
  })
}

/**
 * Mock storage backend for testing persistence
 */
export class MockStorage implements Storage {
  private data = new Map<string, string>()

  get length(): number {
    return this.data.size
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }

  clear(): void {
    this.data.clear()
  }

  key(index: number): string | null {
    const keys = Array.from(this.data.keys())
    return keys[index] ?? null
  }
}

/**
 * Failing storage for error testing
 */
export class FailingStorage implements Storage {
  get length(): number {
    return 0
  }

  getItem(): string | null {
    throw new Error('Storage unavailable')
  }

  setItem(): void {
    throw new Error('Storage unavailable')
  }

  removeItem(): void {
    throw new Error('Storage unavailable')
  }

  clear(): void {
    throw new Error('Storage unavailable')
  }

  key(): string | null {
    throw new Error('Storage unavailable')
  }
}

/**
 * Spy helper for subscription testing
 */
export function createSubscriptionSpy() {
  const calls: Array<{ key: string; newValue: unknown; oldValue: unknown }> = []
  const callback = (key: string, newValue: unknown, oldValue: unknown) => {
    calls.push({ key, newValue, oldValue })
  }
  return { callback, calls }
}
