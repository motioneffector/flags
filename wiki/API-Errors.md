# Errors API

Error classes thrown by the flag store.

---

## `FlagsError`

Base error class for all library errors.

```typescript
class FlagsError extends Error {
  name: 'FlagsError'
}
```

All errors from this library extend `FlagsError`, so you can catch them all:

```typescript
import { FlagsError } from '@motioneffector/flags'

try {
  store.check('invalid syntax ((')
} catch (e) {
  if (e instanceof FlagsError) {
    console.log('Flag store error:', e.message)
  }
}
```

---

## `ValidationError`

Thrown when a flag key or value fails validation.

```typescript
class ValidationError extends FlagsError {
  name: 'ValidationError'
  field?: string
}
```

| Property | Type | Description |
|----------|------|-------------|
| `message` | `string` | Description of the validation failure |
| `field` | `string \| undefined` | The field that failed validation (if applicable) |

### When Thrown

**Invalid key:**

```typescript
store.set('', 'value')
// ValidationError: Flag key cannot be empty

store.set('has spaces', 'value')
// ValidationError: Flag key cannot contain spaces

store.set('AND', 'value')
// ValidationError: Flag key cannot be a reserved word

store.set('OR', 'value')
// ValidationError: Flag key cannot be a reserved word

store.set('NOT', 'value')
// ValidationError: Flag key cannot be a reserved word
```

**Invalid value type:**

```typescript
store.set('key', { object: true })
// TypeError: Flag value must be boolean, number, or string

store.set('key', [1, 2, 3])
// TypeError: Flag value must be boolean, number, or string
```

**Type mismatch in operations:**

```typescript
store.set('name', 'Alice')
store.toggle('name')
// TypeError: Cannot toggle non-boolean flag

store.increment('name')
// TypeError: Cannot increment non-numeric flag
```

---

## `ParseError`

Thrown when a condition expression has invalid syntax.

```typescript
class ParseError extends FlagsError {
  name: 'ParseError'
  position?: number
  input?: string
}
```

| Property | Type | Description |
|----------|------|-------------|
| `message` | `string` | Description of the parse error |
| `position` | `number \| undefined` | Character position where the error occurred |
| `input` | `string \| undefined` | The input string that failed to parse |

### When Thrown

**Empty condition:**

```typescript
store.check('')
// ParseError: Condition cannot be empty

store.check('   ')
// ParseError: Condition cannot be empty
```

**Incomplete expression:**

```typescript
store.check('a AND')
// ParseError: Unexpected end of expression

store.check('AND b')
// ParseError: Unexpected token 'AND'

store.check('a ==')
// ParseError: Expected value after operator
```

**Unbalanced parentheses:**

```typescript
store.check('(a AND b')
// ParseError: Unclosed parenthesis

store.check('a AND b)')
// ParseError: Unexpected closing parenthesis

store.check('()')
// ParseError: Empty parentheses
```

**Invalid operators:**

```typescript
store.check('a >> 5')
// ParseError: Invalid operator '>>'

store.check('a === 5')
// ParseError: Invalid operator '==='
```

**String ordering:**

```typescript
store.check('name > "alice"')
// ParseError: Ordering operators not supported for strings
```

---

## Error Handling Patterns

### Catching All Library Errors

```typescript
import { FlagsError, ValidationError, ParseError } from '@motioneffector/flags'

try {
  store.set(userInput.key, userInput.value)
  store.check(userInput.condition)
} catch (e) {
  if (e instanceof ValidationError) {
    console.error('Invalid input:', e.message)
  } else if (e instanceof ParseError) {
    console.error('Invalid condition:', e.message)
  } else if (e instanceof FlagsError) {
    console.error('Store error:', e.message)
  } else {
    throw e  // Re-throw unknown errors
  }
}
```

### Validating User Input

```typescript
function isValidCondition(condition: string): boolean {
  try {
    store.check(condition)
    return true
  } catch (e) {
    if (e instanceof ParseError) {
      return false
    }
    throw e
  }
}
```

### Graceful Degradation

```typescript
function safeCheck(condition: string, fallback = false): boolean {
  try {
    return store.check(condition)
  } catch (e) {
    console.warn('Invalid condition:', condition, e)
    return fallback
  }
}
```

---

## Errors That Are NOT Thrown

Some error conditions are handled gracefully without throwing:

### Storage Errors

```typescript
// Storage failures are logged, not thrown
const store = createFlagStore({
  persist: { storage: failingStorage }
})
// Works in-memory, logs error to console.error
```

### Missing Flags

```typescript
// Missing flags return undefined, not an error
store.get('nonexistent')  // undefined

// In conditions, missing flags are 0/falsy
store.check('missing')  // false (no error)
```

### Subscriber Errors

```typescript
// Errors in subscribers are caught and logged
store.subscribe(() => { throw new Error('Oops') })
store.set('x', 1)  // Still works, error logged to console.error
```

### Compute Function Errors

```typescript
// Errors in compute functions are caught
store.compute('result', ['x'], () => { throw new Error('Oops') })
store.get('result')  // Returns previous value, error logged
```
