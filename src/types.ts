/**
 * Valid types for flag values in the store.
 *
 * Flags can be booleans (for feature toggles), numbers (for counters or thresholds),
 * or strings (for state values like mode or locale).
 */
export type FlagValue = boolean | number | string

/**
 * Storage interface for persisting flag state.
 *
 * Implement this interface to use any storage backend (localStorage, sessionStorage,
 * custom database, etc.).
 *
 * @example
 * ```typescript
 * const customStorage: Storage = {
 *   getItem(key: string) {
 *     return sessionStorage.getItem(key)
 *   },
 *   setItem(key: string, value: string) {
 *     sessionStorage.setItem(key, value)
 *   },
 *   removeItem(key: string) {
 *     sessionStorage.removeItem(key)
 *   }
 * }
 * ```
 */
export interface Storage {
  /**
   * Retrieves a value from storage by key.
   *
   * @param key - The storage key
   * @returns The stored value as a string, or null if the key doesn't exist
   */
  getItem(key: string): string | null

  /**
   * Stores a value in storage.
   *
   * @param key - The storage key
   * @param value - The value to store (should be a JSON-serialized string)
   */
  setItem(key: string, value: string): void

  /**
   * Removes a value from storage.
   *
   * @param key - The storage key to remove
   */
  removeItem(key: string): void
}

/**
 * Configuration options for persistent storage of flag state.
 *
 * @example
 * ```typescript
 * const persistOptions: PersistOptions = {
 *   storage: localStorage,
 *   key: 'my-app-flags',
 *   autoSave: true
 * }
 * ```
 */
export interface PersistOptions {
  /**
   * Storage implementation to use for persistence.
   * Must implement the Storage interface.
   */
  storage: Storage

  /**
   * Key used to store flags in storage.
   * Defaults to '@motioneffector/flags' if not specified.
   */
  key?: string

  /**
   * Whether to automatically save changes to storage.
   * If true, the store saves after each change. If false, use store.save() manually.
   * Defaults to true.
   */
  autoSave?: boolean
}

/**
 * Configuration options for undo/redo history tracking.
 *
 * @example
 * ```typescript
 * const historyOptions: HistoryOptions = {
 *   maxHistory: 50
 * }
 * ```
 */
export interface HistoryOptions {
  /**
   * Maximum number of state snapshots to keep in history.
   * Older snapshots are discarded when this limit is exceeded.
   * Defaults to 100.
   */
  maxHistory?: number
}

/**
 * Configuration options for creating a new flag store.
 *
 * @example
 * ```typescript
 * const options: FlagStoreOptions = {
 *   initial: { darkMode: false, language: 'en' },
 *   persist: { storage: localStorage },
 *   history: { maxHistory: 50 }
 * }
 * ```
 */
export interface FlagStoreOptions {
  /**
   * Initial flag values to set when the store is created.
   * All values must be boolean, number, or string types.
   * Flag keys cannot be empty, contain spaces, or be reserved words (AND, OR, NOT).
   */
  initial?: Record<string, FlagValue>

  /**
   * Configuration for persisting flag state to storage.
   * If provided, the store will load persisted state on creation and
   * save changes automatically (unless autoSave is disabled).
   */
  persist?: PersistOptions

  /**
   * Enable undo/redo history tracking.
   * Pass true to enable with default settings, false/undefined to disable,
   * or an object with HistoryOptions for custom configuration.
   */
  history?: boolean | HistoryOptions
}

/**
 * Callback function type for global flag changes.
 *
 * Called whenever any flag in the store changes, with the key that changed
 * and the previous/new values. The callback receives all three pieces of information
 * to allow determining whether a change is a set, delete, or modification.
 *
 * @param key - The key of the flag that changed
 * @param newValue - The new value of the flag, or undefined if deleted
 * @param oldValue - The previous value of the flag, or undefined if newly created
 *
 * @example
 * ```typescript
 * const callback: ChangeCallback = (key, newValue, oldValue) => {
 *   console.log(`Flag ${key} changed from ${oldValue} to ${newValue}`)
 * }
 * store.subscribe(callback)
 * ```
 */
export type ChangeCallback = (
  key: string,
  newValue: FlagValue | undefined,
  oldValue: FlagValue | undefined
) => void

