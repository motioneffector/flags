# Computed Flags

Computed flags are derived values that automatically update when their dependencies change. Define a formula once, and the store keeps it up to date.

## How It Works

You declare a computed flag with `compute()`, specifying which flags it depends on and a function to calculate the value. Whenever any dependency changes, the store recalculates and updates the computed flag.

```
Dependencies: gold, bonus_multiplier
Formula: gold * bonus_multiplier

┌─────────────────────────────────┐
│           Flag Store            │
│  gold: 100                      │
│  bonus_multiplier: 1.5          │
│  total_gold: 150  (computed)    │
└─────────────────────────────────┘

store.set('gold', 200)
        ↓
   Recalculate total_gold
        ↓
   total_gold = 200 * 1.5 = 300
```

## Basic Usage

```typescript
import { createFlagStore } from '@motioneffector/flags'

const store = createFlagStore({
  initial: { base_damage: 10, strength: 5 }
})

// Define a computed flag
store.compute('total_damage', ['base_damage', 'strength'], (baseDamage, strength) => {
  return (baseDamage as number) + (strength as number) * 2
})

// Read the computed value
store.get('total_damage')  // 20 (10 + 5*2)

// Change a dependency
store.set('strength', 10)
store.get('total_damage')  // 30 (10 + 10*2)
```

The computed flag updates automatically. You never set it directly.

## Key Points

- **Read-only** - Computed flags cannot be set, deleted, toggled, or incremented. Attempting to do so throws an error.

- **Synchronous only** - The compute function must return immediately. Async functions return a Promise object, not the resolved value.

- **Dependencies can be missing** - If a dependency doesn't exist, it's passed as `undefined`. Handle this in your function.

- **Circular dependencies throw** - If flag A depends on B and B depends on A, you get an error at definition time.

- **Trigger subscriptions** - When a computed flag's value changes, subscribers are notified just like regular flags.

## Examples

### Derived Stats

```typescript
store.set('base_health', 100)
store.set('armor', 50)

store.compute('effective_health', ['base_health', 'armor'], (health, armor) => {
  return (health as number) + (armor as number) * 0.5
})

store.get('effective_health')  // 125
```

### Boolean Combinations

```typescript
store.set('is_admin', false)
store.set('is_moderator', true)

store.compute('can_ban_users', ['is_admin', 'is_moderator'], (admin, mod) => {
  return admin === true || mod === true
})

store.get('can_ban_users')  // true
```

### Using Computed Flags in Conditions

Computed flags work in `check()` just like regular flags:

```typescript
store.set('level', 10)
store.set('has_premium', true)

store.compute('max_inventory', ['level', 'has_premium'], (level, premium) => {
  const base = 10 + (level as number)
  return premium ? base * 2 : base
})

// Use in conditions
store.check('max_inventory >= 30')  // true (10 + 10) * 2 = 40
```

### Handling Missing Dependencies

```typescript
store.compute('safe_value', ['maybe_missing'], (value) => {
  return value ?? 0  // Default to 0 if undefined
})

store.get('safe_value')  // 0 (maybe_missing doesn't exist)

store.set('maybe_missing', 42)
store.get('safe_value')  // 42
```

## Subscribing to Computed Flags

Subscribe to computed flags like any other:

```typescript
store.subscribeKey('total_damage', (newValue, oldValue) => {
  console.log(`Damage changed: ${oldValue} -> ${newValue}`)
})

store.set('strength', 15)  // Triggers the subscription
```

## Related

- **[Subscriptions](Concept-Subscriptions)** - React to computed value changes
- **[Condition Expressions](Concept-Condition-Expressions)** - Use computed flags in conditions
- **[API: Computed Flags](API-Computed-Flags)** - Full method reference
