# Conditions API

Query the store with boolean condition expressions.

---

## `check()`

Evaluates a boolean condition against current flag values.

**Signature:**

```typescript
check(condition: string): boolean
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `condition` | `string` | Yes | A condition expression to evaluate |

**Returns:** `boolean` — `true` if the condition is satisfied, `false` otherwise.

**Throws:**

- `ParseError` — If the condition syntax is invalid
- `ParseError` — If ordering operators (`>`, `<`, `>=`, `<=`) are used with string values

**Example:**

```typescript
store.set('gold', 150)
store.set('has_key', true)
store.set('level', 5)

// Simple truthiness
store.check('has_key')              // true

// Comparisons
store.check('gold >= 100')          // true
store.check('level == 5')           // true

// Logical operators
store.check('gold >= 100 AND has_key')   // true
store.check('level < 3 OR has_key')      // true
store.check('NOT has_key')               // false

// Parentheses
store.check('(gold >= 100 OR level >= 10) AND has_key')  // true
```

---

## Condition Syntax

### Flag References

Any identifier in a condition is looked up as a flag key:

```typescript
store.check('myFlag')           // Checks if myFlag is truthy
store.check('player_health')    // Checks if player_health is truthy
```

Flag names are case-sensitive: `myFlag` and `MyFlag` are different flags.

### Boolean Literals

```typescript
store.check('flag == true')
store.check('flag == false')
```

Boolean literals are case-insensitive: `true`, `TRUE`, `True` all work.

### Numeric Literals

```typescript
store.check('gold >= 100')
store.check('health < 50')
store.check('level == 5')
store.check('temperature > -10')
store.check('ratio <= 0.5')
```

Supports integers, negative numbers, and floats.

### String Literals

```typescript
store.check('name == "Alice"')
store.check("status == 'active'")
store.check('class != "warrior"')
```

Use double or single quotes. Only `==` and `!=` are supported for strings.

### Comparison Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `==` | Equal | `level == 5` |
| `!=` | Not equal | `status != "banned"` |
| `>` | Greater than | `gold > 100` |
| `<` | Less than | `health < 25` |
| `>=` | Greater or equal | `score >= 1000` |
| `<=` | Less or equal | `lives <= 0` |

### Logical Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `AND` | Both true | `a AND b` |
| `OR` | Either true | `a OR b` |
| `NOT` | Negation | `NOT a` |
| `!` | Negation (alt) | `!a` |

Operators are case-insensitive: `AND`, `and`, `And` all work.

### Operator Precedence

From highest to lowest:

1. `NOT` / `!` (tightest binding)
2. `AND`
3. `OR` (loosest binding)

```typescript
// a OR b AND c is parsed as: a OR (b AND c)
store.check('a OR b AND c')

// Use parentheses to override
store.check('(a OR b) AND c')
```

### Parentheses

Group expressions to control evaluation order:

```typescript
store.check('(a OR b) AND c')
store.check('NOT (a AND b)')
store.check('((a AND b) OR c) AND d')
```

---

## Special Cases

### Missing Flags

Missing flags are treated as `0` (falsy):

```typescript
const store = createFlagStore()  // Empty

store.check('missing')           // false (0 is falsy)
store.check('!missing')          // true
store.check('missing == 0')      // true
store.check('missing < 5')       // true (0 < 5)
```

### Type Mismatches

Comparing incompatible types returns `false`:

```typescript
store.set('name', 'Alice')
store.set('count', 5)

store.check('name == 5')         // false (string vs number)
store.check('count == "5"')      // false (number vs string)
store.check('name > 0')          // throws ParseError (ordering not supported for strings)
```

### Whitespace

Whitespace is flexible:

```typescript
store.check('a AND b')           // Works
store.check('a  AND  b')         // Works (multiple spaces)
store.check('  a AND b  ')       // Works (leading/trailing)
store.check('a\tAND\tb')         // Works (tabs)
store.check('a\nAND\nb')         // Works (newlines)
```

---

## Errors

### Empty Condition

```typescript
store.check('')       // throws ParseError: "Condition cannot be empty"
store.check('   ')    // throws ParseError: "Condition cannot be empty"
```

### Syntax Errors

```typescript
store.check('AND')              // throws ParseError (operator without operands)
store.check('a AND')            // throws ParseError (incomplete expression)
store.check('(a AND b')         // throws ParseError (unclosed parenthesis)
store.check('a >> 5')           // throws ParseError (invalid operator)
```

### String Ordering

```typescript
store.check('name > "alice"')   // throws ParseError: "ordering not supported for strings"
```

Use `==` and `!=` for string comparisons.
