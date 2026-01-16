# Persisting State

Save your flag store to localStorage (or any storage backend) so state survives page reloads and browser sessions.

## Prerequisites

Before starting, you should:

- [Understand how the Flag Store works](Concept-Flag-Store)

## Overview

We'll persist state by:

1. Configuring the store with a `persist` option
2. Understanding auto-save behavior
3. Using a custom storage key
4. Handling storage errors

## Step 1: Enable Persistence

Pass a `persist` option with your storage backend:

```typescript
import { createFlagStore } from '@motioneffector/flags'

const store = createFlagStore({
  initial: { gold: 0, level: 1 },
  persist: {
    storage: localStorage
  }
})
```

The store now automatically saves to localStorage after every change and loads existing data on creation.

## Step 2: Understand Auto-Save

By default, every change triggers a save:

```typescript
store.set('gold', 100)      // Saved automatically
store.increment('level')    // Saved automatically
store.toggle('has_sword')   // Saved automatically
```

Disable auto-save if you want manual control:

```typescript
const store = createFlagStore({
  persist: {
    storage: localStorage,
    autoSave: false
  }
})

store.set('gold', 100)   // NOT saved
store.set('level', 5)    // NOT saved

store.save()             // NOW saved
```

## Step 3: Use a Custom Storage Key

The default key is `@motioneffector/flags`. Use a custom key to avoid conflicts:

```typescript
const store = createFlagStore({
  persist: {
    storage: localStorage,
    key: 'my-game-save'
  }
})
```

Multiple stores can coexist with different keys:

```typescript
const gameStore = createFlagStore({
  persist: { storage: localStorage, key: 'game-state' }
})

const settingsStore = createFlagStore({
  persist: { storage: localStorage, key: 'user-settings' }
})
```

## Step 4: Handle Initial Values vs Persisted State

When both `initial` and `persist` are provided, persisted data wins:

```typescript
// First run (nothing in localStorage)
const store = createFlagStore({
  initial: { gold: 0 },
  persist: { storage: localStorage }
})
store.get('gold')  // 0 (from initial)

store.set('gold', 500)  // Saved to localStorage

// Later / page reload
const store2 = createFlagStore({
  initial: { gold: 0 },  // Ignored
  persist: { storage: localStorage }
})
store2.get('gold')  // 500 (from localStorage)
```

Use `initial` as defaults for first-time users. Persisted data overrides them.

## Complete Example

```typescript
import { createFlagStore } from '@motioneffector/flags'

const store = createFlagStore({
  initial: {
    gold: 0,
    level: 1,
    has_sword: false,
    player_name: 'Hero'
  },
  persist: {
    storage: localStorage,
    key: 'my-rpg-save'
  }
})

// All changes are automatically saved
store.set('player_name', 'Ada')
store.increment('gold', 100)
store.set('has_sword', true)

// On page reload, state is restored automatically
```

## Variations

### Using sessionStorage

For state that should clear when the browser closes:

```typescript
const store = createFlagStore({
  persist: { storage: sessionStorage }
})
```

### Custom Storage Backend

Implement the `Storage` interface for custom backends:

```typescript
const customStorage = {
  getItem(key: string): string | null {
    // Read from your backend
    return myDatabase.get(key)
  },
  setItem(key: string, value: string): void {
    // Write to your backend
    myDatabase.set(key, value)
  },
  removeItem(key: string): void {
    // Delete from your backend
    myDatabase.delete(key)
  }
}

const store = createFlagStore({
  persist: { storage: customStorage }
})
```

### Manual Save/Load

With `autoSave: false`, use explicit save/load:

```typescript
const store = createFlagStore({
  persist: { storage: localStorage, autoSave: false }
})

// Make many changes
store.set('a', 1)
store.set('b', 2)
store.set('c', 3)

// Save once at the end
store.save()

// Later, reload from storage
store.load()
```

## Troubleshooting

### State Not Persisting

**Symptom:** Changes are lost on page reload.

**Cause:** Storage might be unavailable (private browsing) or full.

**Solution:** The store logs errors to console but doesn't throw. Check for `console.error` messages about failed persistence.

### Conflicting Data

**Symptom:** Multiple apps/tabs overwrite each other's data.

**Cause:** Using the same storage key.

**Solution:** Use unique keys per store: `persist: { key: 'my-app-flags' }`.

### Corrupted Data

**Symptom:** Store doesn't load or has wrong values.

**Cause:** Manual edits to localStorage or incompatible data format.

**Solution:** The store handles corrupted JSON gracefully (logs error, starts fresh). Clear localStorage manually if needed.

## See Also

- **[Flag Store](Concept-Flag-Store)** - How values are stored
- **[API: Persistence](API-Persistence)** - `save()` and `load()` reference
