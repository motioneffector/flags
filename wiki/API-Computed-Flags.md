# Computed Flags API

Create derived flag values that automatically update when dependencies change.

---

## `compute()`

Creates a computed flag that recalculates when its dependencies change.

**Signature:**

```typescript
compute(key: string, dependencies: string[], fn: ComputeFn): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `key` | `string` | Yes | The key for the computed flag |
| `dependencies` | `string[]` | Yes | Array of flag keys this value depends on |
| `fn` | `ComputeFn` | Yes | Function that computes the value from dependency values |

**Returns:** `void`

**Throws:**

- `ValidationError` — If the key is invalid
- `Error` — If the key is already used by a regular (non-computed) flag
- `Error` — If a circular dependency is detected

**Example:**

```typescript
store.set('base_damage', 10)
store.set('strength', 5)

store.compute('total_damage', ['base_damage', 'strength'], (baseDamage, strength) => {
  return (baseDamage as number) + (strength as number) * 2
})

store.get('total_damage')  // 20

// Automatically updates when dependencies change
store.set('strength', 10)
store.get('total_damage')  // 30
```

---

## Types

### `ComputeFn`

```typescript
type ComputeFn = (...values: Array<FlagValue | undefined>) => FlagValue
```

Function that computes a derived value. Receives dependency values in order:

```typescript
// For compute('result', ['a', 'b', 'c'], fn)
// fn receives: (valueOfA, valueOfB, valueOfC)
```

Must return a valid `FlagValue` (boolean, number, or string).

---

## Behavior Details

### Read-Only

Computed flags cannot be modified directly:

```typescript
store.compute('doubled', ['x'], (x) => (x as number) * 2)

store.set('doubled', 100)      // throws Error
store.delete('doubled')        // throws Error
store.toggle('doubled')        // throws Error
store.increment('doubled')     // throws Error
```

### Synchronous Only

Compute functions must be synchronous. Async functions return a Promise object, not the resolved value:

```typescript
// DON'T do this
store.compute('bad', ['x'], async (x) => {
  return await someAsyncOperation(x)
})
store.get('bad')  // Returns a Promise, not the value
```

### Missing Dependencies

Dependencies that don't exist are passed as `undefined`:

```typescript
store.compute('safe', ['missing'], (value) => {
  return value ?? 'default'
})
store.get('safe')  // 'default'
```

### Error Handling

If the compute function throws, the error is caught and the previous value is retained:

```typescript
store.compute('risky', ['x'], (x) => {
  if (x === 0) throw new Error('Division by zero')
  return 100 / (x as number)
})

store.set('x', 10)
store.get('risky')  // 10

store.set('x', 0)
store.get('risky')  // Still 10 (error was caught)
```

### Circular Dependencies

Circular dependencies are detected at definition time:

```typescript
store.compute('a', ['b'], (b) => b)
store.compute('b', ['a'], (a) => a)  // throws Error: circular dependency

store.compute('self', ['self'], (s) => s)  // throws Error: circular dependency
```

### In Conditions

Computed flags work in `check()` like regular flags:

```typescript
store.set('level', 10)
store.compute('can_access', ['level'], (level) => (level as number) >= 5)

store.check('can_access')  // true
store.check('can_access AND level > 8')  // true
```

### With Subscriptions

Changes to computed flags trigger subscriptions:

```typescript
store.set('x', 1)
store.compute('doubled', ['x'], (x) => (x as number) * 2)

store.subscribeKey('doubled', (newVal, oldVal) => {
  console.log(`doubled: ${oldVal} -> ${newVal}`)
})

store.set('x', 5)  // Logs: "doubled: 2 -> 10"
```

### In `keys()` and `all()`

Computed flags appear in key lists and snapshots:

```typescript
store.set('x', 10)
store.compute('doubled', ['x'], (x) => (x as number) * 2)

store.keys()  // ['x', 'doubled']
store.has('doubled')  // true
store.all()   // { x: 10, doubled: 20 }
```

### Persistence

Computed flags are not persisted (they're recalculated on load):

```typescript
const store = createFlagStore({
  persist: { storage: localStorage }
})

store.set('x', 10)
store.compute('doubled', ['x'], (x) => (x as number) * 2)

// After reload, 'x' is restored from storage
// 'doubled' must be recomputed (not stored)
```

### Clear Behavior

`clear()` removes regular flags but not computed definitions:

```typescript
store.set('x', 10)
store.compute('doubled', ['x'], (x) => (x as number) * 2)

store.clear()

store.has('x')        // false
store.has('doubled')  // true (definition remains)
store.get('doubled')  // 0 (computes with x=undefined, treated as 0)
```
