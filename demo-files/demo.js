// Demo logic for @motioneffector/flags
// This file contains all demo exhibit initialization and interaction logic

// Verify library is loaded
if (typeof window.Library === 'undefined') {
  throw new Error(
    'Library not loaded. Run `pnpm build` first, then serve this directory.'
  )
}

const { createFlagStore } = window.Library

// ============================================
// SHARED STORE SETUP
// ============================================

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
const SCENARIOS = {
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

// Create the shared store
const store = createFlagStore({
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

// Export store globally for debugging
window.demoStore = store

// ============================================
// EXHIBIT 1: GAME STATE DASHBOARD
// ============================================

let exhibit1 = {
  lastState: {}
}

function initExhibit1() {
  exhibit1.lastState = store.all()

  // Set up event listeners
  setupScenarioButtons()
  setupHealthBar()
  setupGoldBar()
  setupLevelUp()
  setupReputationBar()
  setupInventory()
  setupStatusEffects()
  setupStateToggle()

  // Subscribe to store changes
  store.subscribe(() => {
    updateExhibit1UI()
  })

  // Initial UI update
  updateExhibit1UI()
}

function setupScenarioButtons() {
  document.querySelectorAll('[data-scenario]').forEach(btn => {
    btn.addEventListener('click', () => {
      const scenario = btn.dataset.scenario
      loadScenario(scenario)
    })
  })
}

function loadScenario(scenarioName) {
  const scenario = SCENARIOS[scenarioName]
  if (!scenario) return

  store.batch(() => {
    for (const [key, value] of Object.entries(scenario)) {
      store.set(key, value)
    }
  })
}

function setupHealthBar() {
  const healthBarContainer = document.getElementById('health-bar-container')
  healthBarContainer.addEventListener('click', (e) => {
    const rect = healthBarContainer.getBoundingClientRect()
    const percent = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const health = Math.max(0, Math.min(100, percent))
    store.set('player.health', health)

    // Flash red if critical
    const healthBar = document.getElementById('health-bar')
    if (health <= 25) {
      healthBar.classList.add('critical')
      setTimeout(() => healthBar.classList.remove('critical'), 500)
    }
  })
}

function setupGoldBar() {
  const goldBarContainer = document.getElementById('gold-bar-container')
  let isDragging = false

  const updateGold = (e) => {
    const rect = goldBarContainer.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const gold = Math.round(Math.max(0, Math.min(1000, percent * 1000)))
    store.set('player.gold', gold)
  }

  goldBarContainer.addEventListener('mousedown', (e) => {
    isDragging = true
    updateGold(e)
  })

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      updateGold(e)
    }
  })

  document.addEventListener('mouseup', () => {
    isDragging = false
  })

  goldBarContainer.addEventListener('click', updateGold)
}

function setupLevelUp() {
  const levelUpBtn = document.getElementById('level-up-btn')
  levelUpBtn.addEventListener('click', () => {
    store.increment('player.level')
    levelUpBtn.classList.add('animating')
    setTimeout(() => levelUpBtn.classList.remove('animating'), 300)
  })
}

function setupReputationBar() {
  const reputationBarContainer = document.getElementById('reputation-bar-container')
  reputationBarContainer.addEventListener('click', (e) => {
    const rect = reputationBarContainer.getBoundingClientRect()
    const percent = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const reputation = Math.max(0, Math.min(100, percent))
    store.set('player.reputation', reputation)
  })
}

function setupInventory() {
  document.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', () => {
      const item = card.dataset.item
      const key = `inventory.has_${item}`
      store.toggle(key)

      card.classList.add('animating')
      setTimeout(() => card.classList.remove('animating'), 250)
    })
  })
}

function setupStatusEffects() {
  document.querySelectorAll('.status-card').forEach(card => {
    card.addEventListener('click', () => {
      const status = card.dataset.status
      const key = `status.${status}`
      const current = store.get(key)

      // Handle mutual exclusion for health statuses
      if (status === 'healthy' || status === 'poisoned') {
        if (!current) {
          store.batch(() => {
            store.set('status.healthy', status === 'healthy')
            store.set('status.poisoned', status === 'poisoned')
          })
        } else {
          store.set(key, false)
        }
      } else {
        store.toggle(key)
      }
    })
  })
}

