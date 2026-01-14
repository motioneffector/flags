# Batch Operations API

Group multiple changes into a single atomic operation.

---

## `batch()`

Executes a function with batched updates. All changes are grouped and subscribers are notified once at the end.

**Signature:**

```typescript
batch<T>(fn: () => T): T
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `fn` | `() => T` | Yes | Function to execute within the batch |

**Returns:** `T` — The return value of the function.

**Throws:**

- Re-throws any error from the function (after rolling back changes)

**Example:**

```typescript
// Without batch: 3 notifications
store.set('a', 1)
store.set('b', 2)
store.set('c', 3)

// With batch: 1 notification
store.batch(() => {
  store.set('x', 1)
  store.set('y', 2)
  store.set('z', 3)
})
```

---

## Behavior Details

### Single Notification

Subscribers are notified once after the batch completes:

```typescript
let notifyCount = 0
store.subscribe(() => notifyCount++)

store.batch(() => {
  store.set('a', 1)
  store.set('b', 2)
  store.set('c', 3)
})

console.log(notifyCount)  // 1
```

### Return Value

The batch returns whatever your function returns:

```typescript
const result = store.batch(() => {
  store.set('gold', 100)
  return store.get('gold')
})

console.log(result)  // 100
```

### Error Rollback

If the function throws, all changes are rolled back:

```typescript
store.set('count', 0)

try {
  store.batch(() => {
    store.set('count', 100)
    store.set('name', 'test')
    throw new Error('Oops')
  })
} catch (e) {
  // Error propagates
}

store.get('count')   // 0 (rolled back)
store.has('name')    // false (rolled back)
```

### No Notifications on Error

If a batch errors, no notifications are fired:

```typescript
let notified = false
store.subscribe(() => notified = true)

try {
  store.batch(() => {
    store.set('x', 1)
    throw new Error('Oops')
  })
} catch (e) {}

console.log(notified)  // false
```

### Nested Batches

Nested batches are flattened into the outermost batch:

```typescript
let notifyCount = 0
store.subscribe(() => notifyCount++)

store.batch(() => {
  store.set('a', 1)

  store.batch(() => {
    store.set('b', 2)
  })  // No notification here

  store.set('c', 3)
})  // Single notification here

console.log(notifyCount)  // 1
```

### Single History Step

With history enabled, a batch creates a single undo step:

```typescript
const store = createFlagStore({ history: true })

store.batch(() => {
  store.set('a', 1)
  store.set('b', 2)
  store.set('c', 3)
})

store.undo()  // Reverts ALL three changes

store.get('a')  // undefined
store.get('b')  // undefined
store.get('c')  // undefined
```

### Key Subscriptions

Key-specific subscriptions fire once per affected key after the batch:

```typescript
store.subscribeKey('a', () => console.log('a changed'))
store.subscribeKey('b', () => console.log('b changed'))
store.subscribeKey('c', () => console.log('c changed'))

store.batch(() => {
  store.set('a', 1)
  store.set('b', 2)
})

// After batch:
// Logs: "a changed"
// Logs: "b changed"
// (c not logged - wasn't changed)
```

### All Operations Work

Any store operation works inside a batch:

```typescript
store.batch(() => {
  store.set('flag', true)
  store.toggle('flag')
  store.set('count', 0)
  store.increment('count', 10)
  store.decrement('count', 3)
  store.setMany({ x: 1, y: 2 })
  store.delete('temp')
})
```

### With Persistence

Batched changes are saved once at the end:

```typescript
const store = createFlagStore({
  persist: { storage: localStorage }
})

store.batch(() => {
  store.set('a', 1)
  store.set('b', 2)
  store.set('c', 3)
})

// Single save to localStorage after batch
```

### Changes Visible Inside Batch

Changes are immediately visible within the batch:

```typescript
store.batch(() => {
  store.set('x', 10)
  console.log(store.get('x'))  // 10 (visible immediately)

  store.increment('x', 5)
  console.log(store.get('x'))  // 15
})
```

---

## Use Cases

### Atomic Updates

Ensure related changes happen together:

```typescript
store.batch(() => {
  store.decrement('player_health', damage)
  store.increment('enemy_score', damage)
  store.set('last_hit_time', Date.now())
})
```

### Performance Optimization

Prevent multiple re-renders:

```typescript
store.batch(() => {
  // Update many values without triggering re-render for each
  for (const [key, value] of Object.entries(newState)) {
    store.set(key, value)
  }
})
// Single re-render after all updates
```

### Transaction-Like Behavior

All-or-nothing updates:

```typescript
function transferGold(from: string, to: string, amount: number) {
  store.batch(() => {
    const fromGold = store.get(`${from}.gold`) as number
    if (fromGold < amount) {
      throw new Error('Insufficient gold')
    }
    store.decrement(`${from}.gold`, amount)
    store.increment(`${to}.gold`, amount)
  })
}
```
