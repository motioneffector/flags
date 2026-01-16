# Types API

TypeScript type definitions for the flag store.

---

## Core Types

### `FlagValue`

Valid types for flag values.

```typescript
type FlagValue = boolean | number | string
```

Only these three types can be stored in the flag store. Objects, arrays, null, and undefined are not valid stored values.

---

### `FlagStore`

Main interface for a flag store.

```typescript
interface FlagStore {
  // Reading
  get(key: string): FlagValue | undefined
  has(key: string): boolean
  all(): Record<string, FlagValue>
  keys(): string[]

  // Writing
  set(key: string, value: FlagValue | null | undefined): FlagStore
  delete(key: string): FlagStore
  clear(): FlagStore
  setMany(values: Record<string, FlagValue | null | undefined>): FlagStore

  // Specialized writes
  toggle(key: string): boolean
  increment(key: string, amount?: number): number
  decrement(key: string, amount?: number): number

  // Queries
  check(condition: string): boolean

  // Subscriptions
  subscribe(callback: ChangeCallback): UnsubscribeFn
  subscribeKey(key: string, callback: KeyChangeCallback): UnsubscribeFn

  // Organization
  namespace(prefix: string): FlagStore
  batch<T>(fn: () => T): T
  compute(key: string, dependencies: string[], fn: ComputeFn): void
}
```

---

### `FlagStoreWithHistory`

Extended store with undo/redo support.

```typescript
interface FlagStoreWithHistory extends FlagStore {
  undo(): boolean
  redo(): boolean
  canUndo(): boolean
  canRedo(): boolean
  clearHistory(): void
}
```

Returned when store is created with `history: true`.

---

### `FlagStoreWithPersistence`

Extended store with persistence support.

```typescript
interface FlagStoreWithPersistence extends FlagStore {
  save(): void
  load(): void
}
```

Returned when store is created with `persist: { ... }`.

---

## Configuration Types

### `FlagStoreOptions`

Options for `createFlagStore()`.

```typescript
interface FlagStoreOptions {
  initial?: Record<string, FlagValue>
  persist?: PersistOptions
  history?: boolean | HistoryOptions
}
```

| Property | Type | Description |
|----------|------|-------------|
| `initial` | `Record<string, FlagValue>` | Initial flag values |
| `persist` | `PersistOptions` | Persistence configuration |
| `history` | `boolean \| HistoryOptions` | History/undo configuration |

---

### `PersistOptions`

Options for persistent storage.

```typescript
interface PersistOptions {
  storage: Storage
  key?: string
  autoSave?: boolean
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `storage` | `Storage` | (required) | Storage backend |
| `key` | `string` | `'@motioneffector/flags'` | Storage key |
| `autoSave` | `boolean` | `true` | Auto-save changes |

---

### `HistoryOptions`

Options for undo/redo history.

```typescript
interface HistoryOptions {
  maxHistory?: number
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `maxHistory` | `number` | `100` | Maximum history entries |

---

### `Storage`

Interface for storage backends.

```typescript
interface Storage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
```

Compatible with `localStorage` and `sessionStorage`.

---

## Callback Types

### `ChangeCallback`

Callback for global subscriptions.

```typescript
type ChangeCallback = (
  key: string,
  newValue: FlagValue | undefined,
  oldValue: FlagValue | undefined
) => void
```

| Parameter | Description |
|-----------|-------------|
| `key` | The flag key that changed |
| `newValue` | New value, or `undefined` if deleted |
| `oldValue` | Previous value, or `undefined` if new |

---

### `KeyChangeCallback`

Callback for key-specific subscriptions.

```typescript
type KeyChangeCallback = (
  newValue: FlagValue | undefined,
  oldValue: FlagValue | undefined
) => void
```

| Parameter | Description |
|-----------|-------------|
| `newValue` | New value, or `undefined` if deleted |
| `oldValue` | Previous value, or `undefined` if new |

---

### `UnsubscribeFn`

Function to stop receiving notifications.

```typescript
type UnsubscribeFn = () => void
```

Safe to call multiple times.

---

### `ComputeFn`

Function for computing derived values.

```typescript
type ComputeFn = (...values: Array<FlagValue | undefined>) => FlagValue
```

Receives dependency values in order, must return a `FlagValue`.

---

## Type Casting

When using history or persistence, cast to access additional methods:

```typescript
import {
  createFlagStore,
  FlagStoreWithHistory,
  FlagStoreWithPersistence
} from '@motioneffector/flags'

// History store
const historyStore = createFlagStore({
  history: true
}) as FlagStoreWithHistory

historyStore.undo()
historyStore.canRedo()

// Persistence store
const persistStore = createFlagStore({
  persist: { storage: localStorage }
}) as FlagStoreWithPersistence

persistStore.save()
persistStore.load()

// Both features
const fullStore = createFlagStore({
  history: true,
  persist: { storage: localStorage }
}) as FlagStoreWithHistory & FlagStoreWithPersistence

fullStore.undo()
fullStore.save()
```