function setupStateToggle() {
  const toggleStateBtn = document.getElementById('toggle-state')
  const rawStateDisplay = document.getElementById('raw-state')
  let stateCollapsed = false

  toggleStateBtn.addEventListener('click', () => {
    stateCollapsed = !stateCollapsed
    rawStateDisplay.classList.toggle('collapsed', stateCollapsed)
    toggleStateBtn.textContent = stateCollapsed ? 'Expand' : 'Collapse'
  })
}

function updateExhibit1UI() {
  // Update health
  const health = store.get('player.health') || 0
  document.getElementById('health-bar').style.width = `${health}%`
  document.getElementById('health-value').textContent = health

  // Update gold
  const gold = store.get('player.gold') || 0
  document.getElementById('gold-bar').style.width = `${(gold / 1000) * 100}%`
  document.getElementById('gold-value').textContent = gold

  // Update level
  const level = store.get('player.level') || 1
  document.getElementById('level-value').textContent = level

  // Update reputation
  const reputation = store.get('player.reputation') || 0
  document.getElementById('reputation-bar').style.width = `${reputation}%`
  document.getElementById('reputation-value').textContent = reputation

  // Update weight
  const weight = store.get('computed.weight') || 0
  document.getElementById('weight-bar').style.width = `${(weight / 10) * 100}%`
  document.getElementById('weight-value').textContent = `${weight}/10 kg`

  // Update inventory cards
  document.querySelectorAll('.item-card').forEach(card => {
    const item = card.dataset.item
    const hasItem = store.get(`inventory.has_${item}`)
    card.classList.toggle('equipped', hasItem)
    const statusEl = card.querySelector('.item-status')
    statusEl.textContent = hasItem ? 'Equipped' : 'Unequipped'
    statusEl.classList.toggle('equipped', hasItem)
  })

  // Update status effects
  document.querySelectorAll('.status-card').forEach(card => {
    const status = card.dataset.status
    const isActive = store.get(`status.${status}`)
    card.classList.toggle('active', isActive)
  })

  // Update raw state display
  updateRawStateDisplay()
}

function updateRawStateDisplay() {
  const rawStateDisplay = document.getElementById('raw-state')
  const currentState = store.all()
  const lines = []

  // Group by namespace
  const groups = {}
  for (const [key, value] of Object.entries(currentState)) {
    const [ns] = key.split('.')
    if (!groups[ns]) groups[ns] = []
    groups[ns].push([key, value])
  }

  for (const [ns, entries] of Object.entries(groups).sort()) {
    for (const [key, value] of entries.sort((a, b) => a[0].localeCompare(b[0]))) {
      const displayValue = typeof value === 'string' ? `"${value}"` : value
      const changed = exhibit1.lastState[key] !== value
      const valueClass = changed ? 'state-value changed' : 'state-value'
      lines.push(`<span class="state-key">${key}</span>: <span class="${valueClass}">${displayValue}</span>`)
    }
  }

  rawStateDisplay.innerHTML = lines.join('\n')
  exhibit1.lastState = { ...currentState }
}

// ============================================
// EXHIBIT 2: LIVE CONDITION CARDS
// ============================================

const DEFAULT_CONDITIONS = [
  {
    name: 'Can Enter Dungeon?',
    condition: 'player.level >= 5 AND inventory.has_key'
  },
  {
    name: 'Can Afford Plate Armor (200g)?',
    condition: 'player.gold >= 200'
  },
  {
    name: 'Ready for Battle?',
    condition: 'inventory.has_sword AND NOT status.poisoned'
  },
  {
    name: 'Elite Status?',
    condition: 'player.level >= 10 OR (player.reputation >= 90 AND player.gold >= 500)'
  }
]

let exhibit2 = {
  conditions: [],
  previousResults: new Map()
}

function initExhibit2() {
  const conditionsGrid = document.getElementById('conditions-grid')

  // Load saved conditions or use defaults
  const saved = localStorage.getItem('demo-conditions')
  if (saved) {
    try {
      exhibit2.conditions = JSON.parse(saved)
    } catch {
      exhibit2.conditions = [...DEFAULT_CONDITIONS]
    }
  } else {
    exhibit2.conditions = [...DEFAULT_CONDITIONS]
  }

  // Set up modal
  setupConditionModal()

  // Initial render
  renderConditions()

  // Subscribe to store changes
  store.subscribe(() => {
    updateConditions()
  })
}

