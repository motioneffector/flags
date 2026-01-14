// Exhibit 1: Game State Dashboard
// Direct manipulation of flag values with immediate visual feedback

import { store, loadScenario, getFormattedState } from './store.js'

// DOM element references
let healthBar, healthValue, healthBarContainer
let goldBar, goldValue, goldBarContainer
let levelValue, levelUpBtn
let reputationBar, reputationValue, reputationBarContainer
let weightBar, weightValue
let rawStateDisplay, toggleStateBtn
let stateCollapsed = false

// Track last values for change highlighting
let lastState = {}

export function initExhibit1() {
  // Get DOM references
  healthBar = document.getElementById('health-bar')
  healthValue = document.getElementById('health-value')
  healthBarContainer = document.getElementById('health-bar-container')

  goldBar = document.getElementById('gold-bar')
  goldValue = document.getElementById('gold-value')
  goldBarContainer = document.getElementById('gold-bar-container')

  levelValue = document.getElementById('level-value')
  levelUpBtn = document.getElementById('level-up-btn')

  reputationBar = document.getElementById('reputation-bar')
  reputationValue = document.getElementById('reputation-value')
  reputationBarContainer = document.getElementById('reputation-bar-container')

  weightBar = document.getElementById('weight-bar')
  weightValue = document.getElementById('weight-value')

  rawStateDisplay = document.getElementById('raw-state')
  toggleStateBtn = document.getElementById('toggle-state')

  // Initialize state display
  lastState = store.all()
  updateRawStateDisplay()

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
  store.subscribe((key, newValue, oldValue) => {
    updateUI()
  })

  // Initial UI update
  updateUI()
}

function setupScenarioButtons() {
  document.querySelectorAll('[data-scenario]').forEach(btn => {
    btn.addEventListener('click', () => {
      const scenario = btn.dataset.scenario
      loadScenario(scenario)
    })
  })
}

function setupHealthBar() {
  // Click to set health
  healthBarContainer.addEventListener('click', (e) => {
    const rect = healthBarContainer.getBoundingClientRect()
    const percent = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const health = Math.max(0, Math.min(100, percent))
    store.set('player.health', health)

    // Flash red if critical
    if (health <= 25) {
      healthBar.classList.add('critical')
      setTimeout(() => healthBar.classList.remove('critical'), 500)
    }
  })
}

function setupGoldBar() {
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

  // Also handle click
  goldBarContainer.addEventListener('click', updateGold)
}

function setupLevelUp() {
  levelUpBtn.addEventListener('click', () => {
    store.increment('player.level')
    levelUpBtn.classList.add('animating')
    setTimeout(() => levelUpBtn.classList.remove('animating'), 300)
  })
}

function setupReputationBar() {
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

      // Animate the flip
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
          // Activating this one - deactivate the other
          store.batch(() => {
            store.set('status.healthy', status === 'healthy')
            store.set('status.poisoned', status === 'poisoned')
          })
        } else {
          // Deactivating - just toggle off
          store.set(key, false)
        }
      } else {
        // Blessed can be toggled independently
        store.toggle(key)
      }
    })
  })
}

function setupStateToggle() {
  toggleStateBtn.addEventListener('click', () => {
    stateCollapsed = !stateCollapsed
    rawStateDisplay.classList.toggle('collapsed', stateCollapsed)
    toggleStateBtn.textContent = stateCollapsed ? 'Expand' : 'Collapse'
  })
}

function updateUI() {
  // Update health
  const health = store.get('player.health') || 0
  healthBar.style.width = `${health}%`
  healthValue.textContent = health

  // Update gold
  const gold = store.get('player.gold') || 0
  goldBar.style.width = `${(gold / 1000) * 100}%`
  goldValue.textContent = gold

  // Update level
  const level = store.get('player.level') || 1
  levelValue.textContent = level

  // Update reputation
  const reputation = store.get('player.reputation') || 0
  reputationBar.style.width = `${reputation}%`
  reputationValue.textContent = reputation

  // Update weight
  const weight = store.get('computed.weight') || 0
  weightBar.style.width = `${(weight / 10) * 100}%`
  weightValue.textContent = `${weight}/10 kg`

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
      const changed = lastState[key] !== value
      const valueClass = changed ? 'state-value changed' : 'state-value'
      lines.push(`<span class="state-key">${key}</span>: <span class="${valueClass}">${displayValue}</span>`)
    }
  }

  rawStateDisplay.innerHTML = lines.join('\n')
  lastState = { ...currentState }
}

// Export for external use
export { updateUI }
