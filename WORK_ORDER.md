# Module Development Work Order

Generic instructions for building any `@motioneffector` library module. Follow these steps in order.

---

## Prerequisites

Before starting, ensure you have:
- Node.js 18+
- pnpm (preferred) or npm
- The module folder already exists with README.md and TESTS.md

---

## Phase 1: Orientation

### 1.1 Read Required Documentation

Read these files in order. Do not skip any.

```
1. STYLE.md          - Coding standards (in module root)
2. README.md         - Public API and usage examples
3. TESTS.md          - Test specifications (this is your implementation contract)
```

**Key understanding checkpoints:**
- [ ] I understand the public API surface from README.md
- [ ] I understand every test case in TESTS.md
- [ ] I understand the code style requirements from STYLE.md

### 1.2 Clarify Ambiguities

If anything in TESTS.md or README.md is unclear or contradictory:
1. Stop
2. Document the question
3. Get clarification before proceeding

Do NOT make assumptions about intended behavior.

---

## Phase 2: Project Setup

### 2.1 Initialize Package Structure

Ensure the following structure exists:

```
module-name/
├── src/
│   ├── index.ts          # Public exports only
│   ├── types.ts          # Public type definitions
│   └── errors.ts         # Custom error classes
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
├── TESTS.md
├── STYLE.md
└── CHANGELOG.md
```

### 2.2 Configure package.json

```json
{
  "name": "@motioneffector/module-name",
  "version": "0.0.1",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "test:run": "vitest run",
    "lint": "eslint src",
    "format": "prettier --write src",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vitest": "^2.0.0",
    "prettier": "^3.0.0",
    "eslint": "^9.0.0",
    "typescript-eslint": "^8.0.0"
  }
}
```

### 2.3 Configure TypeScript

Use strict mode as specified in STYLE.md:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### 2.4 Configure Vite

```typescript
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [] // Add peer dependencies here
    }
  }
})
```

### 2.5 Configure Prettier

Create `.prettierrc`:

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100,
  "arrowParens": "avoid"
}
```

### 2.6 Install Dependencies

```bash
pnpm install
```

---

## Phase 3: Define Types and Errors

### 3.1 Create Error Classes

In `src/errors.ts`, define all error types mentioned in TESTS.md:

```typescript
export class ModuleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ModuleError'
  }
}

// Add specific error types as specified in TESTS.md
```

### 3.2 Create Type Definitions

In `src/types.ts`, define all public types:

```typescript
// Define interfaces for all public API contracts
// These should match what README.md documents
```

**Checklist:**
- [ ] Every public function's parameters have types
- [ ] Every public function's return value has a type
- [ ] All options objects have interfaces
- [ ] All callback signatures are typed

---

## Phase 4: Write Tests First (TDD)

### 4.1 Create Test Files

For each section in TESTS.md, create corresponding test file(s):

```
TESTS.md Section          →  Test File
─────────────────────────────────────────
## 1. Store Creation      →  src/core/store.test.ts
## 2. Basic Operations    →  src/core/store.test.ts (same file)
## 5. Condition Eval      →  src/core/condition-parser.test.ts
```

### 4.2 Translate TESTS.md to Vitest

Follow STYLE.md section 6.1 exactly:

```markdown
### `store.get(key)`

✓ returns value for existing key
✓ returns undefined for missing key
```

Becomes:

```typescript
describe('store.get(key)', () => {
  it('returns value for existing key', () => {
    // Implementation
  })

  it('returns undefined for missing key', () => {
    // Implementation
  })
})
```

**Rules:**
- Test names must match TESTS.md exactly (copy-paste)
- Every `✓` line becomes one `it()` block
- Every `###` heading becomes one `describe()` block
- Nested `####` headings become nested `describe()` blocks

### 4.3 Write Failing Tests

Write ALL tests before writing implementation:

```typescript
it('returns value for existing key', () => {
  const store = createStore({ initial: { name: 'Alice' } })
  expect(store.get('name')).toBe('Alice')
})
```

Run tests to confirm they fail:

```bash
pnpm test:run
```

All tests should fail at this point. If any pass, something is wrong.

---

## Phase 5: Implementation

### 5.1 Create Source Files

Organize implementation files logically:

```
src/
├── index.ts              # Exports only
├── types.ts              # Public types
├── errors.ts             # Error classes
├── core/
│   ├── store.ts          # Main implementation
│   ├── store.test.ts     # Tests (colocated)
│   ├── parser.ts         # Supporting implementation
│   └── parser.test.ts    # Tests (colocated)
└── utils/
    ├── validators.ts     # Internal utilities
    └── validators.test.ts
```

