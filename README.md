# @motioneffector/flags

A TypeScript library for managing application state with powerful condition evaluation and reactive subscriptions.

[![npm version](https://img.shields.io/npm/v/@motioneffector/flags.svg)](https://www.npmjs.com/package/@motioneffector/flags)
[![license](https://img.shields.io/npm/l/@motioneffector/flags.svg)](https://github.com/motioneffector/flags/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

**[Try the interactive demo →](https://motioneffector.github.io/flags/)**

## Features

- **Multiple Value Types** - Boolean flags, numeric counters, and string values
- **Powerful Conditions** - Complex expressions with AND, OR, NOT, comparisons
- **Reactive Subscriptions** - Watch all changes or specific keys
- **Persistent Storage** - Save/load to localStorage or custom backends
- **Undo/Redo History** - Built-in time-travel debugging support
- **Computed Values** - Derived flags that auto-update on dependency changes
- **Namespacing** - Organize flags into logical scoped groups
- **Batch Operations** - Atomic updates with automatic rollback

[Read the full manual →](https://motioneffector.github.io/flags/manual/)

## Quick Start

```typescript
import { createFlagStore } from '@motioneffector/flags'

const store = createFlagStore({
  initial: { gold: 0, has_key: false, reputation: 50 }
})

// Simple operations
store.set('has_key', true)
store.increment('gold', 25)

// Powerful condition evaluation
if (store.check('gold >= 20 AND !has_key')) {
  store.decrement('gold', 20)
  store.set('has_key', true)
}

// Subscribe to changes
store.subscribe((key, newValue, oldValue) => {
  console.log(`${key}: ${oldValue} → ${newValue}`)
})
```

## Testing & Validation

- **Comprehensive test suite** - 569 unit tests covering core functionality
- **Fuzz tested** - Randomized input testing to catch edge cases
- **Strict TypeScript** - Full type coverage with no `any` types
- **Zero dependencies** - No supply chain risk

## License

MIT © [motioneffector](https://github.com/motioneffector)