/**
 * Callback function type for changes to a specific flag key.
 *
 * Called whenever a specific subscribed flag changes, receiving only the
 * previous and new values (not the key, since it's already known).
 *
 * @param newValue - The new value of the flag, or undefined if deleted
 * @param oldValue - The previous value of the flag, or undefined if newly created
 *
 * @example
 * ```typescript
 * const callback: KeyChangeCallback = (newValue, oldValue) => {
 *   console.log(`Value changed from ${oldValue} to ${newValue}`)
 * }
 * store.subscribeKey('darkMode', callback)
 * ```
 */
export type KeyChangeCallback = (
  newValue: FlagValue | undefined,
  oldValue: FlagValue | undefined
) => void

/**
 * Function type for unsubscribing from flag change notifications.
 *
 * Calling this function removes the associated callback from the store.
 * It's safe to call multiple times or after the store is destroyed.
 *
 * @example
 * ```typescript
 * const unsubscribe = store.subscribe(callback)
 * // Later...
 * unsubscribe() // Callback will no longer be called
 * ```
 */
export type UnsubscribeFn = () => void

/**
 * Function type for computing derived flag values based on dependencies.
 *
 * Used with store.compute() to create read-only flags that are automatically
 * updated when their dependencies change. The function receives the current values
 * of all declared dependencies in order.
 *
 * @param values - Current values of the dependent flags (in the order specified)
 * @returns The computed value (boolean, number, or string)
 *
 * @example
 * ```typescript
 * const computeFn: ComputeFn = (isAdmin, isOnline) => {
 *   return isAdmin && isOnline ? 'admin-active' : 'inactive'
 * }
 * store.compute('status', ['isAdmin', 'isOnline'], computeFn)
 * ```
 */
export type ComputeFn = (...values: Array<FlagValue | undefined>) => FlagValue

/**
 * Main interface for a flag store.
 *
 * Provides methods for managing feature flags and application state with support for:
 * - Setting, getting, and deleting flags
 * - Querying multiple flags with conditions
 * - Subscribing to changes
 * - Organizing flags with namespaces
 * - Atomic batch operations
 * - Computed (derived) flags
 *
 * When created with history or persistence options, the returned object will also
 * implement FlagStoreWithHistory or FlagStoreWithPersistence interfaces.
 *
 * @example
 * ```typescript
 * const store = createFlagStore()
 *
 * // Basic operations
 * store.set('darkMode', true)
 * store.toggle('betaFeatures')
 * store.increment('visitCount')
 *
 * // Query with conditions
 * if (store.check('darkMode and betaFeatures')) {
 *   // Both flags are true
 * }
 *
 * // Subscribe to changes
 * store.subscribe((key, newValue, oldValue) => {
 *   console.log(`${key}: ${oldValue} -> ${newValue}`)
 * })
 *
 * // Organize with namespaces
 * const userFlags = store.namespace('user')
 * userFlags.set('theme', 'dark') // Sets store key as 'user.theme'
 * ```
 */
export interface FlagStore {
  /**
   * Sets a flag to a specific value.
   *
   * Passing null or undefined deletes the flag. Flag keys are trimmed and must be
   * non-empty and not contain operators or reserved words.
   *
   * @param key - The flag key (will be trimmed)
   * @param value - The value to set (boolean, number, string) or null/undefined to delete
   * @returns The store instance for chaining
   *
   * @throws {ValidationError} If the key is invalid
   * @throws {TypeError} If the value type is not allowed
   * @throws {Error} If attempting to set a computed flag
   */
  set(key: string, value: FlagValue | null | undefined): FlagStore

  /**
   * Retrieves the value of a flag.
   *
   * @param key - The flag key (will be trimmed)
   * @returns The flag value or undefined if the flag doesn't exist
   */
  get(key: string): FlagValue | undefined

  /**
   * Checks if a flag exists in the store.
   *
   * @param key - The flag key (will be trimmed)
   * @returns True if the flag exists, false otherwise
   */
  has(key: string): boolean

  /**
   * Deletes a flag from the store.
   *
   * @param key - The flag key to delete (will be trimmed)
   * @returns The store instance for chaining
   *
   * @throws {Error} If attempting to delete a computed flag
   */
  delete(key: string): FlagStore

