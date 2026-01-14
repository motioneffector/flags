# Namespaces

Namespaces let you organize flags into logical groups. A namespace is a scoped view of the store where all operations automatically prefix keys with your chosen namespace.

## How It Works

When you create a namespace, you get a store interface that prepends your prefix to every key:

```
store.namespace('player')
        ↓
┌─────────────────────────────────────┐
│           Flag Store                │
│  player.health: 100                 │
│  player.gold: 50                    │
│  player.name: "Ada"                 │
│  enemy.health: 200                  │
└─────────────────────────────────────┘

playerStore.get('health')     →  store.get('player.health')
playerStore.set('gold', 100)  →  store.set('player.gold', 100)
```

The namespace and root store share the same data. Changes in one are visible in the other.

## Basic Usage

```typescript
import { createFlagStore } from '@motioneffector/flags'

const store = createFlagStore()

// Create a namespace
const player = store.namespace('player')

// Operations are prefixed
player.set('health', 100)
player.set('gold', 50)

// Read via namespace
player.get('health')           // 100

// Read via root store
store.get('player.health')     // 100

// Both see the same data
store.keys()  // ['player.health', 'player.gold']
player.keys() // ['health', 'gold']
```

## Key Points

- **Dot separator** - Keys are joined with a dot: `namespace('player')` + `'health'` = `'player.health'`.

- **Same underlying store** - Namespaces are views, not copies. Changes propagate both ways.

- **Conditions auto-prefix** - In a namespace, `check('health > 50')` becomes `check('player.health > 50')`.

- **Nested namespaces** - You can create namespaces within namespaces: `store.namespace('game').namespace('player')` creates `game.player.*` keys.

- **All operations work** - `get`, `set`, `toggle`, `increment`, `subscribe`, `batch`, `compute` - everything works within the namespace.

## Examples

### Organizing Game State

```typescript
const store = createFlagStore()

// Player namespace
const player = store.namespace('player')
player.set('health', 100)
player.set('gold', 0)
player.set('level', 1)

// Enemy namespace
const enemy = store.namespace('enemy')
enemy.set('health', 50)
enemy.set('damage', 10)

// Inventory namespace
const inventory = store.namespace('inventory')
inventory.set('has_sword', false)
inventory.set('has_potion', true)

// Check conditions within a namespace
player.check('health > 50 AND level >= 1')  // Checks player.health, player.level
```

### Nested Namespaces

```typescript
const game = store.namespace('game')
const player = game.namespace('player')
const stats = player.namespace('stats')

stats.set('strength', 10)

// The actual key is 'game.player.stats.strength'
store.get('game.player.stats.strength')  // 10
```

### Namespace-Scoped Subscriptions

```typescript
const player = store.namespace('player')

// Only fires for player.* keys
player.subscribe((key, newValue, oldValue) => {
  console.log(`Player ${key}: ${oldValue} -> ${newValue}`)
})

player.set('health', 80)  // Logs: "Player health: 100 -> 80"
store.set('enemy.health', 40)  // No log (different namespace)
```

### Namespace-Scoped Clear

```typescript
const player = store.namespace('player')
const enemy = store.namespace('enemy')

player.set('health', 100)
enemy.set('health', 50)

// Clear only player flags
player.clear()

store.has('player.health')  // false
store.has('enemy.health')   // true
```

## Root Store Access

The root store always sees all keys with their full prefixes:

```typescript
const player = store.namespace('player')
player.set('health', 100)
player.set('gold', 50)

// Root store sees prefixed keys
store.all()
// { 'player.health': 100, 'player.gold': 50 }

// Namespace sees short keys
player.all()
// { health: 100, gold: 50 }
```

## Related

- **[Condition Expressions](Concept-Condition-Expressions)** - Conditions in namespaces auto-prefix
- **[Subscriptions](Concept-Subscriptions)** - Scoped subscription behavior
- **[API: Namespaces](API-Namespaces)** - Full method reference
