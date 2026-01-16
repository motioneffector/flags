# @motioneffector/flags

A smart state container that understands conditions. Instead of manually checking `if (store.get('gold') >= 100 && store.get('has_key'))`, you write `store.check('gold >= 100 AND has_key')`. The store holds your application's facts, evaluates complex conditions in natural language, and notifies you when things change.

## I want to...

| Goal | Where to go |
|------|-------------|
| Get up and running quickly | [Your First Flag Store](Your-First-Flag-Store) |
| Understand how the store works | [Flag Store](Concept-Flag-Store) |
| Check conditions like "gold >= 100 AND has_key" | [Condition Expressions](Concept-Condition-Expressions) |
| React when flags change | [Subscriptions](Concept-Subscriptions) |
| Save and restore state | [Persisting State](Guide-Persisting-State) |
| Add undo/redo to my app | [Undo/Redo History](Guide-Undo-Redo-History) |
| Look up a specific method | [API Reference](API-Store-Creation) |

## Key Concepts

### Flag Store

The central container for your application state. It holds boolean, number, and string values that represent what's true right now. All operations chain, keys are validated, and missing values return undefined.

### Condition Expressions

Write conditions the way you'd say them: `gold >= 100 AND has_key AND NOT is_banished`. The store parses and evaluates these expressions against current flag values, supporting AND, OR, NOT, comparisons, and parentheses.

### Subscriptions

Watch for changes and react. Subscribe to all changes or specific keys. When flags change, your callbacks fire with the old and new values, enabling reactive UI updates and side effects.

## Quick Example

```typescript
import { createFlagStore } from '@motioneffector/flags'

// Create a store with initial values
const store = createFlagStore({
  initial: { gold: 50, has_key: false, reputation: 75 }
})

// Update values
store.increment('gold', 100)
store.set('has_key', true)

// Check complex conditions
if (store.check('gold >= 100 AND has_key')) {
  console.log('You can open the treasure chest!')
}

// React to changes
store.subscribe((key, newValue, oldValue) => {
  console.log(`${key}: ${oldValue} -> ${newValue}`)
})
```

---

**[Full API Reference ->](API-Store-Creation)**