  /**
   * Deletes all flags from the store.
   *
   * @returns The store instance for chaining
   */
  clear(): FlagStore

  /**
   * Toggles a boolean flag.
   *
   * If the flag doesn't exist, it's created with value true.
   * If the flag is not a boolean, raises a TypeError.
   *
   * @param key - The flag key (will be trimmed)
   * @returns The new boolean value after toggling
   *
   * @throws {ValidationError} If the key is invalid
   * @throws {TypeError} If the flag exists and is not a boolean
   * @throws {Error} If attempting to toggle a computed flag
   */
  toggle(key: string): boolean

  /**
   * Increments a numeric flag by a specified amount.
   *
   * If the flag doesn't exist, it's created with the specified amount.
   * If the flag is not a number, raises a TypeError.
   *
   * @param key - The flag key (will be trimmed)
   * @param amount - The amount to increment by (defaults to 1)
   * @returns The new numeric value after incrementing
   *
   * @throws {ValidationError} If the key is invalid
   * @throws {TypeError} If the flag exists and is not a number
   * @throws {Error} If attempting to increment a computed flag
   */
  increment(key: string, amount?: number): number

  /**
   * Decrements a numeric flag by a specified amount.
   *
   * If the flag doesn't exist, it's created with the negative amount.
   * If the flag is not a number, raises a TypeError.
   *
   * @param key - The flag key (will be trimmed)
   * @param amount - The amount to decrement by (defaults to 1)
   * @returns The new numeric value after decrementing
   *
   * @throws {ValidationError} If the key is invalid
   * @throws {TypeError} If the flag exists and is not a number
   * @throws {Error} If attempting to decrement a computed flag
   */
  decrement(key: string, amount?: number): number

  /**
   * Gets all flags in the store as a plain object.
   *
   * @returns An object with all flag keys and their values
   */
  all(): Record<string, FlagValue>

  /**
   * Gets all flag keys in the store.
   *
   * @returns An array of flag keys
   */
  keys(): string[]

  /**
   * Sets multiple flags at once.
   *
   * All keys are validated before any values are set. If validation fails,
   * no changes are made (atomic validation).
   *
   * @param values - An object with flag keys and values to set
   * @returns The store instance for chaining
   *
   * @throws {ValidationError} If any key is invalid
   * @throws {TypeError} If any value type is not allowed
   */
  setMany(values: Record<string, FlagValue | null | undefined>): FlagStore

  /**
   * Checks if a set of flags satisfies a boolean condition.
   *
   * Supports logical operators (AND, OR, NOT), comparison operators,
   * and literal values. Identifiers are looked up as flag keys.
   *
   * @param condition - A condition string (e.g., "darkMode and (betaFeatures or admin)")
   * @returns True if the condition is satisfied, false otherwise
   *
   * @example
   * ```typescript
   * store.set('darkMode', true)
   * store.set('premium', false)
   * store.check('darkMode and not premium') // true
   * ```
   */
  check(condition: string): boolean

  /**
   * Subscribes to all flag changes.
   *
   * The callback is called whenever any flag in the store changes, with the key,
   * new value, and old value. The unsubscribe function can be called at any time
   * to stop receiving notifications.
   *
   * @param callback - Function to call when any flag changes
   * @returns Function to unsubscribe the callback
   *
   * @example
   * ```typescript
   * const unsubscribe = store.subscribe((key, newValue, oldValue) => {
   *   console.log(`${key}: ${oldValue} -> ${newValue}`)
   * })
   * ```
   */
  subscribe(callback: ChangeCallback): UnsubscribeFn

  /**
   * Subscribes to changes for a specific flag key.
   *
   * The callback is called whenever the specified flag changes, with the new
   * and old values (not the key, since it's already known).
   *
   * @param key - The flag key to watch
   * @param callback - Function to call when the flag changes
   * @returns Function to unsubscribe the callback
   *
   * @example
   * ```typescript
   * store.subscribeKey('darkMode', (newValue, oldValue) => {
   *   console.log(`Theme changed to ${newValue}`)
   * })
   * ```
   */
  subscribeKey(key: string, callback: KeyChangeCallback): UnsubscribeFn

