# Batch Operations

Group multiple changes into a single atomic operation. Subscribers are notified once at the end, and with history enabled, the entire batch becomes one undo step.

## Prerequisites

Before starting, you should:

- [Understand Subscriptions](Concept-Subscriptions)
- Optionally, [Understand Undo/Redo History](Guide-Undo-Redo-History)

## Overview

We'll use batch operations to:

1. Group changes for single notification
2. Create atomic undo steps
3. Handle errors with automatic rollback

## Step 1: Basic Batching

Wrap multiple operations in `batch()`:

```typescript
import { createFlagStore } from '@motioneffector/flags'

const store = createFlagStore()

store.subscribe(() => {
  console.log('Store changed')
})

// Without batch: 3 notifications
store.set('a', 1)  // "Store changed"
store.set('b', 2)  // "Store changed"
store.set('c', 3)  // "Store changed"

// With batch: 1 notification
store.batch(() => {
  store.set('x', 1)
  store.set('y', 2)
  store.set('z', 3)
})  // "Store changed" (once)
```

## Step 2: Batch with History

With history enabled, a batch becomes one undo step:

```typescript
const store = createFlagStore({ history: true })

store.set('score', 0)

store.batch(() => {
  store.increment('score', 10)
  store.increment('score', 20)
  store.increment('score', 30)
})

store.get('score')  // 60

// Single undo reverts the entire batch
store.undo()
store.get('score')  // 0
```

## Step 3: Handle Errors

If an error occurs inside `batch()`, all changes are rolled back:

```typescript
const store = createFlagStore()
store.set('count', 0)

try {
  store.batch(() => {
    store.set('count', 100)
    store.set('name', 'test')
    throw new Error('Something went wrong')
  })
} catch (e) {
  // Error propagates
}

// State is unchanged
store.get('count')  // 0
store.has('name')   // false
```

No notifications fire when a batch errors.

## Complete Example

```typescript
import { createFlagStore, FlagStoreWithHistory } from '@motioneffector/flags'

const store = createFlagStore({
  initial: {
    player_health: 100,
    player_gold: 0,
    enemy_health: 50
  },
  history: true
}) as FlagStoreWithHistory

// Subscribe to see notification count
let notificationCount = 0
store.subscribe(() => notificationCount++)

// Combat round as a batch
store.batch(() => {
  // Player attacks enemy
  store.decrement('enemy_health', 25)

  // Enemy attacks player
  store.decrement('player_health', 10)

  // Player loots gold
  store.increment('player_gold', 15)
})

console.log(notificationCount)  // 1 (not 3)

// Undo the entire combat round
store.undo()
console.log(store.get('player_health'))  // 100
console.log(store.get('enemy_health'))   // 50
console.log(store.get('player_gold'))    // 0
```

## Variations

### Nested Batches

Nested batches are flattened into the outermost batch:

```typescript
store.batch(() => {
  store.set('a', 1)

  store.batch(() => {
    store.set('b', 2)
  })  // No notification here

  store.set('c', 3)
})  // Single notification here
```

### Batch Return Value

`batch()` returns whatever your function returns:

```typescript
const result = store.batch(() => {
  store.set('gold', 100)
  return store.get('gold')
})

console.log(result)  // 100
```

### Batch with Key Subscriptions

Key-specific subscriptions fire once per affected key:

```typescript
store.subscribeKey('a', () => console.log('a changed'))
store.subscribeKey('b', () => console.log('b changed'))

store.batch(() => {
  store.set('a', 1)
  store.set('b', 2)
})
// Logs: "a changed"
// Logs: "b changed"
// (each once, after batch completes)
```

### Batch with Persistence

Batched changes are saved once at the end:

```typescript
const store = createFlagStore({
  persist: { storage: localStorage }
})

store.batch(() => {
  store.set('a', 1)
  store.set('b', 2)
  store.set('c', 3)
})  // Single save to localStorage
```

## Troubleshooting

### Changes Not Rolled Back

**Symptom:** Error in batch but changes persist.

**Cause:** Error occurred outside the batch function.

**Solution:** Ensure the throwing code is inside the `batch()` callback.

### Too Many Notifications

**Symptom:** Subscribers fire multiple times during batch.

**Cause:** You're not inside a batch, or using nested stores.

**Solution:** Wrap all related changes in a single `batch()` call.

### Nested Batch Confusion

**Symptom:** Inner batch seems to trigger notifications.

**Cause:** Misunderstanding - nested batches don't trigger until outermost completes.

**Solution:** This is expected. Only the outermost batch triggers notifications.

## See Also

- **[Subscriptions](Concept-Subscriptions)** - How notifications work
- **[Undo/Redo History](Guide-Undo-Redo-History)** - Batches as undo steps
- **[API: Batch Operations](API-Batch-Operations)** - Full method reference
