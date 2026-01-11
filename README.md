# @motioneffector/flags

A TypeScript library for managing application state flags with condition evaluation.

## Overview

This library provides a key-value store for boolean flags, numeric counters, and string values, along with a powerful condition evaluation system. It's designed for applications that need to track state and make decisions based on combinations of conditions.

## Features

- **Multiple Value Types**: Boolean flags, numeric counters, string values
- **Condition Expressions**: Evaluate complex logical conditions against state
- **Change Tracking**: Subscribe to changes on specific flags or all state
- **Persistence**: Optional save/load to storage backends
- **Namespacing**: Organize flags into logical groups
- **History**: Optional undo/redo support for state changes
- **Type Safety**: Full TypeScript support

## Core Concepts

### Flag Types

```typescript
// Boolean flags
flags.set('door_unlocked', true)
flags.set('has_key', false)

// Numeric counters
flags.set('gold', 150)
flags.set('health', 100)

// String values
flags.set('current_quest', 'find_artifact')
flags.set('player_name', 'Hero')
```

### Condition Expressions

Evaluate conditions using a simple expression syntax:

```typescript
// Simple checks
flags.check('door_unlocked')                    // true if flag is truthy
flags.check('!has_key')                         // true if flag is falsy
flags.check('gold >= 100')                      // numeric comparison
flags.check('current_quest == "find_artifact"') // string equality

// Compound conditions
flags.check('has_key AND door_unlocked')
flags.check('gold >= 100 OR has_coupon')
flags.check('(has_key OR has_lockpick) AND !alarm_triggered')
```

### Supported Operators

- **Logical**: `AND`, `OR`, `NOT` (or `!`)
- **Comparison**: `==`, `!=`, `>`, `<`, `>=`, `<=`
- **Grouping**: Parentheses for precedence

## API

### `createFlagStore(options?)`

Creates a flag store instance.

**Options:**
- `initial`: Initial flag values (optional)
- `persist`: Storage backend for persistence (optional)
- `history`: Enable undo/redo history (optional)

### `store.set(key, value)`

Set a flag value.

### `store.get(key)`

Get a flag value (returns `undefined` if not set).

### `store.check(condition)`

Evaluate a condition expression, returns boolean.

### `store.increment(key, amount?)`

Increment a numeric flag (default +1).

### `store.decrement(key, amount?)`

Decrement a numeric flag (default -1).

### `store.toggle(key)`

Toggle a boolean flag.

### `store.delete(key)`

Remove a flag entirely.

### `store.clear()`

Remove all flags.

### `store.all()`

Returns all flags as an object.

### `store.subscribe(callback)`

Subscribe to all state changes.

### `store.subscribeKey(key, callback)`

Subscribe to changes on a specific key.

### `store.undo()` / `store.redo()`

Undo/redo state changes (if history enabled).

## Use Cases

- Game state tracking (quests completed, items obtained, NPCs met)
- Feature flags in applications
- User progress tracking
- Conditional content display
- Wizard/form state management
- Any application with complex conditional logic

## Example: Game State

```typescript
const gameState = createFlagStore({
  initial: {
    chapter: 1,
    gold: 0,
    has_sword: false,
    reputation: 50
  }
})

// Player finds gold
gameState.increment('gold', 25)

// Player buys sword
if (gameState.check('gold >= 20 AND !has_sword')) {
  gameState.decrement('gold', 20)
  gameState.set('has_sword', true)
}

// Check if player can enter castle
const canEnter = gameState.check(
  '(has_invitation OR reputation >= 75) AND !is_banished'
)
```

## Design Philosophy

This library treats application state as a flat key-value store with a powerful query layer. Rather than complex nested state objects, you work with simple flags and expressive conditions. This makes state easy to serialize, debug, and reason about.

## Installation

```bash
npm install @motioneffector/flags
```

## License

MIT
