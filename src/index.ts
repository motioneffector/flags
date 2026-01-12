// @motioneffector/flags
// Game state / flags manager with condition evaluation

// Main store creation function
export { createFlagStore } from './core/store'

// Error classes
export { FlagsError, ValidationError, ParseError } from './errors'

// Type exports
export type {
  FlagValue,
  Storage,
  PersistOptions,
  HistoryOptions,
  FlagStoreOptions,
  ChangeCallback,
  KeyChangeCallback,
  UnsubscribeFn,
  ComputeFn,
  FlagStore,
  FlagStoreWithHistory,
  FlagStoreWithPersistence,
} from './types'
