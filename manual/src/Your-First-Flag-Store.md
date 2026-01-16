# Your First Flag Store

Create a working flag store and learn the core operations in about 5 minutes.

By the end of this guide, you'll have a store that tracks game state, evaluates conditions, and reacts to changes.

## What We're Building

A simple game state manager that tracks the player's gold, inventory, and reputation. We'll set values, check conditions, and subscribe to changes.

## Step 1: Create a Store

Start by creating a store with some initial values:

```typescript
import { createFlagStore } from '@motioneffector/flags'

const store = createFlagStore({
  initial: {
    gold: 0,
    has_key: false,
    reputation: 50
  }
})
```

The store now holds three flags: a number (`gold`), a boolean (`has_key`), and another number (`reputation`).

## Step 2: Read and Update Values

Use `get()` to read values and `set()` to update them:

```typescript
// Read values
console.log(store.get('gold'))       // 0
console.log(store.get('has_key'))    // false

// Set values
store.set('gold', 100)
store.set('has_key', true)

// Use specialized methods for common operations
store.toggle('has_key')              // false (flips the boolean)
store.increment('gold', 25)          // 125 (adds to the number)
store.decrement('reputation', 10)    // 40 (subtracts from the number)
```

## Step 3: Check Conditions

Use `check()` to evaluate complex conditions:

```typescript
// Simple checks
store.check('has_key')               // true if has_key is truthy
store.check('gold >= 100')           // true if gold is at least 100

// Combine with AND, OR, NOT
store.check('gold >= 100 AND has_key')
store.check('reputation > 50 OR has_key')
store.check('NOT has_key')

// Use parentheses for complex logic
store.check('(gold >= 100 OR has_key) AND reputation > 25')
```

Conditions read like English. The store parses and evaluates them against current values.

## Step 4: React to Changes

Subscribe to be notified when flags change:

```typescript
// Watch all changes
const unsubscribe = store.subscribe((key, newValue, oldValue) => {
  console.log(`${key}: ${oldValue} -> ${newValue}`)
})

store.set('gold', 200)  // Logs: "gold: 125 -> 200"

// Stop watching
unsubscribe()

// Watch a specific key
store.subscribeKey('gold', (newValue, oldValue) => {
  console.log(`Gold changed to ${newValue}`)
})
```

## The Complete Code

Here's everything together:

```typescript
import { createFlagStore } from '@motioneffector/flags'

// Create store with initial values
const store = createFlagStore({
  initial: {
    gold: 0,
    has_key: false,
    reputation: 50
  }
})

// Subscribe to changes
store.subscribe((key, newValue, oldValue) => {
  console.log(`${key}: ${oldValue} -> ${newValue}`)
})

// Update values
store.increment('gold', 100)
store.set('has_key', true)

// Check conditions
if (store.check('gold >= 100 AND has_key')) {
  console.log('Ready to open the treasure chest!')
}

// Check another condition
if (store.check('reputation > 25 AND NOT has_key')) {
  console.log('You have good standing but need a key')
}
```

## What's Next?

Now that you have the basics:

- **[Understand the Flag Store](Concept-Flag-Store)** - Learn how values and keys work
- **[Write Condition Expressions](Concept-Condition-Expressions)** - Master the condition syntax
- **[Persist State](Guide-Persisting-State)** - Save flags to localStorage
- **[Explore the API](API-Store-Creation)** - Full reference when you need details
