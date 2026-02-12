import { ValidationError } from '../errors'
import { parseCondition } from './condition-parser'
import type {
  FlagValue,
  FlagStoreOptions,
  FlagStore,
  FlagStoreWithHistory,
  FlagStoreWithPersistence,
  ChangeCallback,
  KeyChangeCallback,
  UnsubscribeFn,
  ComputeFn,
  Storage,
} from '../types'

const DEFAULT_STORAGE_KEY = '@motioneffector/flags'
const DEFAULT_MAX_HISTORY = 100
const MAX_KEY_LENGTH = 1000
const MAX_STRING_VALUE_LENGTH = 100_000
const MAX_CONDITION_LENGTH = 10_000

/**
 * Reserved words that cannot be used as flag keys
 */
const RESERVED_WORDS = ['and', 'or', 'not']

/**
 * Forbidden keys that could cause prototype pollution
 */
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

/**
 * Operators that cannot appear in flag keys
 */
const INVALID_KEY_PATTERNS = ['>', '<', '>=', '<=', '==', '!=', '!']

interface HistoryEntry {
  state: Map<string, FlagValue>
}

interface ComputedFlag {
  dependencies: string[]
  fn: ComputeFn
}

/**
 * Validates a flag key (expects key to already be trimmed)
 */
function validateKey(key: string): void {
  if (key === '') {
    throw new ValidationError('Key cannot be empty', 'key')
  }

  if (key.length > MAX_KEY_LENGTH) {
    throw new ValidationError(
      `Key exceeds maximum length of ${MAX_KEY_LENGTH}. Received length: ${key.length}`,
      'key'
    )
  }

  if (key.includes(' ')) {
    throw new ValidationError(`Key cannot contain spaces. Received: "${key}"`, 'key')
  }

  if (key.startsWith('!')) {
    throw new ValidationError(`Key cannot start with '!'. Received: "${key}"`, 'key')
  }

  // Check for prototype pollution
  if (FORBIDDEN_KEYS.has(key)) {
    throw new ValidationError(
      `Key cannot be a prototype property (__proto__, constructor, prototype). Received: "${key}"`,
      'key'
    )
  }

  // Check for operators
  for (const pattern of INVALID_KEY_PATTERNS) {
    if (key.includes(pattern)) {
      throw new ValidationError(
        `Key cannot contain comparison operators. Received: "${key}"`,
        'key'
      )
    }
  }

  // Check for reserved words
  const lowerKey = key.toLowerCase()
  if (RESERVED_WORDS.includes(lowerKey)) {
    throw new ValidationError(
      `Key cannot be a reserved word (AND, OR, NOT). Received: "${key}"`,
      'key'
    )
  }
}

/**
 * Validates a flag value
 */
function validateValue(value: unknown): asserts value is FlagValue {
  const valueType = typeof value
  if (valueType !== 'boolean' && valueType !== 'number' && valueType !== 'string') {
    throw new ValidationError(
      `Value must be boolean, number, or string. Received: ${valueType}`,
      'value'
    )
  }

  // Validate numeric bounds
  if (valueType === 'number') {
    if (!Number.isFinite(value as number)) {
      throw new ValidationError(
        'Number values must be finite (not NaN, Infinity, or -Infinity)',
        'value'
      )
    }
  }

  // Validate string length
  if (valueType === 'string') {
    const strValue = value as string
    if (strValue.length > MAX_STRING_VALUE_LENGTH) {
      throw new ValidationError(
        `String value exceeds maximum length of ${MAX_STRING_VALUE_LENGTH}. Received length: ${strValue.length}`,
        'value'
      )
    }
  }
}