function setupConditionModal() {
  const modal = document.getElementById('condition-modal')
  const addBtn = document.getElementById('add-condition-btn')
  const closeBtn = document.getElementById('close-modal')
  const customConditionInput = document.getElementById('custom-condition')
  const customNameInput = document.getElementById('custom-condition-name')
  const addCustomBtn = document.getElementById('add-custom-condition')

  addBtn.addEventListener('click', () => {
    modal.classList.remove('hidden')
  })

  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden')
  })

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden')
    }
  })

  // Template buttons
  document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      addCondition(btn.dataset.name, btn.dataset.condition)
      modal.classList.add('hidden')
    })
  })

  // Custom condition
  addCustomBtn.addEventListener('click', () => {
    const name = customNameInput.value.trim() || 'Custom Condition'
    const condition = customConditionInput.value.trim()
    if (condition) {
      addCondition(name, condition)
      customNameInput.value = ''
      customConditionInput.value = ''
      modal.classList.add('hidden')
    }
  })
}

function addCondition(name, condition) {
  exhibit2.conditions.push({ name, condition })
  saveConditions()
  renderConditions()
}

function removeCondition(index) {
  exhibit2.conditions.splice(index, 1)
  saveConditions()
  renderConditions()
}

function saveConditions() {
  localStorage.setItem('demo-conditions', JSON.stringify(exhibit2.conditions))
}

function renderConditions() {
  const conditionsGrid = document.getElementById('conditions-grid')
  conditionsGrid.innerHTML = exhibit2.conditions.map((c, i) => {
    const result = evaluateCondition(c.condition)
    exhibit2.previousResults.set(i, result)

    return `
      <div class="condition-card ${result ? 'passing' : 'failing'}" data-index="${i}">
        <div class="condition-header">
          <span class="condition-name">${escapeHtml(c.name)}</span>
          <span class="condition-result ${result ? 'pass' : 'fail'}">${result ? '✓' : '✗'}</span>
          <button class="condition-delete" data-index="${i}" title="Remove">&times;</button>
        </div>
        <div class="condition-expression">
          ${renderConditionBlocks(c.condition)}
        </div>
      </div>
    `
  }).join('')

  // Set up delete buttons
  document.querySelectorAll('.condition-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      removeCondition(parseInt(btn.dataset.index))
    })
  })
}

function updateConditions() {
  const cards = document.querySelectorAll('.condition-card')

  cards.forEach((card, i) => {
    const condition = exhibit2.conditions[i]
    if (!condition) return

    const result = evaluateCondition(condition.condition)
    const prevResult = exhibit2.previousResults.get(i)

    card.classList.toggle('passing', result)
    card.classList.toggle('failing', !result)

    if (prevResult !== undefined && prevResult !== result) {
      card.classList.add('animating')
      setTimeout(() => card.classList.remove('animating'), 400)
    }

    const resultEl = card.querySelector('.condition-result')
    resultEl.textContent = result ? '✓' : '✗'
    resultEl.classList.toggle('pass', result)
    resultEl.classList.toggle('fail', !result)

    const expressionEl = card.querySelector('.condition-expression')
    expressionEl.innerHTML = renderConditionBlocks(condition.condition)

    exhibit2.previousResults.set(i, result)
  })
}

function evaluateCondition(condition) {
  try {
    return store.check(condition)
  } catch {
    return false
  }
}

function renderConditionBlocks(condition) {
  const parts = parseConditionParts(condition)
  return parts.map(part => {
    if (part.type === 'operator') {
      return `<span class="condition-operator">${part.value}</span>`
    } else if (part.type === 'expression') {
      const result = evaluateExpression(part.expression)
      const currentValue = getCurrentValue(part.expression)
      return `
        <div class="condition-block ${result ? 'passing' : 'failing'}">
          <span class="block-expression">${escapeHtml(part.expression)}</span>
          ${currentValue !== null ? `<br><span class="block-value">${currentValue}</span>` : ''}
          <span class="block-result">${result ? '✓' : '✗'}</span>
        </div>
      `
    }
    return ''
  }).join('')
}

