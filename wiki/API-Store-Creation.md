# Store Creation API

Create and configure flag stores.

---

## `createFlagStore()`

Creates a new flag store with optional initial values, persistence, and history tracking.

**Signature:**

```typescript
function createFlagStore(options?: FlagStoreOptions): FlagStore
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `options` | `FlagStoreOptions` | No | Configuration options for the store |

**Returns:** `FlagStore` — A new flag store instance. If history or persistence options are provided, the returned store also implements `FlagStoreWithHistory` or `FlagStoreWithPersistence`.

**Example:**

```typescript
import { createFlagStore } from '@motioneffector/flags'

// Basic store
const store = createFlagStore()

// With initial values
const store = createFlagStore({
  initial: { gold: 0, level: 1, name: 'Hero' }
})

// With persistence
const store = createFlagStore({
  persist: { storage: localStorage }
})

// With history
const store = createFlagStore({
  history: true
})

// Full configuration
const store = createFlagStore({
  initial: { gold: 0 },
  persist: { storage: localStorage, key: 'my-app', autoSave: true },
  history: { maxHistory: 50 }
})
```

---

## Types

### `FlagStoreOptions`

```typescript
interface FlagStoreOptions {
  initial?: Record<string, FlagValue>
  persist?: PersistOptions
  history?: boolean | HistoryOptions
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `initial` | `Record<string, FlagValue>` | No | Initial flag values. All values must be boolean, number, or string. |
| `persist` | `PersistOptions` | No | Persistence configuration. If provided, state is saved/loaded automatically. |
| `history` | `boolean \| HistoryOptions` | No | Enable undo/redo. Pass `true` for defaults or an options object. |

### `PersistOptions`

```typescript
interface PersistOptions {
  storage: Storage
  key?: string
  autoSave?: boolean
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `storage` | `Storage` | Yes | Storage backend (e.g., `localStorage`, `sessionStorage`). |
| `key` | `string` | No | Storage key. Default: `'@motioneffector/flags'`. |
| `autoSave` | `boolean` | No | Auto-save on changes. Default: `true`. |

### `HistoryOptions`

```typescript
interface HistoryOptions {
  maxHistory?: number
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `maxHistory` | `number` | No | Maximum history entries. Default: `100`. |

### `Storage`

```typescript
interface Storage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
```

The standard Web Storage interface. `localStorage` and `sessionStorage` both implement this.

### `FlagValue`

```typescript
type FlagValue = boolean | number | string
```

Valid types for flag values. Objects, arrays, null, and undefined are not allowed as stored values.