  /**
   * Creates a scoped view of the store with a namespace prefix.
   *
   * All operations on the returned store automatically prefix keys with the
   * namespace. Useful for organizing related flags and avoiding key collisions.
   *
   * @param prefix - The namespace prefix
   * @returns A scoped FlagStore instance
   *
   * @example
   * ```typescript
   * const userStore = store.namespace('user')
   * userStore.set('theme', 'dark') // Actually sets 'user.theme'
   * store.get('user.theme') // 'dark'
   * ```
   */
  namespace(prefix: string): FlagStore

  /**
   * Executes a function with batched updates.
   *
   * All flag changes within the function are grouped and subscribers are notified
   * only once at the end of the batch. If the function throws, the batch is rolled
   * back to the state before the function was called.
   *
   * @param fn - Function to execute within the batch
   * @returns The return value of the function
   *
   * @example
   * ```typescript
   * store.batch(() => {
   *   store.set('flag1', true)
   *   store.set('flag2', false)
   *   // Subscribers notified once, not twice
   * })
   * ```
   */
  batch<T>(fn: () => T): T

  /**
   * Creates a computed flag that is automatically updated when its dependencies change.
   *
   * Computed flags are read-only and cannot be directly set or deleted.
   * If the compute function throws, the flag value is not updated.
   *
   * @param key - The key for the computed flag
   * @param dependencies - Array of flag keys that this flag depends on
   * @param fn - Function to compute the flag value from dependency values
   *
   * @throws {Error} If the key is already used by a non-computed flag
   * @throws {Error} If a circular dependency is detected
   * @throws {ValidationError} If the key is invalid
   *
   * @example
   * ```typescript
   * store.set('isAdmin', false)
   * store.set('isOnline', true)
   * store.compute('status', ['isAdmin', 'isOnline'], (admin, online) => {
   *   return admin && online ? 'admin-online' : 'offline'
   * })
   * store.get('status') // 'offline'
   * ```
   */
  compute(key: string, dependencies: string[], fn: ComputeFn): void
}

/**
 * Extended flag store interface with undo/redo history support.
 *
 * This interface is returned when a store is created with history enabled.
 * It extends FlagStore with methods for managing and navigating state history.
 *
 * @example
 * ```typescript
 * const store = createFlagStore({
 *   history: { maxHistory: 50 }
 * }) as FlagStoreWithHistory
 *
 * store.set('count', 1)
 * store.set('count', 2)
 * store.undo() // count goes back to 1
 * store.redo() // count goes forward to 2
 * ```
 */
export interface FlagStoreWithHistory extends FlagStore {
  /**
   * Reverts the store to its previous state.
   *
   * @returns True if an undo was performed, false if there's no history to undo
   */
  undo(): boolean

  /**
   * Applies the next state in the redo stack.
   *
   * The redo stack is cleared whenever a new change is made after an undo.
   *
   * @returns True if a redo was performed, false if there's no history to redo
   */
  redo(): boolean

  /**
   * Checks if there are undoable states.
   *
   * @returns True if undo() can be called successfully, false otherwise
   */
  canUndo(): boolean

  /**
   * Checks if there are redoable states.
   *
   * @returns True if redo() can be called successfully, false otherwise
   */
  canRedo(): boolean

  /**
   * Clears all undo and redo history.
   *
   * This operation cannot be undone.
   */
  clearHistory(): void
}

/**
 * Extended flag store interface with persistence support.
 *
 * This interface is returned when a store is created with persistence enabled.
 * It extends FlagStore with methods for manual save/load operations (in addition
 * to automatic saving if autoSave is enabled).
 *
 * @example
 * ```typescript
 * const store = createFlagStore({
 *   persist: { storage: localStorage }
 * }) as FlagStoreWithPersistence
 *
 * store.set('count', 1)
 * store.save() // Explicitly save to storage
 * store.load() // Explicitly load from storage
 * ```
 */
export interface FlagStoreWithPersistence extends FlagStore {
  /**
   * Manually saves all flags to persistent storage.
   *
   * Typically called when autoSave is disabled or when you want to ensure
   * changes are persisted immediately. If storage is unavailable, errors
   * are logged to console but not thrown.
   */
  save(): void

  /**
   * Manually loads all flags from persistent storage.
   *
   * This clears the current store state and loads persisted values.
   * Subscribers are notified of all loaded values. If storage is unavailable
   * or contains invalid data, errors are logged but not thrown.
   */
  load(): void
}
