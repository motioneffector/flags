# Working with Numeric Flags

Use the store for counters, scores, health bars, currency, and other numeric values with specialized methods for incrementing and decrementing.

## Prerequisites

Before starting, you should:

- [Understand how the Flag Store works](Concept-Flag-Store)

## Overview

We'll work with numeric flags by:

1. Setting numeric initial values
2. Using `increment()` and `decrement()`
3. Comparing numbers in conditions
4. Handling missing counters

## Step 1: Set Numeric Values

Numbers work just like any other value type:

```typescript
import { createFlagStore } from '@motioneffector/flags'

const store = createFlagStore({
  initial: {
    health: 100,
    gold: 0,
    experience: 0,
    level: 1
  }
})

// Set directly
store.set('health', 75)
store.set('gold', 1000)
```

## Step 2: Increment and Decrement

Use specialized methods for counter operations:

```typescript
// Add to a value
store.increment('gold', 50)       // gold: 0 -> 50
store.increment('experience', 100) // experience: 0 -> 100

// Subtract from a value
store.decrement('health', 25)     // health: 100 -> 75

// Default amount is 1
store.increment('level')          // level: 1 -> 2
store.decrement('health')         // health: 75 -> 74
```

Both methods return the new value:

```typescript
const newHealth = store.decrement('health', 10)
console.log(newHealth)  // 64
```

## Step 3: Compare in Conditions

Use comparison operators in `check()`:

```typescript
// Basic comparisons
store.check('health > 0')         // Player is alive
store.check('gold >= 100')        // Can afford item
store.check('level == 5')         // Exactly level 5
store.check('experience < 1000')  // Not yet at threshold

// Combine with logic
store.check('health > 0 AND gold >= 100')
store.check('level >= 10 OR experience >= 5000')
```

## Step 4: Handle Missing Counters

Missing flags auto-initialize when incremented or decremented:

```typescript
const store = createFlagStore()  // Empty store

// Incrementing a missing key initializes to the amount
store.increment('new_counter', 5)
store.get('new_counter')  // 5

// Decrementing a missing key initializes to negative
store.decrement('another', 3)
store.get('another')  // -3

// Default increment/decrement of 1
store.increment('clicks')
store.get('clicks')  // 1
```

In conditions, missing keys are treated as 0:

```typescript
store.check('missing_score >= 0')  // true (0 >= 0)
store.check('missing_score > 0')   // false (0 > 0)
```

## Complete Example

```typescript
import { createFlagStore } from '@motioneffector/flags'

const store = createFlagStore({
  initial: {
    player_health: 100,
    player_gold: 50,
    enemy_health: 30,
    potions: 3
  }
})

// Combat round
function playerAttack(damage: number) {
  store.decrement('enemy_health', damage)

  if (store.check('enemy_health <= 0')) {
    const goldReward = 25
    store.increment('player_gold', goldReward)
    console.log(`Enemy defeated! +${goldReward} gold`)
  }
}

function enemyAttack(damage: number) {
  store.decrement('player_health', damage)

  if (store.check('player_health <= 0')) {
    console.log('Game Over!')
  }
}

function usePotion() {
  if (store.check('potions > 0 AND player_health < 100')) {
    store.decrement('potions')
    store.increment('player_health', 30)

    // Cap at 100
    if (store.get('player_health')! > 100) {
      store.set('player_health', 100)
    }
  }
}

// Play
playerAttack(15)  // enemy_health: 30 -> 15
playerAttack(20)  // enemy_health: 15 -> -5, "Enemy defeated! +25 gold"
```

## Variations

### Float Values

Floats work fine:

```typescript
store.set('temperature', 98.6)
store.increment('temperature', 0.5)  // 99.1
store.check('temperature >= 100')    // false
```

### Negative Numbers

No restrictions on negatives:

```typescript
store.set('altitude', -100)
store.increment('altitude', 50)      // -50
store.check('altitude < 0')          // true
```

### Range Checks

Combine comparisons for ranges:

```typescript
// Health between 25 and 75 (critical but not dead)
store.check('health > 25 AND health <= 75')

// Gold exactly in a range
store.check('gold >= 100 AND gold < 500')
```

### Type Safety

Increment/decrement only work on numbers:

```typescript
store.set('name', 'Ada')
store.increment('name')  // TypeError: Cannot increment non-numeric flag
```

## Troubleshooting

### TypeError on Increment

**Symptom:** `TypeError: Cannot increment non-numeric flag`

**Cause:** The flag exists but isn't a number.

**Solution:** Check the flag type before incrementing, or ensure it's initialized as a number.

### Unexpected Zero

**Symptom:** Value is 0 when you expected something else.

**Cause:** Missing flags are treated as 0 in conditions (but return `undefined` from `get()`).

**Solution:** Check `has()` to distinguish between 0 and missing, or use `get() ?? defaultValue`.

### Float Precision

**Symptom:** `0.1 + 0.2` gives `0.30000000000000004`.

**Cause:** JavaScript float precision.

**Solution:** Round when displaying, or use integers (cents instead of dollars).

## See Also

- **[Flag Store](Concept-Flag-Store)** - How values are stored
- **[Condition Expressions](Concept-Condition-Expressions)** - Comparison operators
- **[API: Reading and Writing](API-Reading-And-Writing)** - `increment()` and `decrement()` reference
