# Flag Store

The flag store is the central container for your application state. It holds typed values (boolean, number, or string) identified by string keys, and provides methods to read, write, and query those values.

## How It Works

Think of the store as a smart dictionary. Unlike a plain JavaScript object, the store:

- **Validates keys** - No empty strings, spaces, or reserved words like AND/OR/NOT
- **Validates values** - Only boolean, number, or string (no objects, arrays, or null)
- **Notifies subscribers** - Changes trigger callbacks so your UI can react
- **Supports conditions** - Query multiple flags with expressions like `gold >= 100 AND has_key`

```
┌─────────────────────────────────────────┐
│              Flag Store                 │
├─────────────────────────────────────────┤
│  gold: 150          (number)            │
│  has_key: true      (boolean)           │
│  player_name: "Ada" (string)            │
│  reputation: 75     (number)            │
└─────────────────────────────────────────┘
         ↓                    ↓
   store.get('gold')    store.check('gold >= 100')
         ↓                    ↓
        150                  true
```

## Basic Usage

```typescript
import { createFlagStore } from '@motioneffector/flags'

const store = createFlagStore({
  initial: {
    gold: 0,
    has_key: false,
    player_name: 'Hero'
  }
})

// Read values
store.get('gold')        // 0
store.get('has_key')     // false
store.get('missing')     // undefined

// Write values
store.set('gold', 100)
store.set('has_key', true)

// Check existence
store.has('gold')        // true
store.has('missing')     // false
```

All `set()` operations return the store, so you can chain calls:

```typescript
store
  .set('gold', 100)
  .set('has_key', true)
  .set('reputation', 50)
```

## Key Points

- **Three value types only** - Boolean, number, and string. Objects and arrays are not supported. This keeps the store simple and serializable.

- **Keys are validated** - Keys cannot be empty, contain spaces, or use reserved words (AND, OR, NOT). Keys like `player.health` with dots are allowed (useful for organizing).

- **Setting null/undefined deletes** - `store.set('key', null)` removes the key entirely, equivalent to `store.delete('key')`.

- **Missing keys return undefined** - `store.get('nonexistent')` returns `undefined`, not an error. In conditions, missing keys are treated as falsy (0).

## Examples

### Game State

```typescript
const store = createFlagStore({
  initial: {
    player_health: 100,
    player_gold: 0,
    has_sword: false,
    current_level: 1
  }
})

// Player takes damage
store.decrement('player_health', 25)

// Player finds gold
store.increment('player_gold', 50)

// Player gets a sword
store.set('has_sword', true)

// Check if player can proceed
if (store.check('has_sword AND current_level >= 1')) {
  store.increment('current_level')
}
```

### Feature Flags

```typescript
const store = createFlagStore({
  initial: {
    dark_mode: false,
    beta_features: false,
    max_items: 10
  }
})

// Toggle dark mode
store.toggle('dark_mode')

// Enable beta for testing
store.set('beta_features', true)

// Increase limit for premium users
store.set('max_items', 100)
```

## Related

- **[Condition Expressions](Concept-Condition-Expressions)** - Query the store with complex logic
- **[Subscriptions](Concept-Subscriptions)** - React when values change
- **[Persisting State](Guide-Persisting-State)** - Save the store to localStorage
- **[API: Reading and Writing](API-Reading-And-Writing)** - Full method reference
