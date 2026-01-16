# Namespaces API

Create scoped views of the store with automatic key prefixing.

---

## `namespace()`

Creates a scoped store view where all operations automatically prefix keys.

**Signature:**

```typescript
namespace(prefix: string): FlagStore
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `prefix` | `string` | Yes | The namespace prefix to prepend to all keys |

**Returns:** `FlagStore` — A scoped store instance. All operations on this store prefix keys with `prefix.`.

**Example:**

```typescript
const store = createFlagStore()

// Create a namespace
const player = store.namespace('player')

// All operations are prefixed
player.set('health', 100)      // Sets 'player.health'
player.set('gold', 50)         // Sets 'player.gold'

player.get('health')           // 100
store.get('player.health')     // 100 (same value)

player.keys()                  // ['health', 'gold']
store.keys()                   // ['player.health', 'player.gold']
```

---

## Behavior Details

### Key Prefixing

Keys are joined with a dot separator:

```typescript
const ns = store.namespace('game')
ns.set('score', 100)           // Actual key: 'game.score'
ns.get('score')                // Looks up 'game.score'
ns.has('score')                // Checks 'game.score'
ns.delete('score')             // Deletes 'game.score'
```

### Shared Data

Namespaces are views, not copies. Changes propagate both ways:

```typescript
const player = store.namespace('player')

player.set('health', 100)
store.get('player.health')     // 100

store.set('player.gold', 50)
player.get('gold')             // 50
```

### Nested Namespaces

Namespaces can be nested:

```typescript
const game = store.namespace('game')
const player = game.namespace('player')
const stats = player.namespace('stats')

stats.set('strength', 10)
store.get('game.player.stats.strength')  // 10
```

### All Operations Work

Every store method works in a namespace:

```typescript
const ns = store.namespace('prefix')

ns.set('key', 'value')
ns.get('key')
ns.has('key')
ns.delete('key')
ns.toggle('flag')
ns.increment('count')
ns.decrement('count')
ns.all()
ns.keys()
ns.clear()
ns.setMany({ a: 1, b: 2 })
ns.subscribe(callback)
ns.subscribeKey('key', callback)
ns.batch(() => { /* ... */ })
ns.compute('derived', ['dep'], fn)
ns.check('flag')
ns.namespace('nested')
```

### Conditions Auto-Prefix

Flag names in conditions are automatically prefixed:

```typescript
const player = store.namespace('player')
player.set('health', 100)
player.set('alive', true)

// These check 'player.health' and 'player.alive'
player.check('health > 50')
player.check('alive AND health > 0')
player.check('health >= 50 AND alive')
```

### Scoped Subscriptions

Subscriptions on a namespace only fire for that namespace:

```typescript
const player = store.namespace('player')
const enemy = store.namespace('enemy')

player.subscribe((key, value) => {
  console.log(`Player ${key}: ${value}`)
})

player.set('health', 100)  // Logs: "Player health: 100"
enemy.set('health', 50)    // No log (different namespace)
store.set('global', true)  // No log (different namespace)
```

### Scoped Clear

`clear()` only affects keys in the namespace:

```typescript
const player = store.namespace('player')
const enemy = store.namespace('enemy')

player.set('health', 100)
enemy.set('health', 50)

player.clear()

store.has('player.health')  // false
store.has('enemy.health')   // true
```

### Scoped `all()` and `keys()`

These methods return only keys in the namespace, without the prefix:

```typescript
store.set('player.health', 100)
store.set('player.gold', 50)
store.set('enemy.health', 30)

const player = store.namespace('player')
player.all()   // { health: 100, gold: 50 }
player.keys()  // ['health', 'gold']
```

### Root Store Access

The root store always sees full prefixed keys:

```typescript
const player = store.namespace('player')
player.set('health', 100)

store.all()    // { 'player.health': 100 }
store.keys()   // ['player.health']
```

### Keys With Dots

Dotted keys work naturally:

```typescript
store.set('a.b', 'direct')

const ns = store.namespace('a')
ns.get('b')    // 'direct' (same key: 'a.b')
ns.set('b', 'scoped')
store.get('a.b')  // 'scoped'
```
