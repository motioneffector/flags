// Shared store instance used by all exhibits
import { createFlagStore } from '../dist/index.js'

// Initial game state
const INITIAL_STATE = {
  'player.health': 75,
  'player.gold': 150,
  'player.level': 5,
  'player.reputation': 80,
  'player.base_damage': 10,
  'inventory.has_sword': true,
  'inventory.has_shield': false,
  'inventory.has_key': true,
  'inventory.has_potion': false,
  'status.healthy': true,
  'status.poisoned': false,
  'status.blessed': false,
}

// Preset scenarios
export const SCENARIOS = {
  fresh: { ...INITIAL_STATE },
  danger: {
    ...INITIAL_STATE,
    'player.health': 12,
    'player.gold': 30,
    'status.healthy': false,
    'status.poisoned': true,
    'inventory.has_potion': false,
  },
  rich: {
    ...INITIAL_STATE,
    'player.gold': 999,
    'player.reputation': 95,
    'inventory.has_sword': true,
    'inventory.has_shield': true,
    'inventory.has_key': true,
    'inventory.has_potion': true,
  },
  battle: {
    ...INITIAL_STATE,
    'player.level': 10,
    'player.health': 100,
    'inventory.has_sword': true,
    'inventory.has_shield': true,
    'status.healthy': true,
    'status.blessed': true,
  },
}

// Item weights for computed flags
const ITEM_WEIGHTS = {
  sword: 3,
  shield: 5,
  key: 1,
  potion: 1,
}

// Create the shared store with history and persistence
export const store = createFlagStore({
  initial: INITIAL_STATE,
  history: { maxHistory: 30 },
  persist: { storage: localStorage, key: 'flags-demo', autoSave: false }
})

// Set up computed flags
store.compute('computed.weight', [
  'inventory.has_sword',
  'inventory.has_shield',
  'inventory.has_key',
  'inventory.has_potion'
], (sword, shield, key, potion) => {
  return (sword ? ITEM_WEIGHTS.sword : 0) +
         (shield ? ITEM_WEIGHTS.shield : 0) +
         (key ? ITEM_WEIGHTS.key : 0) +
         (potion ? ITEM_WEIGHTS.potion : 0)
})

store.compute('computed.total_damage', ['player.base_damage', 'player.level'], (base, level) => {
  return (base || 0) + ((level || 0) * 2)
})

// Pre-populate history with a "story" so users can immediately try undo/redo
export function populateInitialHistory() {
  // Only populate if history is empty (fresh start)
  if (!store.canUndo()) {
    // Simulate a story: found key, sold loot, trained, ambushed
    store.set('inventory.has_key', false) // Start without key
    store.set('inventory.has_key', true)  // Found key
    store.increment('player.gold', 50)    // Sold loot
    store.increment('player.level')       // Trained
    store.decrement('player.health', 25)  // Ambushed

    // Now at current state - user can click undo to go back through the story
  }
}

// Load scenario by setting all values
export function loadScenario(scenarioName) {
  const scenario = SCENARIOS[scenarioName]
  if (!scenario) return

  store.batch(() => {
    for (const [key, value] of Object.entries(scenario)) {
      store.set(key, value)
    }
  })
}

// Get all state as formatted object for display
export function getFormattedState() {
  const all = store.all()
  const lines = []

  // Group by namespace
  const groups = {}
  for (const [key, value] of Object.entries(all)) {
    const [ns] = key.split('.')
    if (!groups[ns]) groups[ns] = []
    groups[ns].push([key, value])
  }

  for (const [ns, entries] of Object.entries(groups)) {
    for (const [key, value] of entries) {
      const displayValue = typeof value === 'string' ? `"${value}"` : value
      lines.push(`${key}: ${displayValue}`)
    }
  }

  return lines.join('\n')
}
