# @motioneffector/flags - Test Specification

Test-driven development specification for the flags library. All design decisions are documented in QUESTIONS.md.

---

## 1. Store Creation

### `createFlagStore(options?)`

#### Basic Creation
```
✓ creates empty store when called with no arguments
✓ creates empty store when called with empty options object
✓ store.all() returns empty object for new empty store
```

#### Initial Values
```
✓ creates store with initial boolean values
✓ creates store with initial numeric values
✓ creates store with initial string values
✓ creates store with mixed value types
✓ initial values are retrievable via get() immediately after creation
✓ initial values appear in all() immediately after creation
✓ initial values with falsy values (false, 0, '') are set correctly
```

#### Options Validation
```
✓ accepts { initial: Record<string, boolean | number | string> }
✓ accepts { persist: { storage: Storage } }
✓ accepts { persist: { storage: Storage, key: string } }
✓ accepts { persist: { storage: Storage, autoSave: boolean } }
✓ accepts { history: true }
✓ accepts { history: { maxHistory: number } }
✓ accepts combination of all options
✓ throws ValidationError if initial contains null value
✓ throws ValidationError if initial contains undefined value
✓ throws ValidationError if initial contains object value
✓ throws ValidationError if initial contains array value
✓ throws ValidationError if initial key is empty string
✓ throws ValidationError if initial key contains spaces
✓ throws ValidationError if initial key contains comparison operator
✓ throws ValidationError if initial key starts with !
✓ throws ValidationError if initial key is reserved word (AND, OR, NOT)
```

---

## 2. Basic Flag Operations

### `store.set(key, value)`

#### Setting Values
```
✓ sets a boolean true value
✓ sets a boolean false value
✓ sets a positive integer
✓ sets zero
✓ sets a negative integer
✓ sets a float value
✓ sets a non-empty string
✓ sets an empty string
✓ overwrites existing boolean with boolean
✓ overwrites existing boolean with number
✓ overwrites existing boolean with string
✓ overwrites existing number with different number
✓ overwrites existing string with different string
```

#### Null/Undefined as Delete (Decision 2.1)
```
✓ set(key, null) removes the key
✓ set(key, undefined) removes the key
✓ set(key, null) on non-existent key is a no-op (no error)
✓ get(key) returns undefined after set(key, null)
✓ has(key) returns false after set(key, null)
```

#### Key Validation (Decision 2.2)
```
✓ allows alphanumeric keys
✓ allows keys with underscores: 'my_flag'
✓ allows keys with hyphens: 'my-flag'
✓ allows keys with dots: 'player.health' (not treated as namespace)
✓ trims leading/trailing whitespace from key
✓ throws ValidationError for empty string key
✓ throws ValidationError for whitespace-only key
✓ throws ValidationError for key containing spaces: 'my flag'
✓ throws ValidationError for key containing '>'
✓ throws ValidationError for key containing '<'
✓ throws ValidationError for key containing '>='
✓ throws ValidationError for key containing '<='
✓ throws ValidationError for key containing '=='
✓ throws ValidationError for key containing '!='
✓ throws ValidationError for key starting with '!'
✓ throws ValidationError for key 'AND' (case-insensitive)
✓ throws ValidationError for key 'and'
✓ throws ValidationError for key 'OR' (case-insensitive)
✓ throws ValidationError for key 'or'
✓ throws ValidationError for key 'NOT' (case-insensitive)
✓ throws ValidationError for key 'not'
```

#### Return Value
```
✓ returns the store instance (for chaining)
```

### `store.get(key)`

```
✓ returns boolean true for stored true
✓ returns boolean false for stored false
✓ returns number for stored number
✓ returns string for stored string
✓ returns empty string for stored empty string
✓ returns 0 for stored 0
✓ returns undefined for non-existent key
✓ does not throw for non-existent key
```

### `store.has(key)`

```
✓ returns true if key exists with truthy value
✓ returns true if key exists with value false
✓ returns true if key exists with value 0
✓ returns true if key exists with empty string
✓ returns false if key was never set
✓ returns false if key was deleted
✓ returns false if key was set to null
```

