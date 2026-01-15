# Subscriptions API

Watch for flag changes and react with callbacks.

---

## `subscribe()`

Subscribes to all flag changes in the store.

**Signature:**

```typescript
subscribe(callback: ChangeCallback): UnsubscribeFn
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `callback` | `ChangeCallback` | Yes | Function called when any flag changes |

**Returns:** `UnsubscribeFn` — Function to call to stop receiving notifications.

**Example:**

```typescript
const unsubscribe = store.subscribe((key, newValue, oldValue) => {
  console.log(`${key}: ${oldValue} -> ${newValue}`)
})

store.set('gold', 100)  // Logs: "gold: undefined -> 100"

// Stop watching
unsubscribe()
store.set('gold', 200)  // No log
```

---

## `subscribeKey()`

Subscribes to changes for a specific flag key.

**Signature:**

```typescript
subscribeKey(key: string, callback: KeyChangeCallback): UnsubscribeFn
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `key` | `string` | Yes | The flag key to watch |
| `callback` | `KeyChangeCallback` | Yes | Function called when the flag changes |

**Returns:** `UnsubscribeFn` — Function to call to stop receiving notifications.

**Example:**

```typescript
store.subscribeKey('gold', (newValue, oldValue) => {
  console.log(`Gold: ${oldValue} -> ${newValue}`)
})

store.set('gold', 100)    // Logs: "Gold: undefined -> 100"
store.set('health', 50)   // No log (different key)
```

---

## Types

### `ChangeCallback`

```typescript
type ChangeCallback = (
  key: string,
  newValue: FlagValue | undefined,
  oldValue: FlagValue | undefined
) => void
```

Callback for `subscribe()`. Receives:

| Parameter | Description |
|-----------|-------------|
| `key` | The flag key that changed |
| `newValue` | The new value, or `undefined` if deleted |
| `oldValue` | The previous value, or `undefined` if newly created |

### `KeyChangeCallback`

```typescript
type KeyChangeCallback = (
  newValue: FlagValue | undefined,
  oldValue: FlagValue | undefined
) => void
```

Callback for `subscribeKey()`. Receives:

| Parameter | Description |
|-----------|-------------|
| `newValue` | The new value, or `undefined` if deleted |
| `oldValue` | The previous value, or `undefined` if newly created |

### `UnsubscribeFn`

```typescript
type UnsubscribeFn = () => void
```

Call this to stop receiving notifications. Safe to call multiple times.

---

## Behavior Details

### Multiple Subscribers

All subscribers receive notifications in registration order:

```typescript
store.subscribe(() => console.log('First'))
store.subscribe(() => console.log('Second'))
store.set('x', 1)
// Logs: "First", then "Second"
```

### Duplicate Subscriptions

The same callback can be subscribed multiple times:

```typescript
const callback = () => console.log('Called')
store.subscribe(callback)
store.subscribe(callback)
store.set('x', 1)
// Logs: "Called", "Called"
```

Each subscription has its own unsubscribe function.

### Error Handling

Errors in callbacks are caught, logged, and don't affect other subscribers:

```typescript
store.subscribe(() => { throw new Error('Oops') })
store.subscribe(() => console.log('Still runs'))
store.set('x', 1)
// Logs error to console.error
// Logs: "Still runs"
```

### Subscribing During Callback

New subscriptions during a callback don't fire for the current change:

```typescript
store.subscribe(() => {
  store.subscribe(() => console.log('New subscription'))
})
store.set('x', 1)  // "New subscription" not logged
store.set('x', 2)  // "New subscription" logged
```

### Special Events

#### Clear Event

`clear()` fires a single notification with key `'__clear__'`:

```typescript
store.subscribe((key) => console.log(key))
store.clear()
// Logs: "__clear__"
```

Key subscriptions are NOT notified on clear.

#### setMany Event

`setMany()` fires a single notification with key `'__setMany__'`:

```typescript
store.subscribe((key) => console.log(key))
store.setMany({ a: 1, b: 2 })
// Logs: "__setMany__"
```

Individual key subscriptions ARE notified for each affected key.

### Batch Behavior

Inside `batch()`, notifications are deferred until the batch completes:

```typescript
store.subscribe(() => console.log('Changed'))
store.batch(() => {
  store.set('a', 1)
  store.set('b', 2)
  store.set('c', 3)
})
// Logs: "Changed" (once, not three times)
```

See [Batch Operations](API-Batch-Operations) for details.