/**
 * Creates a new flag store instance with optional history and persistence support.
 *
 * This factory function creates a flexible store for managing feature flags, feature toggles,
 * and application state. The store provides methods for getting, setting, and querying flags,
 * with optional support for undo/redo history and persistent storage.
 *
 * @param options - Configuration options for the store
 * @param options.initial - Initial flag values as key-value pairs
 * @param options.persist - Persistence configuration for automatic storage
 * @param options.persist.storage - Storage implementation (e.g., localStorage, sessionStorage)
 * @param options.persist.key - Storage key for persisting state (defaults to '@motioneffector/flags')
 * @param options.persist.autoSave - Whether to auto-save on changes (defaults to true)
 * @param options.history - Enable undo/redo history (defaults to false). Pass `true` to enable with default max of 100 entries, or provide options object
 * @param options.history.maxHistory - Maximum number of history entries to keep (defaults to 100)
 * @returns A new FlagStore instance. If history is enabled, returns FlagStoreWithHistory. If persistence is enabled, returns FlagStoreWithPersistence
 *
 * @example
 * ```typescript
 * // Basic store with initial values
 * const store = createFlagStore({
 *   initial: { darkMode: false, betaFeatures: true }
 * })
 *
 * store.set('darkMode', true)
 * const isDark = store.get('darkMode') // true
 * ```
 *
 * @example
 * ```typescript
 * // Store with persistence to localStorage
 * const store = createFlagStore({
 *   initial: { darkMode: false },
 *   persist: { storage: localStorage }
 * })
 * // Changes are automatically saved to localStorage
 * ```
 *
 * @example
 * ```typescript
 * // Store with undo/redo history
 * const store = createFlagStore({
 *   initial: { count: 0 },
 *   history: { maxHistory: 50 }
 * })
 * store.set('count', 1)
 * store.undo() // Reverts to count: 0
 * store.redo() // Back to count: 1
 * ```
 *
 * @throws {ValidationError} If initial values contain invalid keys (empty, with operators, or reserved words)
 * @throws {ValidationError} If initial values are not boolean, number, or string
 * @throws {ValidationError} If initial values are null or undefined
 */
