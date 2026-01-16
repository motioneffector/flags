# Reading and Writing API

Core methods for getting, setting, and manipulating flag values.

---

## `get()`

Retrieves the value of a flag.

**Signature:**

```typescript
get(key: string): FlagValue | undefined
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `key` | `string` | Yes | The flag key (trimmed automatically) |

**Returns:** `FlagValue | undefined` — The flag value, or `undefined` if the flag doesn't exist.

**Example:**

```typescript
store.set('gold', 100)
store.get('gold')      // 100
store.get('missing')   // undefined
```

---

## `set()`

Sets a flag to a specific value.

**Signature:**

```typescript
set(key: string, value: FlagValue | null | undefined): FlagStore
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `key` | `string` | Yes | The flag key (trimmed automatically) |
| `value` | `FlagValue \| null \| undefined` | Yes | The value to set, or null/undefined to delete |

**Returns:** `FlagStore` — The store instance for chaining.

**Throws:**

- `ValidationError` — If the key is empty, contains spaces, or is a reserved word (AND, OR, NOT)
- `TypeError` — If the value is not boolean, number, or string
- `Error` — If attempting to set a computed flag

**Example:**

```typescript
store.set('gold', 100)
store.set('name', 'Ada')
store.set('active', true)

// Chaining
store.set('a', 1).set('b', 2).set('c', 3)

// Delete by setting null/undefined
store.set('gold', null)
```

---

## `has()`

Checks if a flag exists in the store.

**Signature:**

```typescript
has(key: string): boolean
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `key` | `string` | Yes | The flag key (trimmed automatically) |

**Returns:** `boolean` — `true` if the flag exists, `false` otherwise.

**Example:**

```typescript
store.set('gold', 100)
store.has('gold')      // true
store.has('missing')   // false
```

---

## `delete()`

Deletes a flag from the store.

**Signature:**

```typescript
delete(key: string): FlagStore
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `key` | `string` | Yes | The flag key to delete (trimmed automatically) |

**Returns:** `FlagStore` — The store instance for chaining.

**Throws:**

- `Error` — If attempting to delete a computed flag

**Example:**

```typescript
store.set('gold', 100)
store.delete('gold')
store.has('gold')      // false
```

---

## `clear()`

Deletes all flags from the store.

**Signature:**

```typescript
clear(): FlagStore
```

**Returns:** `FlagStore` — The store instance for chaining.

**Example:**

```typescript
store.set('a', 1)
store.set('b', 2)
store.clear()
store.keys()           // []
```

Note: Computed flag definitions are preserved (but their values update based on cleared dependencies).

---

## `toggle()`

Toggles a boolean flag.

**Signature:**

```typescript
toggle(key: string): boolean
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `key` | `string` | Yes | The flag key (trimmed automatically) |

**Returns:** `boolean` — The new value after toggling.

**Throws:**

- `ValidationError` — If the key is invalid
- `TypeError` — If the flag exists and is not a boolean
- `Error` — If attempting to toggle a computed flag

**Example:**

```typescript
store.set('dark_mode', false)
store.toggle('dark_mode')  // true
store.toggle('dark_mode')  // false

// Creates flag if missing (defaults to true)
store.toggle('new_flag')   // true
```

---

## `increment()`

Increments a numeric flag by a specified amount.

**Signature:**

```typescript
increment(key: string, amount?: number): number
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `key` | `string` | Yes | The flag key (trimmed automatically) |
| `amount` | `number` | No | Amount to increment by. Default: `1` |

**Returns:** `number` — The new value after incrementing.

**Throws:**

- `ValidationError` — If the key is invalid
- `TypeError` — If the flag exists and is not a number
- `Error` — If attempting to increment a computed flag

**Example:**

```typescript
store.set('count', 10)
store.increment('count')      // 11
store.increment('count', 5)   // 16

// Creates flag if missing (initializes to amount)
store.increment('new', 100)   // 100
```

---

## `decrement()`

Decrements a numeric flag by a specified amount.

**Signature:**

```typescript
decrement(key: string, amount?: number): number
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `key` | `string` | Yes | The flag key (trimmed automatically) |
| `amount` | `number` | No | Amount to decrement by. Default: `1` |

**Returns:** `number` — The new value after decrementing.

**Throws:**

- `ValidationError` — If the key is invalid
- `TypeError` — If the flag exists and is not a number
- `Error` — If attempting to decrement a computed flag

**Example:**

```typescript
store.set('health', 100)
store.decrement('health')      // 99
store.decrement('health', 25)  // 74

// Creates flag if missing (initializes to -amount)
store.decrement('new', 5)      // -5
```

---

## `all()`

Gets all flags in the store as a plain object.

**Signature:**

```typescript
all(): Record<string, FlagValue>
```

**Returns:** `Record<string, FlagValue>` — An object with all flag keys and their values.

**Example:**

```typescript
store.set('a', 1)
store.set('b', 'hello')
store.all()  // { a: 1, b: 'hello' }
```

---

## `keys()`

Gets all flag keys in the store.

**Signature:**

```typescript
keys(): string[]
```

**Returns:** `string[]` — An array of flag keys.

**Example:**

```typescript
store.set('gold', 100)
store.set('level', 5)
store.keys()  // ['gold', 'level']
```

---

## `setMany()`

Sets multiple flags at once.

**Signature:**

```typescript
setMany(values: Record<string, FlagValue | null | undefined>): FlagStore
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `values` | `Record<string, FlagValue \| null \| undefined>` | Yes | Object with flag keys and values |

**Returns:** `FlagStore` — The store instance for chaining.

**Throws:**

- `ValidationError` — If any key is invalid
- `TypeError` — If any value type is not allowed

**Example:**

```typescript
store.setMany({
  gold: 100,
  level: 5,
  name: 'Ada'
})
```

Note: All keys are validated before any values are set. If validation fails, no changes are made.