### 5.2 Implement to Pass Tests

Work through tests systematically:

1. Pick a `describe()` block
2. Implement just enough code to pass those tests
3. Run tests: `pnpm test:run`
4. Refactor if needed (tests still pass)
5. Move to next `describe()` block

**Do NOT:**
- Implement features not covered by tests
- Add "nice to have" functionality
- Optimize prematurely

### 5.3 Export Public API

In `src/index.ts`, export only public API:

```typescript
// Functions
export { createStore } from './core/store'

// Errors
export { ValidationError, ParseError } from './errors'

// Types
export type { Store, StoreOptions } from './types'
```

---

## Phase 6: Documentation

### 6.1 Add JSDoc to Public API

Every exported function needs JSDoc:

```typescript
/**
 * Creates a new store instance.
 *
 * @param options - Configuration options
 * @returns A new Store instance
 *
 * @example
 * ```typescript
 * const store = createStore({ initial: { count: 0 } })
 * ```
 *
 * @throws {ValidationError} If options are invalid
 */
export function createStore(options?: StoreOptions): Store {
```

### 6.2 Verify README.md Accuracy

- [ ] All examples in README.md actually work
- [ ] API reference matches implementation
- [ ] No documented features are missing
- [ ] No undocumented features exist

### 6.3 Update CHANGELOG.md

```markdown
# Changelog

## [0.0.1] - YYYY-MM-DD

### Added
- Initial implementation
- Feature X
- Feature Y
```

---

## Phase 7: Quality Checks

### 7.1 Run All Tests

```bash
pnpm test:run
```

**Required: 100% of tests pass.**

### 7.2 Type Check

```bash
pnpm typecheck
```

**Required: Zero type errors.**

### 7.3 Lint

```bash
pnpm lint
```

**Required: Zero lint errors.**

### 7.4 Format

```bash
pnpm format
```

### 7.5 Build

```bash
pnpm build
```

**Required: Build succeeds with no errors.**

### 7.6 Manual Checklist

From STYLE.md appendix:

**Code Quality:**
- [ ] No `any` types
- [ ] All public functions have JSDoc
- [ ] All public functions have explicit return types
- [ ] No commented-out code
- [ ] No `console.log` (except in error handlers)
- [ ] No magic numbers/strings (use named constants)

**Testing:**
- [ ] All tests from TESTS.md implemented
- [ ] All tests pass
- [ ] Test names match TESTS.md specification exactly

**Documentation:**
- [ ] README.md examples work
- [ ] CHANGELOG.md updated
- [ ] JSDoc examples are correct

---

## Phase 8: Final Review

### 8.1 Self-Review

Read through all code as if reviewing someone else's work:

- Does it follow STYLE.md?
- Is it the simplest solution that works?
- Would a new developer understand it?

### 8.2 Test as Consumer

Create a simple test script that uses the library as an external consumer would:

```typescript
import { createStore } from '@motioneffector/module-name'

const store = createStore()
// Test basic workflows from README.md
```

### 8.3 Deliverables Checklist

Before marking complete:

- [ ] All TESTS.md specifications have passing tests
- [ ] `pnpm test:run` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
- [ ] README.md examples verified working
- [ ] CHANGELOG.md updated
- [ ] No TODO comments remain (or all are tracked issues)

---

## Appendix: Common Patterns

### Factory Function Pattern

```typescript
export function createThing(options?: ThingOptions): Thing {
  // Private state via closure
  const state = new Map<string, unknown>()

  // Return public interface
  return {
    get(key) {
      return state.get(key)
    },
    set(key, value) {
      state.set(key, value)
      return this // Enable chaining
    },
  }
}
```

### Validation Pattern

```typescript
function validateKey(key: string): void {
  if (typeof key !== 'string') {
    throw new TypeError('Key must be a string')
  }
  if (key.trim() === '') {
    throw new ValidationError('Key cannot be empty')
  }
}
```

### Subscription Pattern

```typescript
type Callback = (value: unknown) => void

function createObservable() {
  const listeners = new Set<Callback>()

  return {
    subscribe(callback: Callback) {
      listeners.add(callback)
      return () => listeners.delete(callback)
    },
    notify(value: unknown) {
      listeners.forEach(cb => {
        try {
          cb(value)
        } catch (e) {
          console.error('Subscriber error:', e)
        }
      })
    },
  }
}
```

### Error Class Pattern