### `store.delete(key)`

```
✓ removes an existing key
✓ get() returns undefined after delete
✓ has() returns false after delete
✓ no-op if key doesn't exist (no error thrown)
✓ returns the store instance (for chaining)
```

### `store.clear()`

```
✓ removes all flags from store
✓ all() returns empty object after clear
✓ has() returns false for all previously existing keys
✓ no-op on already empty store (no error)
✓ returns the store instance (for chaining)
```

---

## 3. Convenience Methods

### `store.toggle(key)`

#### Existing Boolean Keys
```
✓ toggles true to false
✓ toggles false to true
✓ multiple toggles alternate value correctly
```

#### Non-Existent Key (Decision 4.1)
```
✓ toggle on non-existent key sets it to true
✓ subsequent toggle changes it to false
```

#### Type Errors
```
✓ throws TypeError when key exists with numeric value
✓ throws TypeError when key exists with string value
```

#### Return Value
```
✓ returns the new boolean value after toggle
```

### `store.increment(key, amount?)`

#### Basic Incrementing
```
✓ increments by 1 when no amount specified
✓ increments by positive integer amount
✓ increments by negative amount (effectively decrement)
✓ increments by float amount (Decision 3.2)
✓ increments by 0 (no change)
```

#### Non-Existent Key (Decision 3.1)
```
✓ auto-initializes non-existent key to 0, then increments
✓ increment('newKey') results in value 1
✓ increment('newKey', 5) results in value 5
✓ increment('newKey', -3) results in value -3
```

#### Type Errors
```
✓ throws TypeError when key exists with boolean value
✓ throws TypeError when key exists with string value
```

#### Return Value
```
✓ returns the new numeric value after increment
```

### `store.decrement(key, amount?)`

#### Basic Decrementing
```
✓ decrements by 1 when no amount specified
✓ decrements by positive integer amount
✓ decrements by negative amount (effectively increment)
✓ decrements by float amount
✓ decrements by 0 (no change)
```

#### Non-Existent Key
```
✓ auto-initializes non-existent key to 0, then decrements
✓ decrement('newKey') results in value -1
✓ decrement('newKey', 5) results in value -5
```

#### Type Errors
```
✓ throws TypeError when key exists with boolean value
✓ throws TypeError when key exists with string value
```

#### Return Value
```
✓ returns the new numeric value after decrement
```

---

## 4. Bulk Operations

### `store.all()`

```
✓ returns object with all flags and their values
✓ returns empty object if no flags set
✓ returned object contains correct types (boolean, number, string)
✓ returned object is a shallow copy (mutations don't affect store)
✓ modifying returned object doesn't affect subsequent all() calls
```

### `store.keys()`

```
✓ returns array of all flag keys
✓ returns empty array if no flags set
✓ returned array contains strings only
✓ keys are in insertion order (or document if different)
✓ returned array is a copy (mutations don't affect store)
```

### `store.setMany(object)`

```
✓ sets multiple boolean flags at once
✓ sets multiple numeric flags at once
✓ sets multiple string flags at once
✓ sets mixed types at once
✓ overwrites existing values
✓ can add new keys and overwrite existing in same call
✓ setting a value to null removes that key
✓ setting a value to undefined removes that key
✓ empty object is a no-op (no error)
✓ validates all keys before setting any (atomic validation)
✓ throws ValidationError if any key is invalid (none are set)
✓ returns the store instance (for chaining)
```

---

## 5. Condition Evaluation

### `store.check(condition)` - Simple Truthy Checks

#### Truthiness Semantics (Decision 5.1: JS semantics)
```
✓ 'flag' returns true when flag is true
✓ 'flag' returns false when flag is false
✓ 'flag' returns true when flag is positive number
✓ 'flag' returns false when flag is 0
✓ 'flag' returns true when flag is negative number
✓ 'flag' returns true when flag is non-empty string
✓ 'flag' returns false when flag is empty string
✓ 'flag' returns false when flag doesn't exist (Decision 5.3)
```

