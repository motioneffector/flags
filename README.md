# @motioneffector/flags

A TypeScript library for managing application state flags with powerful condition evaluation. Perfect for game state, feature flags, user progress tracking, and any application with complex conditional logic.

[![npm version](https://img.shields.io/npm/v/@motioneffector/flags.svg)](https://www.npmjs.com/package/@motioneffector/flags)
[![license](https://img.shields.io/npm/l/@motioneffector/flags.svg)](https://github.com/motioneffector/flags/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## Demo

Try the [interactive demo](https://motioneffector.github.io/flags/) to see the library in action.

## Installation

```bash
npm install @motioneffector/flags
```

## Quick Start

```typescript
import { createFlagStore } from '@motioneffector/flags'

const store = createFlagStore({
  initial: {
    gold: 0,
    has_key: false,
    reputation: 50
  }
})

// Simple operations
store.set('has_key', true)
store.increment('gold', 25)

// Powerful condition evaluation
if (store.check('gold >= 20 AND !has_key')) {
  store.decrement('gold', 20)
  store.set('has_key', true)
}

// Complex conditions with multiple operators
const canEnter = store.check(
  '(has_invitation OR reputation >= 75) AND !is_banished'
)
```

## Features

- **Multiple Value Types** - Boolean flags, numeric counters, string values
- **Powerful Conditions** - Evaluate complex logical expressions with AND, OR, NOT, comparisons
- **Change Tracking** - Subscribe to changes on specific flags or all state
- **Persistence** - Optional save/load to storage backends (localStorage, sessionStorage, custom)
- **History** - Built-in undo/redo support
- **Namespacing** - Organize flags into logical groups
- **Computed Values** - Create derived values that update automatically
- **Batch Updates** - Atomic operations with automatic rollback on error
- **Full TypeScript Support** - Complete type definitions included
- **Zero Dependencies** - Lightweight and fast
- **Tree-shakeable** - ESM build for optimal bundle size

## API Reference

### `createFlagStore(options?)`

Creates a new flag store instance.

**Options:**
- `initial` - Initial flag values (default: `{}`)
- `persist` - Storage configuration for persistence (optional)
  - `storage` - Storage backend (localStorage, sessionStorage, or custom)
  - `key` - Storage key (default: `'@motioneffector/flags'`)
  - `autoSave` - Auto-save on changes (default: `true`)
- `history` - Enable undo/redo (default: `false`)

**Returns:** `FlagStore`

**Example:**
```typescript
const store = createFlagStore({
  initial: { score: 0, level: 1 },
  persist: { storage: localStorage },
  history: true
})
```

### Basic Operations

#### `store.set(key, value)`

Set a flag value.

```typescript
store.set('flag', true)
store.set('count', 42)
store.set('name', 'alice')
```

#### `store.get(key)`

Get a flag value (returns `undefined` if not set).

```typescript
const value = store.get('flag') // boolean | number | string | undefined
```

#### `store.has(key)`

Check if a flag exists.

```typescript
if (store.has('key')) {
  // flag exists
}
```

#### `store.delete(key)`

Remove a flag entirely.

```typescript
store.delete('old_flag')
```

#### `store.clear()`

Remove all flags (computed flags remain).

```typescript
store.clear()
```

#### `store.all()`

Get all flags as an object.

```typescript
const allFlags = store.all()
// { flag: true, count: 42, name: 'alice' }
```

#### `store.keys()`

Get all flag keys as an array.

```typescript
const keys = store.keys()
// ['flag', 'count', 'name']
```

### Numeric Operations

#### `store.increment(key, amount?)`

Increment a numeric flag (default +1).

```typescript
store.increment('score')      // +1
store.increment('score', 10)  // +10
```

#### `store.decrement(key, amount?)`

Decrement a numeric flag (default -1).

```typescript
store.decrement('health')     // -1
store.decrement('health', 5)  // -5
```

### Boolean Operations

#### `store.toggle(key)`

Toggle a boolean flag.

```typescript
store.toggle('flag')  // true → false or false → true
```

### Condition Evaluation

#### `store.check(condition)`

Evaluate a condition expression. Returns `boolean`.

**Supported operators:**
- **Logical**: `AND`, `OR`, `NOT` (or `!`)
- **Comparison**: `==`, `!=`, `>`, `<`, `>=`, `<=`
- **Grouping**: Parentheses `()` for precedence

**Examples:**
```typescript
// Simple checks
store.check('door_unlocked')                    // truthy check
store.check('!has_key')                         // falsy check
store.check('gold >= 100')                      // numeric comparison
store.check('name == "alice"')                  // string equality

// Compound conditions
store.check('has_key AND door_unlocked')
store.check('gold >= 100 OR has_coupon')
store.check('(has_key OR has_lockpick) AND !alarm_triggered')

// Complex expressions
store.check('level >= 5 AND (class == "warrior" OR class == "paladin")')
store.check('health > 0 AND health <= 100')
store.check('(a == 1 OR a == 2 OR a == 3) AND b')
```

### Subscriptions

#### `store.subscribe(callback)`

Subscribe to all state changes.

```typescript
const unsubscribe = store.subscribe((key, newValue, oldValue) => {
  console.log(`${key} changed from ${oldValue} to ${newValue}`)
})

// Later: stop listening
unsubscribe()
```

#### `store.subscribeKey(key, callback)`

Subscribe to changes on a specific key.

```typescript
const unsubscribe = store.subscribeKey('health', (newValue, oldValue) => {
  console.log(`Health: ${oldValue} → ${newValue}`)
})
```

### Persistence

#### `store.save()`

Manually save current state to storage.

```typescript
store.save()
```

#### `store.load()`

Manually load state from storage.

```typescript
store.load()
```

### History

#### `store.undo()`

Undo the last change (if history enabled).

```typescript
store.set('flag', true)
store.undo()
// flag is back to its previous value
```

#### `store.redo()`

Redo the last undone change (if history enabled).

```typescript
store.redo()
```

#### `store.canUndo()`

Check if undo is available.

```typescript
if (store.canUndo()) {
  store.undo()
}
```

#### `store.canRedo()`

Check if redo is available.

```typescript
if (store.canRedo()) {
  store.redo()
}
```

### Batch Updates

#### `store.batch(fn)`

Execute multiple operations atomically. If an error occurs, all changes are rolled back.

```typescript
store.batch(() => {
  store.set('a', 1)
  store.set('b', 2)
  store.set('c', 3)
})
// Only 1 notification fires, all changes succeed or all fail
```

### Computed Values

#### `store.compute(key, dependencies, fn)`

Create a computed flag that updates automatically when dependencies change.

```typescript
store.set('radius', 5)
store.compute('area', ['radius'], (radius) => Math.PI * radius ** 2)

console.log(store.get('area'))  // 78.54...

store.set('radius', 10)
console.log(store.get('area'))  // 314.15...
```

### Namespacing

#### `store.namespace(prefix)`

Create a scoped view of the store.

```typescript
const player = store.namespace('player')

player.set('health', 100)       // Sets 'player.health'
player.get('health')             // Gets 'player.health'
player.check('health > 0')       // Checks 'player.health > 0'

// Nested namespaces
const inventory = player.namespace('inventory')
inventory.set('gold', 50)        // Sets 'player.inventory.gold'
```

### Batch Operations

#### `store.setMany(values)`

Set multiple flags at once.

```typescript
store.setMany({
  flag1: true,
  flag2: 42,
  flag3: 'value'
})
```

## Error Handling

The library exports custom error classes:

```typescript
import { ValidationError, ParseError } from '@motioneffector/flags'

try {
  store.set('', 'value')  // Invalid key
} catch (e) {
  if (e instanceof ValidationError) {
    console.error('Invalid input:', e.message)
  }
}

try {
  store.check('invalid syntax {{')
} catch (e) {
  if (e instanceof ParseError) {
    console.error('Invalid condition:', e.message)
  }
}
```

## Use Cases

- **Game State Management** - Track quests, items, NPCs, player stats
- **Feature Flags** - Enable/disable features conditionally
- **User Progress** - Track completion, achievements, milestones
- **Wizard/Form State** - Multi-step form management
- **Conditional UI** - Show/hide content based on complex rules
- **A/B Testing** - Manage experiment variations

## Browser Support

Works in all modern browsers (ES2022+). For older browsers, transpile your code.

## License

MIT © [motioneffector](https://github.com/motioneffector)
