# Undo/Redo History

Add time-travel debugging to your application. Every change is recorded, letting users undo mistakes and redo actions.

## Prerequisites

Before starting, you should:

- [Understand how the Flag Store works](Concept-Flag-Store)

## Overview

We'll implement undo/redo by:

1. Enabling history on the store
2. Using `undo()` and `redo()` methods
3. Checking `canUndo()` and `canRedo()` for UI state
4. Configuring history depth

## Step 1: Enable History

Pass `history: true` when creating the store:

```typescript
import { createFlagStore } from '@motioneffector/flags'

const store = createFlagStore({
  initial: { count: 0 },
  history: true
})
```

The store now tracks every change. The returned store has `undo()`, `redo()`, `canUndo()`, `canRedo()`, and `clearHistory()` methods.

## Step 2: Undo and Redo Changes

Call `undo()` to revert the last change, `redo()` to restore it:

```typescript
store.set('count', 1)
store.set('count', 2)
store.set('count', 3)

store.get('count')  // 3

store.undo()
store.get('count')  // 2

store.undo()
store.get('count')  // 1

store.redo()
store.get('count')  // 2
```

Both methods return `true` if an action was taken, `false` if there's nothing to undo/redo.

## Step 3: Check Undo/Redo Availability

Use `canUndo()` and `canRedo()` to update UI state:

```typescript
// Enable/disable undo button
undoButton.disabled = !store.canUndo()

// Enable/disable redo button
redoButton.disabled = !store.canRedo()
```

## Step 4: Configure History Depth

Limit memory usage by capping history size:

```typescript
const store = createFlagStore({
  history: {
    maxHistory: 50  // Keep only last 50 states
  }
})
```

Default is 100 entries. Older entries are discarded when the limit is reached.

## Complete Example

```typescript
import { createFlagStore, FlagStoreWithHistory } from '@motioneffector/flags'

const store = createFlagStore({
  initial: { text: '' },
  history: { maxHistory: 100 }
}) as FlagStoreWithHistory

// Simulate user typing
store.set('text', 'H')
store.set('text', 'He')
store.set('text', 'Hel')
store.set('text', 'Hell')
store.set('text', 'Hello')

console.log(store.get('text'))  // "Hello"

// User presses Ctrl+Z
store.undo()
console.log(store.get('text'))  // "Hell"

store.undo()
console.log(store.get('text'))  // "Hel"

// User presses Ctrl+Y
store.redo()
console.log(store.get('text'))  // "Hell"

// User types something new (clears redo stack)
store.set('text', 'Help')
console.log(store.canRedo())    // false
```

## Variations

### Undo/Redo with Subscriptions

History operations trigger subscriptions normally:

```typescript
store.subscribe((key, newValue, oldValue) => {
  console.log(`${key}: ${oldValue} -> ${newValue}`)
})

store.set('count', 10)  // Logs: "count: 0 -> 10"
store.undo()            // Logs: "count: 10 -> 0"
store.redo()            // Logs: "count: 0 -> 10"
```

### Batch Operations as Single Undo Step

Use `batch()` to group changes into one undo step:

```typescript
store.batch(() => {
  store.set('a', 1)
  store.set('b', 2)
  store.set('c', 3)
})

// Single undo reverts all three changes
store.undo()
store.get('a')  // undefined
store.get('b')  // undefined
store.get('c')  // undefined
```

### Clear History

Start fresh without clearing data:

```typescript
store.set('count', 100)
store.clearHistory()

console.log(store.get('count'))  // 100 (data preserved)
console.log(store.canUndo())     // false (history cleared)
```

### Combined with Persistence

History works alongside persistence:

```typescript
const store = createFlagStore({
  initial: { count: 0 },
  history: true,
  persist: { storage: localStorage }
})

// Changes are saved AND tracked for undo
store.set('count', 10)
store.undo()  // Also saves the undone state
```

## Troubleshooting

### Undo Does Nothing

**Symptom:** `undo()` returns `false`.

**Cause:** No history to undo (fresh store or history cleared).

**Solution:** Check `canUndo()` before calling `undo()`.

### Redo Not Working

**Symptom:** `redo()` returns `false` after undo.

**Cause:** A new change was made after undo, which clears the redo stack.

**Solution:** This is expected behavior. Any new change after undo starts a new history branch.

### Memory Usage

**Symptom:** High memory consumption.

**Cause:** Large history with many state snapshots.

**Solution:** Lower `maxHistory` or call `clearHistory()` at logical breakpoints.

## See Also

- **[Batch Operations](Guide-Batch-Operations)** - Group changes into single undo steps
- **[Flag Store](Concept-Flag-Store)** - Core store operations
- **[API: History](API-History)** - Full method reference