#### Negation
```
✓ '!flag' returns false when flag is true
✓ '!flag' returns true when flag is false
✓ '!flag' returns true when flag is 0
✓ '!flag' returns true when flag is empty string
✓ '!flag' returns true when flag doesn't exist
✓ 'NOT flag' behaves same as '!flag'
✓ 'not flag' behaves same as '!flag' (case-insensitive)
✓ 'Not flag' behaves same as '!flag' (case-insensitive)
```

### `store.check(condition)` - Boolean Equality
```
✓ 'flag == true' returns true when flag is true
✓ 'flag == true' returns false when flag is false
✓ 'flag == false' returns true when flag is false
✓ 'flag == false' returns false when flag is true
✓ 'flag != true' returns true when flag is false
✓ 'flag != false' returns true when flag is true
```

### `store.check(condition)` - Numeric Equality
```
✓ 'count == 5' returns true when count is 5
✓ 'count == 5' returns false when count is not 5
✓ 'count == 0' returns true when count is 0
✓ 'count == -10' returns true when count is -10
✓ 'count == 3.14' returns true when count is 3.14
✓ 'count != 5' returns true when count is not 5
✓ 'count != 5' returns false when count is 5
```

### `store.check(condition)` - Numeric Comparisons
```
✓ 'count > 5' returns true when count is 6
✓ 'count > 5' returns false when count is 5
✓ 'count > 5' returns false when count is 4
✓ 'count < 5' returns true when count is 4
✓ 'count < 5' returns false when count is 5
✓ 'count < 5' returns false when count is 6
✓ 'count >= 5' returns true when count is 5
✓ 'count >= 5' returns true when count is 6
✓ 'count >= 5' returns false when count is 4
✓ 'count <= 5' returns true when count is 5
✓ 'count <= 5' returns true when count is 4
✓ 'count <= 5' returns false when count is 6
✓ 'count > -5' works with negative numbers
✓ 'count < -5' works with negative numbers
✓ 'count >= 0' boundary check
✓ 'count > 0.5' works with floats
✓ 'count <= 3.14159' works with floats
```

### `store.check(condition)` - String Equality (Decision 5.5: == and != only)
```
✓ 'name == "alice"' returns true when name is "alice"
✓ 'name == "alice"' returns false when name is "bob"
✓ 'name == "alice"' is case-sensitive (false for "Alice")
✓ 'name == ""' returns true when name is empty string
✓ 'name != "alice"' returns true when name is "bob"
✓ 'name != "alice"' returns false when name is "alice"
```

#### Quote Styles (Decision 5.6)
```
✓ 'name == "alice"' works with double quotes
✓ "name == 'alice'" works with single quotes
✓ 'name == "it\'s"' works with escaped single quote in double-quoted string
✓ "name == 'say \"hi\"'" works with escaped double quote in single-quoted string
```

#### Escaped Quotes (Decision 5.7)
```
✓ 'msg == "He said \"hello\""' matches string with embedded quotes
✓ "msg == 'It\\'s fine'" matches string with embedded apostrophe
```

### `store.check(condition)` - Logical Operators

#### AND
```
✓ 'a AND b' returns true when both true
✓ 'a AND b' returns false when a is false
✓ 'a AND b' returns false when b is false
✓ 'a AND b' returns false when both false
✓ 'a and b' works (case-insensitive)
✓ 'a And b' works (case-insensitive)
```

#### OR
```
✓ 'a OR b' returns true when both true
✓ 'a OR b' returns true when only a is true
✓ 'a OR b' returns true when only b is true
✓ 'a OR b' returns false when both false
✓ 'a or b' works (case-insensitive)
✓ 'a Or b' works (case-insensitive)
```

#### Chained Operators
```
✓ 'a AND b AND c' requires all three true
✓ 'a AND b AND c' returns false if any one is false
✓ 'a OR b OR c' returns true if any one is true
✓ 'a OR b OR c' returns false only if all are false
```

