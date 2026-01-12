export type FlagValue = boolean | number | string

export interface Storage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface PersistOptions {
  storage: Storage
  key?: string
  autoSave?: boolean
}

export interface HistoryOptions {
  maxHistory?: number
}

export interface FlagStoreOptions {
  initial?: Record<string, FlagValue>
  persist?: PersistOptions
  history?: boolean | HistoryOptions
}

export type ChangeCallback = (key: string, newValue: FlagValue | undefined, oldValue: FlagValue | undefined) => void

export type KeyChangeCallback = (newValue: FlagValue | undefined, oldValue: FlagValue | undefined) => void

export type UnsubscribeFn = () => void

export type ComputeFn = (...values: Array<FlagValue | undefined>) => FlagValue

export interface FlagStore {
  set(key: string, value: FlagValue | null | undefined): FlagStore
  get(key: string): FlagValue | undefined
  has(key: string): boolean
  delete(key: string): FlagStore
  clear(): FlagStore

  toggle(key: string): boolean
  increment(key: string, amount?: number): number
  decrement(key: string, amount?: number): number

  all(): Record<string, FlagValue>
  keys(): string[]
  setMany(values: Record<string, FlagValue | null | undefined>): FlagStore

  check(condition: string): boolean

  subscribe(callback: ChangeCallback): UnsubscribeFn
  subscribeKey(key: string, callback: KeyChangeCallback): UnsubscribeFn

  namespace(prefix: string): FlagStore

  batch<T>(fn: () => T): T

  compute(key: string, dependencies: string[], fn: ComputeFn): void
}

export interface FlagStoreWithHistory extends FlagStore {
  undo(): boolean
  redo(): boolean
  canUndo(): boolean
  canRedo(): boolean
  clearHistory(): void
}

export interface FlagStoreWithPersistence extends FlagStore {
  save(): void
  load(): void
}
