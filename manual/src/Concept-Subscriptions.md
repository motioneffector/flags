# Subscriptions

Subscriptions let you react when flag values change. Register a callback, and it fires whenever the store updates. This enables reactive UIs, logging, and side effects.

## How It Works

When you call `subscribe()`, you register a callback function. Every time a flag changes (via `set()`, `toggle()`, `increment()`, etc.), your callback receives the key that changed plus the old and new values.

```
store.set('gold', 100)
        ↓
┌───────────────────────┐
│      Flag Store       │
│  gold: 50 → 100       │
└───────────────────────┘
        ↓
   Notify subscribers
        ↓
callback('gold', 100, 50)
```

## Basic Usage

```typescript
import { createFlagStore } from '@motioneffector/flags'

const store = createFlagStore({
  initial: { gold: 0, health: 100 }
})

// Subscribe to all changes
const unsubscribe = store.subscribe((key, newValue, oldValue) => {
  console.log(`${key}: ${oldValue} -> ${newValue}`)
})

store.set('gold', 50)      // Logs: "gold: 0 -> 50"
store.increment('gold', 25) // Logs: "gold: 50 -> 75"

// Stop receiving notifications
unsubscribe()

store.set('gold', 100)     // No log (unsubscribed)
```

## Key Points

- **Returns an unsubscribe function** - Call it to stop receiving notifications. Safe to call multiple times.

- **Callbacks receive (key, newValue, oldValue)** - For new keys, `oldValue` is `undefined`. For deleted keys, `newValue` is `undefined`.

- **Errors in callbacks are caught** - If your callback throws, it's logged to `console.error` but doesn't break the store or other subscribers.

- **Multiple subscribers are supported** - All subscribers receive notifications in the order they were registered.

## Key-Specific Subscriptions

Use `subscribeKey()` to watch a single key:

```typescript
// Only fires when 'gold' changes
store.subscribeKey('gold', (newValue, oldValue) => {
  console.log(`Gold: ${oldValue} -> ${newValue}`)
})

store.set('gold', 100)    // Logs: "Gold: 0 -> 100"
store.set('health', 50)   // No log (different key)
```

Note that `subscribeKey()` callbacks receive only `(newValue, oldValue)`, not the key.

## Examples

### UI Updates

```typescript
// Update a health bar when health changes
store.subscribeKey('health', (newValue) => {
  const healthBar = document.querySelector('.health-bar')
  healthBar.style.width = `${newValue}%`
})
```

### Logging

```typescript
// Log all state changes for debugging
store.subscribe((key, newValue, oldValue) => {
  console.log(`[State] ${key}: ${JSON.stringify(oldValue)} -> ${JSON.stringify(newValue)}`)
})
```

### Computed Side Effects

```typescript
// Trigger game over when health reaches 0
store.subscribeKey('health', (newValue) => {
  if (newValue <= 0) {
    showGameOverScreen()
  }
})

// Play sound when gold increases
store.subscribeKey('gold', (newValue, oldValue) => {
  if (newValue > (oldValue ?? 0)) {
    playSound('coin-collect')
  }
})
```

### Managing Multiple Subscriptions

```typescript
const unsubscribers: Array<() => void> = []

// Collect unsubscribe functions
unsubscribers.push(
  store.subscribeKey('gold', updateGoldUI),
  store.subscribeKey('health', updateHealthUI),
  store.subscribe(logAllChanges)
)

// Later, clean up all subscriptions
function cleanup() {
  unsubscribers.forEach(unsub => unsub())
}
```

## Batch Operations

When you use `batch()`, subscribers are notified once at the end, not for each individual change:

```typescript
store.subscribe((key) => {
  console.log(`Changed: ${key}`)
})

store.batch(() => {
  store.set('a', 1)
  store.set('b', 2)
  store.set('c', 3)
})
// Logs once: "Changed: __batch__"
// Not three times
```

This prevents unnecessary re-renders when making multiple related changes.

## Related

- **[Flag Store](Concept-Flag-Store)** - Where changes originate
- **[Computed Flags](Concept-Computed-Flags)** - Derived values that also trigger subscriptions
- **[Batch Operations](Guide-Batch-Operations)** - Group changes for single notification
- **[API: Subscriptions](API-Subscriptions)** - Full method reference