#### Operator Precedence (AND higher than OR)
```
✓ 'a AND b OR c' with a=T, b=F, c=T returns true (c is true)
✓ 'a AND b OR c' with a=T, b=F, c=F returns false
✓ 'a OR b AND c' with a=F, b=T, c=T returns true (b AND c is true)
✓ 'a OR b AND c' with a=F, b=T, c=F returns false
✓ 'a AND b OR c AND d' evaluates as '(a AND b) OR (c AND d)'
```

#### Parentheses Override Precedence
```
✓ '(a OR b) AND c' with a=T, b=F, c=F returns false
✓ '(a OR b) AND c' with a=T, b=F, c=T returns true
✓ 'a AND (b OR c)' with a=T, b=F, c=T returns true
✓ 'a AND (b OR c)' with a=T, b=F, c=F returns false
✓ 'NOT (a AND b)' with a=T, b=T returns false
✓ 'NOT (a AND b)' with a=T, b=F returns true
✓ '!(a OR b)' with a=F, b=F returns true
✓ '!(a OR b)' with a=T, b=F returns false
```

#### Nested Parentheses
```
✓ '((a AND b) OR c) AND d' evaluates correctly
✓ '(a AND (b OR (c AND d)))' evaluates correctly
✓ deeply nested parentheses (5+ levels) work correctly
```

### `store.check(condition)` - Complex Conditions
```
✓ '(has_key OR has_lockpick) AND !alarm_triggered'
✓ 'gold >= 100 AND reputation > 50 AND NOT is_banished'
✓ 'level >= 5 AND (class == "warrior" OR class == "paladin")'
✓ 'health > 0 AND health <= 100' (range check)
✓ '(a == 1 OR a == 2 OR a == 3) AND b' (multiple equality checks)
✓ 'score > 100 AND (bonus == true OR multiplier >= 2)'
```

### `store.check(condition)` - Edge Cases

#### Missing Flags (Decision 5.3: treated as 0)
```
✓ 'nonexistent' returns false (0 is falsy)
✓ 'existing AND nonexistent' returns false
✓ 'existing OR nonexistent' returns true if existing is true
✓ 'missing > 5' returns false (0 > 5 is false)
✓ 'missing < 5' returns true (0 < 5 is true)
✓ 'missing == 0' returns true (0 == 0 is true)
✓ 'missing >= 0' returns true (0 >= 0 is true)
✓ 'missing != 0' returns false (0 != 0 is false)
✓ 'missing <= -1' returns false (0 <= -1 is false)
```

#### Type Mismatches (Decision 5.4: return false)
```
✓ 'boolFlag > 5' returns false when boolFlag is true
✓ 'boolFlag < 5' returns false when boolFlag is false
✓ 'stringFlag > 5' returns false
✓ 'stringFlag >= 100' returns false
✓ 'numericFlag == "5"' returns false (number vs string)
✓ 'stringFlag == 5' returns false (string vs number)
✓ 'boolFlag == 1' returns false (boolean vs number)
✓ 'boolFlag == "true"' returns false (boolean vs string)
```

#### String Ordering Not Supported (Decision 5.5: throws ParseError)
```
✓ 'name > "alice"' throws ParseError with message indicating ordering not supported for strings
✓ 'name < "zebra"' throws ParseError
✓ 'name >= "a"' throws ParseError
✓ 'name <= "z"' throws ParseError
```

#### Whitespace Handling
```
✓ 'a AND b' works (single space)
✓ 'a  AND  b' works (multiple spaces)
✓ '  a AND b  ' works (leading/trailing whitespace)
✓ 'a\tAND\tb' works (tabs)
✓ 'a\nAND\nb' works (newlines)
```

#### Case Sensitivity
```
✓ flag names are case-sensitive: 'Flag' != 'flag'
✓ operators are case-insensitive: AND, and, And all work
✓ boolean literals are case-insensitive: true, TRUE, True all work
✓ string comparisons are case-sensitive: "Alice" != "alice"
```

