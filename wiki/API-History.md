# History API

Undo and redo operations for stores created with history enabled.

These methods are only available when the store is created with `history: true` or `history: { ... }`.

---

## `undo()`

Reverts the store to its previous state.

**Signature:**

```typescript
undo(): boolean
```

**Returns:** `boolean` — `true` if an undo was performed, `false` if there's nothing to undo.

**Example:**

```typescript
const store = createFlagStore({ history: true })

store.set('count', 1)
store.set('count', 2)
store.set('count', 3)

store.undo()           // true
store.get('count')     // 2

store.undo()           // true
store.get('count')     // 1

store.undo()           // true
store.get('count')     // undefined (initial state)

store.undo()           // false (nothing left to undo)
```

---

## `redo()`

Re-applies the next state in the redo stack.

**Signature:**

```typescript
redo(): boolean
```

**Returns:** `boolean` — `true` if a redo was performed, `false` if there's nothing to redo.

**Example:**

```typescript
const store = createFlagStore({ history: true })

store.set('count', 1)
store.set('count', 2)

store.undo()           // count: 1
store.redo()           // true, count: 2
store.redo()           // false (nothing to redo)
```

Note: The redo stack is cleared when a new change is made after an undo.

```typescript
store.set('count', 1)
store.set('count', 2)
store.undo()           // count: 1
store.set('count', 3)  // New change clears redo stack
store.redo()           // false (redo stack was cleared)
```

---

## `canUndo()`

Checks if there are undoable states.

**Signature:**

```typescript
canUndo(): boolean
```

**Returns:** `boolean` — `true` if `undo()` can be called successfully.

**Example:**

```typescript
const store = createFlagStore({ history: true })

store.canUndo()        // false (fresh store)

store.set('x', 1)
store.canUndo()        // true

store.undo()
store.canUndo()        // false
```

---

## `canRedo()`

Checks if there are redoable states.

**Signature:**

```typescript
canRedo(): boolean
```

**Returns:** `boolean` — `true` if `redo()` can be called successfully.

**Example:**

```typescript
const store = createFlagStore({ history: true })

store.canRedo()        // false (fresh store)

store.set('x', 1)
store.canRedo()        // false (no undos yet)

store.undo()
store.canRedo()        // true

store.redo()
store.canRedo()        // false (redo stack exhausted)
```

---

## `clearHistory()`

Clears all undo and redo history.

**Signature:**

```typescript
clearHistory(): void
```

**Returns:** `void`

**Example:**

```typescript
const store = createFlagStore({ history: true })

store.set('x', 1)
store.set('x', 2)
store.undo()

store.canUndo()        // true
store.canRedo()        // true

store.clearHistory()

store.canUndo()        // false
store.canRedo()        // false
store.get('x')         // 1 (current state preserved)
```

---

## Behavior Details

### Subscriptions Fire Normally

Undo and redo operations trigger subscriptions:

```typescript
store.subscribe((key, newVal, oldVal) => {
  console.log(`${key}: ${oldVal} -> ${newVal}`)
})

store.set('x', 1)      // Logs: "x: undefined -> 1"
store.set('x', 2)      // Logs: "x: 1 -> 2"
store.undo()           // Logs: "x: 2 -> 1"
store.redo()           // Logs: "x: 1 -> 2"
```

### Batch as Single Step

Batch operations create a single undo step:

```typescript
store.batch(() => {
  store.set('a', 1)
  store.set('b', 2)
  store.set('c', 3)
})

store.undo()           // Reverts ALL three changes
store.get('a')         // undefined
store.get('b')         // undefined
store.get('c')         // undefined
```

### setMany as Single Step

`setMany()` also creates a single undo step:

```typescript
store.setMany({ a: 1, b: 2, c: 3 })

store.undo()           // Reverts all three
```

### History Limit

Configure maximum history size to limit memory usage:

```typescript
const store = createFlagStore({
  history: { maxHistory: 10 }
})

// Make 15 changes
for (let i = 0; i < 15; i++) {
  store.set('x', i)
}

// Can only undo 10 times (oldest 5 discarded)
let undoCount = 0
while (store.canUndo()) {
  store.undo()
  undoCount++
}
// undoCount === 10
```

Default `maxHistory` is 100.

### With Persistence

History operations are persisted when persistence is enabled:

```typescript
const store = createFlagStore({
  history: true,
  persist: { storage: localStorage }
})

store.set('x', 1)      // Saved
store.set('x', 2)      // Saved
store.undo()           // Saved (x reverts to 1)
```

---

## Types

### `FlagStoreWithHistory`

```typescript
interface FlagStoreWithHistory extends FlagStore {
  undo(): boolean
  redo(): boolean
  canUndo(): boolean
  canRedo(): boolean
  clearHistory(): void
}
```

Cast the store to access history methods:

```typescript
import { createFlagStore, FlagStoreWithHistory } from '@motioneffector/flags'

const store = createFlagStore({ history: true }) as FlagStoreWithHistory

store.undo()  // TypeScript knows this exists
```
