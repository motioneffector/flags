# Condition Expressions

Condition expressions let you query the store using natural language. Instead of writing `store.get('gold') >= 100 && store.get('has_key') === true`, you write `store.check('gold >= 100 AND has_key')`.

## How It Works

The store parses your condition string, looks up each flag name, and evaluates the expression. The result is always a boolean.

```
Condition: "gold >= 100 AND has_key"

           ↓ Parse

        [gold >= 100]  AND  [has_key]
              ↓                 ↓
        lookup: 150        lookup: true
              ↓                 ↓
          150 >= 100?      truthy?
              ↓                 ↓
            true              true
              ↓                 ↓
              └──── AND ────────┘
                     ↓
                   true
```

## Basic Usage

```typescript
import { createFlagStore } from '@motioneffector/flags'

const store = createFlagStore({
  initial: { gold: 150, has_key: true, level: 5 }
})

// Simple truthiness
store.check('has_key')              // true (has_key is true)
store.check('gold')                 // true (150 is truthy)

// Comparisons
store.check('gold >= 100')          // true
store.check('level == 5')           // true
store.check('level != 10')          // true

// Logical operators
store.check('gold >= 100 AND has_key')           // true
store.check('level < 3 OR has_key')              // true
store.check('NOT has_key')                       // false

// Grouping with parentheses
store.check('(gold >= 100 OR level >= 10) AND has_key')  // true
```

## Key Points

- **Operators are case-insensitive** - `AND`, `and`, `And` all work. Same for `OR` and `NOT`.

- **Flag names are case-sensitive** - `has_key` and `Has_Key` are different flags.

- **Missing flags are falsy** - If a flag doesn't exist, it's treated as `0` in comparisons and `false` in truthiness checks.

- **String comparisons use quotes** - Use `name == "Alice"` or `name == 'Alice'` for string equality. Only `==` and `!=` work with strings (no ordering).

- **Type mismatches return false** - Comparing a string to a number (`name > 5`) returns `false`, not an error.

## Operators

### Comparison Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `==` | Equal | `level == 5` |
| `!=` | Not equal | `level != 0` |
| `>` | Greater than | `gold > 100` |
| `<` | Less than | `health < 50` |
| `>=` | Greater or equal | `score >= 1000` |
| `<=` | Less or equal | `lives <= 3` |

### Logical Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `AND` | Both true | `gold >= 100 AND has_key` |
| `OR` | Either true | `is_admin OR is_moderator` |
| `NOT` / `!` | Negation | `NOT is_banned` or `!is_banned` |

### Precedence

`NOT` binds tightest, then `AND`, then `OR`. Use parentheses to override:

```typescript
// Without parentheses: AND binds before OR
store.check('a OR b AND c')       // a OR (b AND c)

// With parentheses: explicit grouping
store.check('(a OR b) AND c')     // (a OR b) AND c
```

## Examples

### Game Conditions

```typescript
// Can the player enter the dungeon?
store.check('level >= 5 AND has_key AND NOT is_cursed')

// Can the player afford this item?
store.check('gold >= 100')

// Is the player eligible for the quest?
store.check('reputation >= 50 AND (completed_tutorial OR is_veteran)')
```

### String Comparisons

```typescript
store.set('player_class', 'warrior')
store.set('difficulty', 'hard')

// Check exact string match
store.check('player_class == "warrior"')     // true
store.check("difficulty == 'hard'")          // true (single quotes work too)

// Not equal
store.check('player_class != "mage"')        // true
```

### Handling Missing Flags

```typescript
const store = createFlagStore()  // Empty store

// Missing flags are falsy
store.check('nonexistent')           // false
store.check('!nonexistent')          // true

// In comparisons, missing flags are 0
store.check('missing == 0')          // true
store.check('missing < 5')           // true (0 < 5)
store.check('missing > 0')           // false (0 > 0)
```

## Related

- **[Flag Store](Concept-Flag-Store)** - Where the values come from
- **[Namespaces](Concept-Namespaces)** - Scoped conditions with auto-prefixed flags
- **[API: Conditions](API-Conditions)** - Full `check()` method reference