#### Empty/Invalid Conditions (Decision 5.2: throw)
```
✓ check('') throws ParseError with message "Condition cannot be empty"
✓ check('   ') throws ParseError with message "Condition cannot be empty"
✓ check('AND') throws ParseError (operator without operands)
✓ check('a AND') throws ParseError (incomplete expression)
✓ check('AND b') throws ParseError (incomplete expression)
✓ check('a AND AND b') throws ParseError (consecutive operators)
✓ check('(a AND b') throws ParseError (unclosed parenthesis)
✓ check('a AND b)') throws ParseError (unmatched closing parenthesis)
✓ check('()') throws ParseError (empty parentheses)
✓ check('a == ') throws ParseError (missing value)
✓ check('== 5') throws ParseError (missing flag name)
✓ check('a >> 5') throws ParseError (invalid operator)
✓ check('a === 5') throws ParseError (invalid operator)
```

---

## 6. Change Subscriptions

### `store.subscribe(callback)`

#### Basic Subscription
```
✓ callback fires when any flag is set
✓ callback fires when any flag is deleted
✓ callback fires when flag is toggled
✓ callback fires when flag is incremented
✓ callback fires when flag is decremented
✓ callback receives (key, newValue, oldValue) arguments
✓ callback receives correct key that was changed
✓ callback receives correct newValue after change
✓ callback receives correct oldValue before change
✓ callback receives undefined as oldValue for new key
✓ callback receives undefined as newValue for deleted key
```

#### Unsubscribe
```
✓ subscribe returns an unsubscribe function
✓ calling unsubscribe stops future callbacks
✓ calling unsubscribe multiple times is safe (no error)
✓ unsubscribe only affects that specific subscription
```

#### Multiple Subscribers
```
✓ multiple subscribers all receive notifications
✓ subscribers are called in subscription order
✓ unsubscribing one doesn't affect others
```

#### Duplicate Callbacks (Decision 6.4: allow)
```
✓ same callback can be subscribed multiple times
✓ callback is invoked once per subscription
✓ each subscription has independent unsubscribe function
```

#### Callback Error Handling (Decision 6.2: catch, log, continue)
```
✓ error in one callback doesn't prevent other callbacks
✓ error in callback is logged to console.error
✓ store state is still updated even if callback throws
```

#### Subscription During Callback (Decision 6.3: after current cycle)
```
✓ new subscription during callback doesn't fire for current change
✓ new subscription fires for subsequent changes
✓ unsubscribe during callback prevents callback for current change
```

### `store.subscribeKey(key, callback)`

#### Basic Key Subscription
```
✓ callback fires only when specified key changes
✓ callback does not fire for other key changes
✓ callback receives (newValue, oldValue) arguments
✓ callback receives correct newValue after change
✓ callback receives correct oldValue before change
```

#### Unsubscribe
```
✓ returns unsubscribe function
✓ calling unsubscribe stops future callbacks for that key
```

#### Multiple Key Subscriptions
```
✓ can subscribe to multiple different keys
✓ can subscribe multiple callbacks to same key
✓ each subscription is independent
```

### Clear Event (Decision 6.1: single 'clear' event)
```
✓ clear() fires subscribe callback once (not per key)
✓ callback receives ('__clear__', undefined, undefined) or similar marker
✓ clear() does not fire subscribeKey callbacks
```

### setMany Event
```
✓ setMany fires single subscribe callback (not per key)
✓ callback receives bulk change information
```

---

## 7. History (Undo/Redo)

### Store Without History
```
✓ store created without { history: true } has no undo method
✓ store created without { history: true } has no redo method
✓ store created without { history: true } has no canUndo method
✓ store created without { history: true } has no canRedo method
```

### Store With History Enabled

#### Basic Undo
```
✓ undo() reverts last set() operation
✓ undo() reverts last delete() operation
✓ undo() reverts last toggle() operation
✓ undo() reverts last increment() operation
✓ undo() reverts last decrement() operation
✓ undo() reverts last clear() operation
✓ undo() returns true when operation was undone
```

#### Multiple Undos
```
✓ multiple undo() calls walk back through history
✓ can undo all changes back to initial state
✓ cannot undo past initial state (Decision 7.3)
✓ undo() returns false when nothing to undo (Decision 7.1)
```