function parseConditionParts(condition) {
  const parts = []
  const tokens = condition.split(/\s+(AND|OR)\s+/i)

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].trim()
    if (!token) continue

    if (/^(AND|OR)$/i.test(token)) {
      parts.push({ type: 'operator', value: token.toUpperCase() })
    } else {
      let expr = token
      if (/^NOT\s+/i.test(expr)) {
        expr = expr.replace(/^NOT\s+/i, '!').trim()
      }
      expr = expr.replace(/^\(|\)$/g, '')
      parts.push({ type: 'expression', expression: expr })
    }
  }

  return parts
}

function evaluateExpression(expression) {
  try {
    return store.check(expression)
  } catch {
    return false
  }
}

function getCurrentValue(expression) {
  const match = expression.match(/^!?([a-zA-Z_][a-zA-Z0-9_.]*)\s*([<>=!]+)?\s*(.+)?$/)
  if (!match) return null

  const [, flagName, operator, compareValue] = match
  const value = store.get(flagName)

  if (operator && compareValue !== undefined) {
    return `${value} ${operator} ${compareValue}`
  } else {
    return String(value)
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ============================================
// EXHIBIT 3: TIME MACHINE
// ============================================

let exhibit3 = {
  historyStack: [],
  currentIndex: -1
}

function initExhibit3() {
  // Set up event listeners
  setupUndoRedo()
  setupBatchDemo()
  setupPersistence()

  // Subscribe to changes to track history
  store.subscribe((key, newValue, oldValue) => {
    if (key !== '__batch__' && key !== '__clear__' && key !== '__setMany__') {
      addHistoryEntry(key, newValue, oldValue)
    }
    updateTimeline()
    updateButtonStates()
  })

  // Initialize with starting state
  addHistoryEntry('start', null, null, true)
  updateTimeline()
  updateButtonStates()
}

function setupUndoRedo() {
  const undoBtn = document.getElementById('undo-btn')
  const redoBtn = document.getElementById('redo-btn')
  const clearHistoryBtn = document.getElementById('clear-history-btn')

  undoBtn.addEventListener('click', () => {
    if (store.canUndo()) {
      store.undo()
      exhibit3.currentIndex = Math.max(0, exhibit3.currentIndex - 1)
    }
  })

  redoBtn.addEventListener('click', () => {
    if (store.canRedo()) {
      store.redo()
      exhibit3.currentIndex = Math.min(exhibit3.historyStack.length - 1, exhibit3.currentIndex + 1)
    }
  })

  clearHistoryBtn.addEventListener('click', () => {
    store.clearHistory()
    exhibit3.historyStack = [{ label: 'start', icon: '○', isStart: true }]
    exhibit3.currentIndex = 0
    updateTimeline()
    updateButtonStates()
  })
}

function setupBatchDemo() {
  const make3ChangesBtn = document.getElementById('make-3-changes')
  const makeBatch3Btn = document.getElementById('make-batch-3')

  make3ChangesBtn.addEventListener('click', () => {
    store.increment('player.gold', 50)
    store.increment('player.level')
    store.toggle('inventory.has_potion')
  })

  makeBatch3Btn.addEventListener('click', () => {
    store.batch(() => {
      store.increment('player.gold', 50)
      store.increment('player.level')
      store.toggle('inventory.has_potion')
    })
    addHistoryEntry('batch', null, null, false, true)
  })
}

function setupPersistence() {
  const saveBtn = document.getElementById('save-btn')
  const loadBtn = document.getElementById('load-btn')
  const persistenceStatus = document.getElementById('persistence-status')

  saveBtn.addEventListener('click', () => {
    try {
      store.save()
      updatePersistenceStatus('Saved successfully!', 'success')
    } catch (e) {
      updatePersistenceStatus('Failed to save: ' + e.message, 'error')
    }
  })

  loadBtn.addEventListener('click', () => {
    try {
      store.load()
      updatePersistenceStatus('Loaded successfully!', 'success')
    } catch (e) {
      updatePersistenceStatus('Failed to load: ' + e.message, 'error')
    }
  })

  function updatePersistenceStatus(message, type) {
    persistenceStatus.textContent = message
    persistenceStatus.className = 'persistence-status ' + type

    setTimeout(() => {
      persistenceStatus.textContent = 'Ready'
      persistenceStatus.className = 'persistence-status'
    }, 3000)
  }
}

function addHistoryEntry(key, newValue, oldValue, isStart = false, isBatch = false) {
  let icon = '●'
  let label = key

  if (isStart) {
    icon = '○'
    label = 'start'
  } else if (isBatch) {
    icon = '×3'
    label = 'batch'
  } else if (key.includes('health')) {
    icon = '❤️'
    label = newValue > oldValue ? '+hp' : '-hp'
  } else if (key.includes('gold')) {
    icon = '💰'
    label = newValue > oldValue ? '+gold' : '-gold'
  } else if (key.includes('level')) {
    icon = '⭐'
    label = 'lvl↑'
  } else if (key.includes('has_')) {
    const item = key.split('has_')[1]
    const icons = { sword: '⚔️', shield: '🛡️', key: '🔑', potion: '🧪' }
    icon = icons[item] || '📦'
    label = newValue ? `+${item}` : `-${item}`
  } else if (key.includes('status')) {
    icon = '✨'
    label = key.split('.')[1]
  } else if (key.includes('reputation')) {
    icon = '📊'
    label = 'rep'
  }

  exhibit3.historyStack.push({
    label,
    icon,
    isStart,
    isBatch,
    timestamp: Date.now()
  })

  if (exhibit3.historyStack.length > 20) {
    exhibit3.historyStack.shift()
  }

  exhibit3.currentIndex = exhibit3.historyStack.length - 1
}

function updateTimeline() {
  const timelineTrack = document.getElementById('timeline-track')

  if (exhibit3.historyStack.length === 0) {
    timelineTrack.innerHTML = '<span class="timeline-empty">No history yet</span>'
    return
  }

  const html = exhibit3.historyStack.map((entry, index) => {
    const isCurrent = index === exhibit3.currentIndex
    const classes = [
      'timeline-dot',
      isCurrent ? 'current' : '',
      entry.isBatch ? 'batch' : '',
      entry.isStart ? 'start' : ''
    ].filter(Boolean).join(' ')

    const connector = index < exhibit3.historyStack.length - 1
      ? '<div class="timeline-connector"></div>'
      : ''

    return `
      <div class="${classes}" data-index="${index}" title="${entry.label}">
        <span class="dot-icon">${entry.icon}</span>
        <span class="dot-label">${entry.label}</span>
      </div>
      ${connector}
    `
  }).join('')

  timelineTrack.innerHTML = html

  timelineTrack.querySelectorAll('.timeline-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const targetIndex = parseInt(dot.dataset.index)
      navigateToIndex(targetIndex)
    })
  })
}