export function createFlagStore(
  options?: FlagStoreOptions
): FlagStore | FlagStoreWithHistory | FlagStoreWithPersistence {
  // Internal state
  const state = new Map<string, FlagValue>()
  const computedFlags = new Map<string, ComputedFlag>()
  const subscribers: ChangeCallback[] = []
  const keySubscribers = new Map<string, KeyChangeCallback[]>()

  // History state
  const historyEnabled = options?.history !== undefined && options.history !== false
  const maxHistory =
    typeof options?.history === 'object'
      ? (options.history.maxHistory ?? DEFAULT_MAX_HISTORY)
      : DEFAULT_MAX_HISTORY
  const undoStack: HistoryEntry[] = []
  const redoStack: HistoryEntry[] = []

  // Persistence state
  const persistEnabled = options?.persist !== undefined
  const storage: Storage | undefined = options?.persist?.storage
  const storageKey = options?.persist?.key ?? DEFAULT_STORAGE_KEY
  const autoSave = options?.persist?.autoSave !== false

  // Batch state
  let batchDepth = 0
  let batchSnapshot: Map<string, FlagValue> | null = null
  let batchChanges: Array<{
    key: string
    newValue: FlagValue | undefined
    oldValue: FlagValue | undefined
  }> = []

  /**
   * Get current state snapshot
   */
  function getStateSnapshot(): Map<string, FlagValue> {
    return new Map(state)
  }

  /**
   * Restore state from snapshot
   */
  function restoreStateSnapshot(snapshot: Map<string, FlagValue>): void {
    const changes: Array<{
      key: string
      newValue: FlagValue | undefined
      oldValue: FlagValue | undefined
    }> = []

    // Track deletions
    for (const [key, oldValue] of state.entries()) {
      if (!snapshot.has(key) && !computedFlags.has(key)) {
        changes.push({ key, newValue: undefined, oldValue })
      }
    }

    // Track additions and modifications
    for (const [key, newValue] of snapshot.entries()) {
      const oldValue = state.get(key)
      if (oldValue !== newValue) {
        changes.push({ key, newValue, oldValue })
      }
    }

    // Apply snapshot
    state.clear()
    for (const [key, value] of snapshot.entries()) {
      state.set(key, value)
    }

    // Update computed flags
    updateAllComputedFlags()

    // Notify subscribers
    for (const change of changes) {
      notifyChange(change.key, change.newValue, change.oldValue)
    }
  }

  /**
   * Record history entry
   */
  function recordHistory(): void {
    if (!historyEnabled) return

    const snapshot = getStateSnapshot()
    undoStack.push({ state: snapshot })

    // Limit history size
    if (undoStack.length > maxHistory) {
      undoStack.shift()
    }

    // Clear redo stack on new change
    redoStack.length = 0
  }

  /**
   * Notify subscribers of a change
   */
  function notifyChange(
    key: string,
    newValue: FlagValue | undefined,
    oldValue: FlagValue | undefined
  ): void {
    // If in batch, defer notification
    if (batchDepth > 0) {
      batchChanges.push({ key, newValue, oldValue })
      return
    }

    executeNotification(key, newValue, oldValue)
  }

  /**
   * Execute a notification immediately
   */
  function executeNotification(
    key: string,
    newValue: FlagValue | undefined,
    oldValue: FlagValue | undefined
  ): void {
    executeGlobalNotifications(key, newValue, oldValue)
    executeKeyNotifications(key, newValue, oldValue)
  }

  /**
   * Execute global subscriber notifications
   */
  function executeGlobalNotifications(
    key: string,
    newValue: FlagValue | undefined,
    oldValue: FlagValue | undefined
  ): void {
    // Make a copy of subscribers to allow subscription during callback
    const subscribersCopy = [...subscribers]

    for (const callback of subscribersCopy) {
      // Check if callback is still subscribed (may have been removed during iteration)
      if (!subscribers.includes(callback)) continue

      try {
        callback(key, newValue, oldValue)
      } catch (error) {
        console.error('Subscriber error:', error)
        continue
      }
    }
  }

  /**
   * Execute key-specific subscriber notifications
   */
  function executeKeyNotifications(
    key: string,
    newValue: FlagValue | undefined,
    oldValue: FlagValue | undefined
  ): void {
    const keyCallbacks = keySubscribers.get(key)
    if (keyCallbacks) {
      const keyCallbacksCopy = [...keyCallbacks]
      for (const callback of keyCallbacksCopy) {
        // Check if callback is still subscribed (may have been removed during iteration)
        if (!keyCallbacks.includes(callback)) continue

        try {
          callback(newValue, oldValue)
        } catch (error) {
          console.error('Key subscriber error:', error)
          continue
        }
      }
    }
  }

  /**
   * Persist state to storage
   */
  function persist(): void {
    if (!persistEnabled || !storage || !autoSave) return

    try {
      const data: Record<string, FlagValue> = {}
      for (const [key, value] of state.entries()) {
        data[key] = value
      }
      storage.setItem(storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to persist state:', error)
      return
    }
  }

  /**
   * Load state from storage
   */
  function loadFromStorage(): void {
    if (!persistEnabled || !storage) return

    try {
      const data = storage.getItem(storageKey)
      if (data === null) return

      const parsed = JSON.parse(data) as Record<string, FlagValue>
      // Filter dangerous keys before iteration
      for (const key of Object.keys(parsed)) {
        // Skip prototype pollution keys
        if (FORBIDDEN_KEYS.has(key)) continue
        // Only process own properties
        if (!Object.hasOwn(parsed, key)) continue

        const value = parsed[key]
        validateKey(key)
        validateValue(value)
        state.set(key, value)
      }
    } catch (error) {
      console.error('Failed to load state from storage:', error)
      return
    }
  }

  /**
   * Update a single computed flag
   */
  function updateComputedFlag(key: string): void {
    const computed = computedFlags.get(key)
    if (!computed) return

    try {
      const depValues = computed.dependencies.map(dep => state.get(dep))
      let newValue = computed.fn(...depValues)

      // Validate and sanitize numeric results
      if (typeof newValue === 'number') {
        if (isNaN(newValue)) {
          // Handle NaN by treating as 0
          newValue = 0
        } else if (!isFinite(newValue)) {
          // Handle Infinity by clamping to max safe values
          newValue = newValue > 0 ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER
        }
      }

      const oldValue = state.get(key)

      if (newValue !== oldValue) {
        state.set(key, newValue)
        notifyChange(key, newValue, oldValue)
      }
    } catch (error) {
      console.error(`Error computing flag '${key}':`, error)
      return
    }
  }

  /**
   * Update all computed flags that depend on a given key
   */
  function updateDependentComputedFlags(changedKey: string): void {
    for (const [computedKey, computed] of computedFlags.entries()) {
      if (computed.dependencies.includes(changedKey)) {
        updateComputedFlag(computedKey)
      }
    }
  }

  /**
   * Update all computed flags
   */
  function updateAllComputedFlags(): void {
    for (const key of computedFlags.keys()) {
      updateComputedFlag(key)
    }
  }

  /**
   * Check if a key is computed
   */
  function isComputed(key: string): boolean {
    return computedFlags.has(key)
  }

  // Set initial values first
  if (options?.initial) {
    for (const [key, value] of Object.entries(options.initial)) {
      validateKey(key)
      validateValue(value)
      state.set(key, value)
    }
  }

  // Load from storage (overwrites initial values)
  loadFromStorage()

  // Create base store
  const store: FlagStore = {
    set(key: string, value: FlagValue | null | undefined): FlagStore {
      key = key.trim()
      validateKey(key)

      if (isComputed(key)) {
        throw new Error(`Cannot set computed flag: ${key}`)
      }

      // Null/undefined means delete
      if (value === null || value === undefined) {
        return store.delete(key)
      }

      validateValue(value)

      const oldValue = state.get(key)

      if (batchDepth === 0) {
        recordHistory()
      }

      state.set(key, value)

      // Update dependent computed flags
      updateDependentComputedFlags(key)

      // Always notify (notifyChange will handle batching)
      notifyChange(key, value, oldValue)

      if (batchDepth === 0) {
        persist()
      }

      return store
    },

    get(key: string): FlagValue | undefined {
      key = key.trim()
      return state.get(key)
    },

    has(key: string): boolean {
      key = key.trim()
      return state.has(key)
    },

    delete(key: string): FlagStore {
      key = key.trim()

      if (isComputed(key)) {
        throw new Error(`Cannot delete computed flag: ${key}`)
      }

      const oldValue = state.get(key)

      if (!state.has(key)) {
        return store
      }

      if (batchDepth === 0) {
        recordHistory()
      }

      state.delete(key)

      // Update dependent computed flags
      updateDependentComputedFlags(key)

      // Always notify (notifyChange will handle batching)
      notifyChange(key, undefined, oldValue)

      if (batchDepth === 0) {
        persist()
      }

      return store
    },

    clear(): FlagStore {
      if (batchDepth === 0) {
        recordHistory()
      }

      state.clear()

      // Recompute all computed flags
      updateAllComputedFlags()

      // Always notify (notifyChange will handle batching)
      notifyChange('__clear__', undefined, undefined)

      if (batchDepth === 0) {
        persist()
      }

      return store
    },

    toggle(key: string): boolean {
      key = key.trim()
      validateKey(key)

      if (isComputed(key)) {
        throw new Error(`Cannot toggle computed flag: ${key}`)
      }

      const current = state.get(key)

      // Non-existent key becomes true
      if (current === undefined) {
        store.set(key, true)
        return true
      }

      if (typeof current !== 'boolean') {
        throw new TypeError(`Cannot toggle non-boolean flag: ${key}`)
      }

      const newValue = !current
      store.set(key, newValue)
      return newValue
    },

    increment(key: string, amount: number = 1): number {
      key = key.trim()
      validateKey(key)

      if (isComputed(key)) {
        throw new Error(`Cannot increment computed flag: ${key}`)
      }

      const current = state.get(key)

      // Auto-initialize to 0
      if (current === undefined) {
        const newValue = amount
        store.set(key, newValue)
        return newValue
      }

      if (typeof current !== 'number') {
        throw new TypeError(`Cannot increment non-numeric flag: ${key}`)
      }

      const newValue = current + amount
      store.set(key, newValue)
      return newValue
    },

    decrement(key: string, amount: number = 1): number {
      key = key.trim()
      validateKey(key)

      if (isComputed(key)) {
        throw new Error(`Cannot decrement computed flag: ${key}`)
      }

      const current = state.get(key)

      // Auto-initialize to 0
      if (current === undefined) {
        const newValue = -amount
        store.set(key, newValue)
        return newValue
      }

      if (typeof current !== 'number') {
        throw new TypeError(`Cannot decrement non-numeric flag: ${key}`)
      }

      const newValue = current - amount
      store.set(key, newValue)
      return newValue
    },

    all(): Record<string, FlagValue> {
      const result: Record<string, FlagValue> = {}
      for (const [key, value] of state.entries()) {
        result[key] = value
      }
      return result
    },

    keys(): string[] {
      return Array.from(state.keys())
    },

    setMany(values: Record<string, FlagValue | null | undefined>): FlagStore {
      // Validate all keys first (atomic validation)
      for (const key of Object.keys(values)) {
        const trimmed = key.trim()
        validateKey(trimmed)
      }

      if (batchDepth === 0) {
        recordHistory()
      }

      // Set all values
      for (const [key, value] of Object.entries(values)) {
        const trimmed = key.trim()
        if (value === null || value === undefined) {
          if (state.has(trimmed)) {
            state.delete(trimmed)
            updateDependentComputedFlags(trimmed)
          }
        } else {
          validateValue(value)
          state.set(trimmed, value)
          updateDependentComputedFlags(trimmed)
        }
      }

      // Fire single notification for setMany
      notifyChange('__setMany__', undefined, undefined)

      if (batchDepth === 0) {
        persist()
      }

      return store
    },

    check(condition: string): boolean {
      if (condition.length > MAX_CONDITION_LENGTH) {
        throw new ValidationError(
          `Condition exceeds maximum length of ${MAX_CONDITION_LENGTH}. Received length: ${condition.length}`,
          'condition'
        )
      }
      return parseCondition(condition, key => store.get(key))
    },

    subscribe(callback: ChangeCallback): UnsubscribeFn {
      subscribers.push(callback)
      let isUnsubscribed = false

      return () => {
        if (isUnsubscribed) return
        isUnsubscribed = true

        const index = subscribers.indexOf(callback)
        if (index !== -1) {
          subscribers.splice(index, 1)
        }
      }
    },

    subscribeKey(key: string, callback: KeyChangeCallback): UnsubscribeFn {
      key = key.trim()
      if (!keySubscribers.has(key)) {
        keySubscribers.set(key, [])
      }
      const callbacks = keySubscribers.get(key)
      callbacks?.push(callback)

      let isUnsubscribed = false

      return () => {
        if (isUnsubscribed) return
        isUnsubscribed = true

        const callbacks = keySubscribers.get(key)
        if (callbacks) {
          const index = callbacks.indexOf(callback)
          if (index !== -1) {
            callbacks.splice(index, 1)
          }
          if (callbacks.length === 0) {
            keySubscribers.delete(key)
          }
        }
      }
    },

    namespace(prefix: string): FlagStore {
      prefix = prefix.trim()

      // Create a scoped view of the store
      const namespacedStore: FlagStore = {
        set(key: string, value: FlagValue | null | undefined): FlagStore {
          store.set(`${prefix}.${key}`, value)
          return namespacedStore
        },

        get(key: string): FlagValue | undefined {
          return store.get(`${prefix}.${key}`)
        },

        has(key: string): boolean {
          return store.has(`${prefix}.${key}`)
        },

        delete(key: string): FlagStore {
          store.delete(`${prefix}.${key}`)
          return namespacedStore
        },

        clear(): FlagStore {
          // Clear only keys under this namespace
          const keysToDelete = store.keys().filter(k => k.startsWith(`${prefix}.`))
          for (const key of keysToDelete) {
            store.delete(key)
          }
          return namespacedStore
        },

        toggle(key: string): boolean {
          return store.toggle(`${prefix}.${key}`)
        },

        increment(key: string, amount?: number): number {
          return store.increment(`${prefix}.${key}`, amount)
        },

        decrement(key: string, amount?: number): number {
          return store.decrement(`${prefix}.${key}`, amount)
        },

        all(): Record<string, FlagValue> {
          const result: Record<string, FlagValue> = {}
          const prefixWithDot = `${prefix}.`
          for (const [key, value] of state.entries()) {
            if (key.startsWith(prefixWithDot)) {
              const shortKey = key.slice(prefixWithDot.length)
              result[shortKey] = value
            }
          }
          return result
        },

        keys(): string[] {
          const prefixWithDot = `${prefix}.`
          return store
            .keys()
            .filter(k => k.startsWith(prefixWithDot))
            .map(k => k.slice(prefixWithDot.length))
        },

        setMany(values: Record<string, FlagValue | null | undefined>): FlagStore {
          const prefixed: Record<string, FlagValue | null | undefined> = {}
          for (const [key, value] of Object.entries(values)) {
            prefixed[`${prefix}.${key}`] = value
          }
          store.setMany(prefixed)
          return namespacedStore
        },

        check(condition: string): boolean {
          // Auto-prefix all identifiers in the condition
          return store.check(prefixCondition(condition, prefix))
        },

        subscribe(callback: ChangeCallback): UnsubscribeFn {
          const wrappedCallback: ChangeCallback = (key, newValue, oldValue) => {
            const prefixWithDot = `${prefix}.`
            if (key.startsWith(prefixWithDot)) {
              const shortKey = key.slice(prefixWithDot.length)
              callback(shortKey, newValue, oldValue)
            }
          }
          return store.subscribe(wrappedCallback)
        },

        subscribeKey(key: string, callback: KeyChangeCallback): UnsubscribeFn {
          return store.subscribeKey(`${prefix}.${key}`, callback)
        },

        namespace(subPrefix: string): FlagStore {
          return store.namespace(`${prefix}.${subPrefix}`)
        },

        batch<T>(fn: () => T): T {
          return store.batch(fn)
        },

        compute(key: string, dependencies: string[], fn: ComputeFn): void {
          const prefixedDeps = dependencies.map(dep => `${prefix}.${dep}`)
          store.compute(`${prefix}.${key}`, prefixedDeps, fn)
        },
      }

      return namespacedStore
    },

    batch<T>(fn: () => T): T {
      batchDepth++

      // Record snapshot at start of batch
      if (batchDepth === 1) {
        batchSnapshot = getStateSnapshot()
        batchChanges = []
        recordHistory()
      }

      try {
        const result = fn()

        batchDepth--

        // End of outermost batch
        if (batchDepth === 0) {
          // Fire key-specific notifications for each change
          for (const change of batchChanges) {
            executeKeyNotifications(change.key, change.newValue, change.oldValue)
          }

          // Fire single global notification for the batch
          executeGlobalNotifications('__batch__', undefined, undefined)
          persist()

          batchSnapshot = null
          batchChanges = []
        }

        return result
      } catch (error) {
        // Rollback on error
        if (batchDepth === 1 && batchSnapshot) {
          state.clear()
          for (const [key, value] of batchSnapshot.entries()) {
            state.set(key, value)
          }
          updateAllComputedFlags()
        }

        batchDepth--
        if (batchDepth === 0) {
          batchSnapshot = null
          batchChanges = []
        }

        throw error
      }
    },

    compute(key: string, dependencies: string[], fn: ComputeFn): void {
      key = key.trim()
      validateKey(key)

      // Check for self-reference
      if (dependencies.includes(key)) {
        throw new Error(`Computed flag cannot depend on itself: ${key}`)
      }

      // Check for circular dependencies (simple check)
      for (const dep of dependencies) {
        const depComputed = computedFlags.get(dep)
        if (depComputed?.dependencies.includes(key)) {
          throw new Error(`Circular dependency detected: ${key} <-> ${dep}`)
        }
      }

      computedFlags.set(key, { dependencies, fn })

      // Compute initial value
      updateComputedFlag(key)
    },
  }

  // Add history methods if enabled
  if (historyEnabled) {
    const storeWithHistory = store as FlagStoreWithHistory

    storeWithHistory.undo = (): boolean => {
      if (undoStack.length === 0) {
        return false
      }

      const currentState = getStateSnapshot()
      redoStack.push({ state: currentState })

      const entry = undoStack.pop()
      if (entry) {
        restoreStateSnapshot(entry.state)
        persist()
      }

      return true
    }

    storeWithHistory.redo = (): boolean => {
      if (redoStack.length === 0) {
        return false
      }

      const currentState = getStateSnapshot()
      undoStack.push({ state: currentState })

      const entry = redoStack.pop()
      if (entry) {
        restoreStateSnapshot(entry.state)
        persist()
      }

      return true
    }

    storeWithHistory.canUndo = (): boolean => {
      return undoStack.length > 0
    }

    storeWithHistory.canRedo = (): boolean => {
      return redoStack.length > 0
    }

    storeWithHistory.clearHistory = (): void => {
      undoStack.length = 0
      redoStack.length = 0
    }
  }

  // Add persistence methods if enabled
  if (persistEnabled) {
    const storeWithPersistence = store as FlagStoreWithPersistence

    storeWithPersistence.save = (): void => {
      if (!storage) return

      try {
        const data: Record<string, FlagValue> = {}
        for (const [key, value] of state.entries()) {
          data[key] = value
        }
        storage.setItem(storageKey, JSON.stringify(data))
      } catch (error) {
        console.error('Failed to save state:', error)
        return
      }
    }

    storeWithPersistence.load = (): void => {
      if (!storage) return

      try {
        const data = storage.getItem(storageKey)
        if (data === null) return

        const parsed = JSON.parse(data) as Record<string, FlagValue>

        // Clear current state
        state.clear()

        // Load new state
        for (const key of Object.keys(parsed)) {
          // Skip prototype pollution keys
          if (FORBIDDEN_KEYS.has(key)) continue
          // Only process own properties
          if (!Object.hasOwn(parsed, key)) continue

          const value = parsed[key]
          const oldValue = state.get(key)
          validateKey(key)
          validateValue(value)
          state.set(key, value)
          notifyChange(key, value, oldValue)
        }

        updateAllComputedFlags()
      } catch (error) {
        console.error('Failed to load state:', error)
        return
      }
    }
  }

  return store
}

/**
 * Prefix all identifiers in a condition with a namespace
 */
function prefixCondition(condition: string, prefix: string): string {
  // This is a simplified implementation that replaces identifiers
  // A more robust solution would use the tokenizer
  const tokens = condition.match(
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:AND|OR|NOT|and|or|not|true|false|TRUE|FALSE)\b|\d+\.?\d*|[a-zA-Z_][a-zA-Z0-9_.-]*|[()!<>=]+)/gi
  )

  if (!tokens) return condition

  const result: string[] = []
  const keywords = new Set(['and', 'or', 'not', 'true', 'false'])

  for (const token of tokens) {
    // Skip strings, numbers, operators, keywords, parentheses
    if (
      token.startsWith('"') ||
      token.startsWith("'") ||
      /^[0-9]/.test(token) ||
      /^[()!<>=]+$/.test(token) ||
      keywords.has(token.toLowerCase())
    ) {
      result.push(token)
    } else {
      // It's an identifier - prefix it
      result.push(`${prefix}.${token}`)
    }
  }

  return result.join(' ')
}