#### Basic Redo
```
✓ redo() re-applies last undone change
✓ redo() returns true when operation was redone
✓ redo() returns false when nothing to redo
```

#### Undo/Redo Interaction
```
✓ redo() after undo() restores the undone change
✓ multiple redo() calls walk forward through undo history
✓ new change after undo() clears redo stack
✓ redo() is no-op after new change (returns false)
```

#### canUndo / canRedo
```
✓ canUndo() returns false on fresh store
✓ canUndo() returns true after a change
✓ canUndo() returns false after undoing all changes
✓ canRedo() returns false on fresh store
✓ canRedo() returns false after a change (no undos yet)
✓ canRedo() returns true after undo()
✓ canRedo() returns false after redo() exhausts redo stack
✓ canRedo() returns false after new change clears redo stack
```

#### clearHistory()
```
✓ clearHistory() clears undo stack
✓ clearHistory() clears redo stack
✓ canUndo() returns false after clearHistory()
✓ canRedo() returns false after clearHistory()
✓ current state is preserved after clearHistory()
```

### History and Events (Decision 7.2: fire normally)
```
✓ undo() fires subscribe callback with change info
✓ redo() fires subscribe callback with change info
✓ undo() fires subscribeKey callback for affected key
```

### History Limits
```
✓ respects { history: { maxHistory: N } } option
✓ oldest entry dropped when limit exceeded
✓ can still undo up to maxHistory changes
✓ default maxHistory is reasonable (e.g., 100)
```

### History with Batch
```
✓ batch() records as single history entry
✓ undo() after batch reverts entire batch
```

### History with setMany
```
✓ setMany() records as single history entry
✓ undo() after setMany reverts all changes from setMany
```

---

## 8. Persistence

### Storage Interface
```
✓ storage object must have getItem(key) method
✓ storage object must have setItem(key, value) method
✓ storage object must have removeItem(key) method
✓ localStorage satisfies storage interface
✓ sessionStorage satisfies storage interface
```

### Auto-Save (Decision 8.1: configurable, default auto)
```
✓ with { persist: { storage } }, auto-save is enabled by default
✓ state saved after set()
✓ state saved after delete()
✓ state saved after toggle()
✓ state saved after increment()
✓ state saved after decrement()
✓ state saved after clear()
✓ state saved after setMany()
✓ with { persist: { storage, autoSave: false } }, auto-save is disabled
✓ with autoSave disabled, changes are not persisted automatically
```

### Manual Save/Load
```
✓ store.save() persists current state
✓ store.load() restores state from storage
✓ load() overwrites current state
✓ load() fires change events for changed keys
```

### Storage Key (Decision 8.3: configurable with default)
```
✓ default storage key is '@motioneffector/flags'
✓ custom key via { persist: { storage, key: 'custom' } }
✓ different stores with different keys don't conflict
```

### Restore on Creation
```
✓ if storage has data, state is restored on store creation
✓ initial option values are overwritten by persisted state
✓ if storage is empty, initial values are used
```

### Serialization
```
✓ boolean true survives round-trip
✓ boolean false survives round-trip
✓ positive integer survives round-trip
✓ negative integer survives round-trip
✓ zero survives round-trip
✓ float survives round-trip
✓ non-empty string survives round-trip
✓ empty string survives round-trip
✓ types are preserved (not coerced to strings)
```

### Error Handling
```
✓ handles storage.getItem() throwing gracefully
✓ handles storage.setItem() throwing gracefully (e.g., quota exceeded)
✓ handles corrupted JSON in storage gracefully
✓ handles storage returning null gracefully
✓ store remains functional after storage error
```

### Multiple Stores (Decision 8.4: yes)
```
✓ multiple stores can exist with different storage keys
✓ stores don't interfere with each other
```

---

## 9. Namespacing

### `store.namespace(prefix)`

#### Basic Namespacing
```
✓ namespace() returns a scoped store view
✓ scoped.set('key', value) actually sets 'prefix.key' in root store
✓ scoped.get('key') retrieves 'prefix.key' from root store
✓ scoped.has('key') checks 'prefix.key' in root store
✓ scoped.delete('key') removes 'prefix.key' from root store
```