function navigateToIndex(targetIndex) {
  const diff = targetIndex - exhibit3.currentIndex

  if (diff < 0) {
    for (let i = 0; i < Math.abs(diff); i++) {
      if (store.canUndo()) {
        store.undo()
      }
    }
  } else if (diff > 0) {
    for (let i = 0; i < diff; i++) {
      if (store.canRedo()) {
        store.redo()
      }
    }
  }

  exhibit3.currentIndex = targetIndex
  updateTimeline()
}

function updateButtonStates() {
  const undoBtn = document.getElementById('undo-btn')
  const redoBtn = document.getElementById('redo-btn')

  undoBtn.disabled = !store.canUndo()
  redoBtn.disabled = !store.canRedo()

  undoBtn.title = store.canUndo() ? 'Undo last change' : 'Nothing to undo'
  redoBtn.title = store.canRedo() ? 'Redo last change' : 'Nothing to redo'
}

// Pre-populate history with a "story"
function populateInitialHistory() {
  if (!store.canUndo()) {
    store.set('inventory.has_key', false)
    store.set('inventory.has_key', true)
    store.increment('player.gold', 50)
    store.increment('player.level')
    store.decrement('player.health', 25)
  }
}

// ============================================
// INITIALIZATION
// ============================================

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('@motioneffector/flags demo initializing...')

  try {
    // Populate initial history
    populateInitialHistory()

    // Initialize each exhibit
    initExhibit1()
    initExhibit2()
    initExhibit3()

    console.log('Demo initialized successfully!')
  } catch (error) {
    console.error('Failed to initialize demo:', error)

    document.body.innerHTML = `
      <div style="padding: 40px; text-align: center; color: #f85149;">
        <h1>Demo Failed to Load</h1>
        <p>Error: ${error.message}</p>
        <p>Check the browser console for details.</p>
      </div>
    `
  }
})
