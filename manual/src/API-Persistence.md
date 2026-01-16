# Persistence API

Manual save and load operations for stores created with persistence enabled.

These methods are only available when the store is created with a `persist` option.

---

## `save()`

Manually saves all flags to persistent storage.

**Signature:**

```typescript
save(): void
```

**Returns:** `void`

**Example:**

```typescript
const store = createFlagStore({
  persist: { storage: localStorage, autoSave: false }
})

store.set('gold', 100)
store.set('level', 5)

// Changes not yet saved (autoSave is false)

store.save()  // Now saved to localStorage
```

Note: If storage is unavailable or throws an error, the error is logged to `console.error` but not thrown.

---

## `load()`

Manually loads all flags from persistent storage.

**Signature:**

```typescript
load(): void
```

**Returns:** `void`

**Example:**

```typescript
const store = createFlagStore({
  persist: { storage: localStorage, autoSave: false }
})

// Assume localStorage has previously saved data
store.load()  // Loads and overwrites current state

console.log(store.get('gold'))  // Value from storage
```

Note:
- This clears the current store state and loads persisted values
- Subscribers are notified of all loaded values
- If storage is unavailable or contains invalid data, errors are logged but not thrown

---

## Behavior Details

### Auto-Save (Default)

By default, `autoSave` is `true` and changes are saved automatically:

```typescript
const store = createFlagStore({
  persist: { storage: localStorage }
})

store.set('gold', 100)  // Automatically saved
store.increment('gold') // Automatically saved
store.delete('gold')    // Automatically saved
```

### Manual Save Mode

Disable auto-save for manual control:

```typescript
const store = createFlagStore({
  persist: { storage: localStorage, autoSave: false }
})

store.set('a', 1)    // NOT saved
store.set('b', 2)    // NOT saved
store.save()         // NOW saved
```

### Auto-Load on Creation

When persistence is enabled, the store automatically loads from storage on creation:

```typescript
// First session
const store1 = createFlagStore({
  persist: { storage: localStorage }
})
store1.set('gold', 500)

// Later session (new page load)
const store2 = createFlagStore({
  persist: { storage: localStorage }
})
store2.get('gold')  // 500 (loaded automatically)
```

### Initial Values vs Persisted

Persisted data takes precedence over initial values:

```typescript
// Assume localStorage has { gold: 500 } from previous session

const store = createFlagStore({
  initial: { gold: 0 },  // Ignored if persisted data exists
  persist: { storage: localStorage }
})

store.get('gold')  // 500 (from storage, not 0)
```

### Custom Storage Key

Avoid conflicts with multiple stores by using different keys:

```typescript
const gameStore = createFlagStore({
  persist: { storage: localStorage, key: 'my-game-state' }
})

const settingsStore = createFlagStore({
  persist: { storage: localStorage, key: 'my-app-settings' }
})
```

Default key is `'@motioneffector/flags'`.

### Type Preservation

Types are preserved through serialization:

```typescript
store.set('bool', true)
store.set('num', 42)
store.set('str', 'hello')
store.save()

// After reload
store.load()
typeof store.get('bool')  // 'boolean'
typeof store.get('num')   // 'number'
typeof store.get('str')   // 'string'
```

### Error Handling

Storage errors are caught and logged, not thrown:

```typescript
const failingStorage = {
  getItem: () => { throw new Error('Storage unavailable') },
  setItem: () => { throw new Error('Storage unavailable') },
  removeItem: () => { throw new Error('Storage unavailable') }
}

const store = createFlagStore({
  persist: { storage: failingStorage }
})

// No error thrown, store still works in-memory
store.set('x', 1)
store.get('x')  // 1
```

### Corrupted Data

Invalid JSON in storage is handled gracefully:

```typescript
localStorage.setItem('@motioneffector/flags', 'invalid{json')

const store = createFlagStore({
  persist: { storage: localStorage }
})

// Error logged, store starts fresh
store.get('anything')  // undefined
```

---

## Types

### `FlagStoreWithPersistence`

```typescript
interface FlagStoreWithPersistence extends FlagStore {
  save(): void
  load(): void
}
```

Cast the store to access persistence methods:

```typescript
import { createFlagStore, FlagStoreWithPersistence } from '@motioneffector/flags'

const store = createFlagStore({
  persist: { storage: localStorage }
}) as FlagStoreWithPersistence

store.save()  // TypeScript knows this exists
```

### `Storage`

```typescript
interface Storage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
```

Implement this interface for custom storage backends. `localStorage` and `sessionStorage` both satisfy this interface.

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
| `storage` | `Storage` | Yes | Storage backend to use |
| `key` | `string` | No | Storage key. Default: `'@motioneffector/flags'` |
| `autoSave` | `boolean` | No | Auto-save on changes. Default: `true` |