#### Separator (Decision 9.1: dot)
```
✓ namespace uses dot separator: 'prefix.key'
✓ namespace('player').set('health', 100) creates 'player.health'
✓ namespace('game').namespace('player') creates 'game.player.key'
```

#### Scoped Operations
```
✓ scoped.toggle('flag') toggles 'prefix.flag'
✓ scoped.increment('count') increments 'prefix.count'
✓ scoped.decrement('count') decrements 'prefix.count'
✓ scoped.all() returns only keys under prefix (without prefix in keys)
✓ scoped.keys() returns only keys under prefix (without prefix in keys)
✓ scoped.clear() removes only keys under prefix
```

#### Scoped Conditions (Decision 9.3: auto-prefix all flags)
```
✓ scoped.check('flag') checks 'prefix.flag'
✓ scoped.check('a AND b') checks 'prefix.a AND prefix.b'
✓ scoped.check('count > 5') checks 'prefix.count > 5'
✓ scoped.check('flag == "value"') checks 'prefix.flag == "value"'
✓ scoped.check('(a OR b) AND c') prefixes all: 'prefix.a', 'prefix.b', 'prefix.c'
```

#### Nested Namespaces
```
✓ namespace('a').namespace('b') creates prefix 'a.b'
✓ deeply nested namespaces work correctly
```

#### Namespace and Root Store Interaction
```
✓ changes via namespace are visible in root store
✓ changes via root store are visible in namespace
✓ subscriptions on root fire for namespace changes
✓ subscriptions on namespace only fire for that namespace's changes
```

#### Keys with Dots (Decision 9.2)
```
✓ root store can have keys with dots: set('a.b', true)
✓ 'a.b' key is distinct from namespace('a').set('b', true) - both create 'a.b'
✓ accessing via namespace('a').get('b') returns value set via set('a.b', true)
```

---

## 10. Batch Updates

### `store.batch(fn)`

#### Basic Batching
```
✓ multiple set() calls in batch fire single subscribe notification
✓ batch returns the result of the function
✓ changes are visible inside batch function
✓ changes are visible after batch completes
```

#### Notification Behavior
```
✓ subscribe callback fires once after batch, not during
✓ subscribeKey callbacks fire once per affected key after batch
✓ callback receives summary of all changes in batch
```

#### History Integration
```
✓ batch records as single undo step (with history enabled)
✓ undo after batch reverts all changes in batch
```

#### Nested Batches (Decision 11.2: flatten)
```
✓ nested batch is absorbed into outer batch
✓ inner batch does not fire notification
✓ single notification fires at end of outermost batch
```

#### Error Handling
```
✓ error in batch function propagates to caller
✓ changes before error are rolled back
✓ store state unchanged after error in batch
✓ no notifications fired if batch errors
```

#### Batch with Various Operations
```
✓ batch can contain set() calls
✓ batch can contain delete() calls
✓ batch can contain toggle() calls
✓ batch can contain increment() calls
✓ batch can contain decrement() calls
✓ batch can contain clear() calls
✓ batch can contain setMany() calls
```

---

## 11. Computed Flags

### `store.compute(key, dependencies, fn)`

#### Basic Computed Values
```
✓ creates derived value from other flags
✓ computed value is immediately available via get()
✓ computed value updates when dependency changes
✓ computed function receives dependency values as arguments
```

#### Example
```typescript
store.set('baseScore', 100)
store.set('bonus', 20)
store.compute('totalScore', ['baseScore', 'bonus'], (base, bonus) => base + bonus)
// store.get('totalScore') === 120
```

```
✓ computed with single dependency
✓ computed with multiple dependencies
✓ computed updates when any dependency changes
✓ computed does not update when unrelated flag changes
```

#### Computed in Conditions (Decision 10.3: yes)
```
✓ check() can reference computed flags
✓ check('computedFlag > 100') works
✓ check('computedFlag AND otherFlag') works
```