```typescript
export class ModuleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ModuleError'
    // Fix prototype chain for instanceof
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class ValidationError extends ModuleError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}
```

---

## Troubleshooting

### Tests won't run
- Check vitest is installed: `pnpm add -D vitest`
- Check test files match pattern: `*.test.ts`

### Type errors in tests
- Use `@ts-expect-error` for intentional type violations
- Import types with `import type { }`

### Build fails
- Check `src/index.ts` exports exist
- Check no circular dependencies
- Run `pnpm typecheck` for specific errors

### Lint errors
- Run `pnpm format` first
- Check STYLE.md for conventions

---

## Module-Specific Notes: @motioneffector/flags

### Key Implementation Areas

1. **Condition Parser** - The `check()` method parses expression syntax (this is the most complex part)
2. **Type Coercion** - Boolean/number/string handling in comparisons
3. **Subscription System** - Change notifications with proper cleanup
4. **History/Undo** - State snapshots and restoration
5. **Namespacing** - Prefix-based key scoping

### Architecture Recommendation

The condition parser is complex enough to warrant its own file:

```
src/
├── core/
│   ├── store.ts              # Main store implementation
│   ├── store.test.ts
│   ├── condition-parser.ts   # Expression parser
│   ├── condition-parser.test.ts
│   ├── history.ts            # Undo/redo logic
│   └── history.test.ts
├── errors.ts
├── types.ts
└── index.ts
```

### Condition Parser Implementation

Consider a recursive descent parser or tokenizer + evaluator approach:

```typescript
// Tokenize: "gold >= 100 AND has_key" →
// [
//   { type: 'IDENTIFIER', value: 'gold' },
//   { type: 'OPERATOR', value: '>=' },
//   { type: 'NUMBER', value: '100' },
//   { type: 'AND' },
//   { type: 'IDENTIFIER', value: 'has_key' }
// ]

// Then evaluate against store state
```

### Test Data Setup

```typescript
// test/fixtures/stores.ts
export function createTestStore() {
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
```

### Test Patterns

**Parser Edge Cases (critical!):**
```typescript
describe('condition parser edge cases', () => {
  it('handles nested parentheses', () => {
    store.set('a', true)
    store.set('b', false)
    store.set('c', true)
    expect(store.check('((a AND b) OR c)')).toBe(true)
  })

  it('handles operator precedence (AND before OR)', () => {
    store.set('a', false)
    store.set('b', true)
    store.set('c', true)
    // a AND b OR c = (a AND b) OR c = false OR true = true
    expect(store.check('a AND b OR c')).toBe(true)
  })

  it('handles escaped quotes in strings', () => {
    store.set('msg', 'He said "hello"')
    expect(store.check('msg == "He said \\"hello\\""')).toBe(true)
  })

  it('throws ParseError for invalid syntax', () => {
    expect(() => store.check('AND')).toThrow(ParseError)
    expect(() => store.check('a AND')).toThrow(ParseError)
    expect(() => store.check('(a')).toThrow(ParseError)
  })
})
```

**Missing Flag Behavior:**
```typescript
describe('missing flags treated as 0', () => {
  it('missing > 5 returns false', () => {
    expect(store.check('nonexistent > 5')).toBe(false)  // 0 > 5
  })

  it('missing < 5 returns true', () => {
    expect(store.check('nonexistent < 5')).toBe(true)   // 0 < 5
  })

  it('missing == 0 returns true', () => {
    expect(store.check('nonexistent == 0')).toBe(true)  // 0 == 0
  })
})
```

**History/Undo Testing:**
```typescript
it('undo reverts to previous state', () => {
  const store = createFlagStore({ history: true })
  store.set('count', 1)
  store.set('count', 2)
  store.set('count', 3)

  store.undo()
  expect(store.get('count')).toBe(2)

  store.undo()
  expect(store.get('count')).toBe(1)
})

it('redo restores undone state', () => {
  const store = createFlagStore({ history: true })
  store.set('count', 1)
  store.set('count', 2)
  store.undo()

  store.redo()
  expect(store.get('count')).toBe(2)
})
```

### Common Pitfalls

- String comparison uses `==`/`!=` only; ordering (`>`, `<`) throws ParseError
- Missing flags are treated as `0`, not `false` (affects numeric comparisons)
- Case-insensitive operators: `AND`, `and`, `And` all work
- Case-sensitive flag names: `Flag` ≠ `flag`
- Spaces in keys are NOT allowed (simplifies parser)
- Computed flags cannot be set/deleted (throw Error)