#### Read-Only Nature
```
✓ set() on computed key throws Error
✓ delete() on computed key throws Error
✓ toggle() on computed key throws Error
✓ increment() on computed key throws Error
```

#### Computed and has/keys/all
```
✓ has(computedKey) returns true
✓ keys() includes computed keys
✓ all() includes computed values
```

#### Computed and Subscriptions
```
✓ subscribe fires when computed value changes
✓ subscribeKey on computed key fires when value changes
✓ subscription receives computed value, not dependency values
```

#### Error Handling
```
✓ compute() with non-existent dependency works (dependency is undefined)
✓ compute function throwing is handled gracefully
✓ circular dependency (a depends on b, b depends on a) throws Error
✓ self-referential compute throws Error
```

#### Computed Flags are Permanent
```
✓ there is no removeComputed() method
✓ computed flags persist for lifetime of store
✓ clear() does not remove computed flag definitions (only regular flags)
```

#### Synchronous (Decision 10.2)
```
✓ computed function must be synchronous
✓ async function is not allowed (or its return value is the promise, not resolved value)
```

---

## 12. Error Classes

### ValidationError
```
✓ thrown for invalid key names
✓ thrown for invalid value types
✓ has name 'ValidationError'
✓ has descriptive message
✓ instanceof ValidationError
✓ instanceof Error
```

### ParseError
```
✓ thrown for invalid condition syntax
✓ thrown for empty condition
✓ has name 'ParseError'
✓ has descriptive message indicating what's wrong
✓ instanceof ParseError
✓ instanceof Error
```

### TypeError (native)
```
✓ thrown when toggle() called on non-boolean
✓ thrown when increment() called on non-number
✓ thrown when decrement() called on non-number
```

---

## 13. Edge Cases & Stress Tests

### Key Edge Cases
```
✓ very long key names (1000+ characters) work
✓ Unicode in key names works: 'über_flag', '日本語'
✓ key with only numbers: '123'
✓ key with leading/trailing spaces is trimmed
```

### Value Edge Cases
```
✓ very large numbers (near MAX_SAFE_INTEGER) work
✓ very small numbers (near MIN_SAFE_INTEGER) work
✓ very long strings (10000+ characters) work
✓ Unicode in string values works
✓ string with newlines works
✓ string with special characters works
```

### Condition Edge Cases
```
✓ very long condition (many AND/OR) parses correctly
✓ deeply nested parentheses (20+ levels) work
✓ numeric-looking flag name '123' can be used in conditions
```

### Concurrency
```
✓ rapid successive set() calls all succeed
✓ set() during subscribe callback works
✓ delete() during subscribe callback works
✓ store remains consistent after many rapid operations
```

### Memory
```
✓ unsubscribe properly cleans up references
✓ delete properly cleans up flag
✓ clear() properly cleans up all flags
```

---

## Test Utilities Needed

```typescript
// Helper to create store with common test flags
function createTestStore() {
  return createFlagStore({
    initial: {
      boolTrue: true,
      boolFalse: false,
      numPositive: 42,
      numZero: 0,
      numNegative: -10,
      strNonEmpty: 'hello',
      strEmpty: ''
    }
  })
}

// Mock storage backend
class MockStorage {
  private data = new Map<string, string>()
  getItem(key: string): string | null { return this.data.get(key) ?? null }
  setItem(key: string, value: string): void { this.data.set(key, value) }
  removeItem(key: string): void { this.data.delete(key) }
  clear(): void { this.data.clear() }
}

// Failing storage for error testing
class FailingStorage {
  getItem(): string | null { throw new Error('Storage unavailable') }
  setItem(): void { throw new Error('Storage unavailable') }
  removeItem(): void { throw new Error('Storage unavailable') }
}

// Spy helper for subscription testing
function createSubscriptionSpy() {
  const calls: Array<{ key: string; newValue: any; oldValue: any }> = []
  const callback = (key: string, newValue: any, oldValue: any) => {
    calls.push({ key, newValue, oldValue })
  }
  return { callback, calls }
}
```

