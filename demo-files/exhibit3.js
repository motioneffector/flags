// Exhibit 3: Time Machine
// Undo/redo history, batch operations, and persistence

import { store } from './store.js'

// History tracking for timeline visualization
let historyStack = []
let currentIndex = -1

// DOM elements
let timelineTrack
let undoBtn, redoBtn, clearHistoryBtn
let saveBtn, loadBtn, persistenceStatus

export function initExhibit3() {
  // Get DOM references
  timelineTrack = document.getElementById('timeline-track')
  undoBtn = document.getElementById('undo-btn')
  redoBtn = document.getElementById('redo-btn')
  clearHistoryBtn = document.getElementById('clear-history-btn')
  saveBtn = document.getElementById('save-btn')
  loadBtn = document.getElementById('load-btn')
  persistenceStatus = document.getElementById('persistence-status')

  // Set up event listeners
  setupUndoRedo()
  setupBatchDemo()
  setupPersistence()

  // Subscribe to changes to track history
  store.subscribe((key, newValue, oldValue) => {
    // Track history for timeline visualization
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
  undoBtn.addEventListener('click', () => {
    if (store.canUndo()) {
      store.undo()
      currentIndex = Math.max(0, currentIndex - 1)
    }
  })

  redoBtn.addEventListener('click', () => {
    if (store.canRedo()) {
      store.redo()
      currentIndex = Math.min(historyStack.length - 1, currentIndex + 1)
    }
  })

  clearHistoryBtn.addEventListener('click', () => {
    store.clearHistory()
    historyStack = [{ label: 'start', icon: '○', isStart: true }]
    currentIndex = 0
    updateTimeline()
    updateButtonStates()
  })
}

function setupBatchDemo() {
  const make3ChangesBtn = document.getElementById('make-3-changes')
  const makeBatch3Btn = document.getElementById('make-batch-3')

  make3ChangesBtn.addEventListener('click', () => {
    // Three separate changes - creates 3 history entries
    store.increment('player.gold', 50)
    store.increment('player.level')
    store.toggle('inventory.has_potion')
  })

  makeBatch3Btn.addEventListener('click', () => {
    // Batched changes - creates 1 history entry
    store.batch(() => {
      store.increment('player.gold', 50)
      store.increment('player.level')
      store.toggle('inventory.has_potion')
    })
    // Add a batch entry to our visualization
    addHistoryEntry('batch', null, null, false, true)
  })
}

function setupPersistence() {
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
}

function updatePersistenceStatus(message, type) {
  persistenceStatus.textContent = message
  persistenceStatus.className = 'persistence-status ' + type

  // Clear status after 3 seconds
  setTimeout(() => {
    persistenceStatus.textContent = 'Ready'
    persistenceStatus.className = 'persistence-status'
  }, 3000)
}

function addHistoryEntry(key, newValue, oldValue, isStart = false, isBatch = false) {
  // Determine icon and label based on what changed
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

  historyStack.push({
    label,
    icon,
    isStart,
    isBatch,
    timestamp: Date.now()
  })

  // Limit history visualization
  if (historyStack.length > 20) {
    historyStack.shift()
  }

  currentIndex = historyStack.length - 1
}

function updateTimeline() {
  if (historyStack.length === 0) {
    timelineTrack.innerHTML = '<span class="timeline-empty">No history yet</span>'
    return
  }

  const html = historyStack.map((entry, index) => {
    const isCurrent = index === currentIndex
    const classes = [
      'timeline-dot',
      isCurrent ? 'current' : '',
      entry.isBatch ? 'batch' : '',
      entry.isStart ? 'start' : ''
    ].filter(Boolean).join(' ')

    const connector = index < historyStack.length - 1
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

  // Add click handlers for timeline navigation
  timelineTrack.querySelectorAll('.timeline-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const targetIndex = parseInt(dot.dataset.index)
      navigateToIndex(targetIndex)
    })
  })
}

function navigateToIndex(targetIndex) {
  // Navigate to a specific point in history
  const diff = targetIndex - currentIndex

  if (diff < 0) {
    // Go back
    for (let i = 0; i < Math.abs(diff); i++) {
      if (store.canUndo()) {
        store.undo()
      }
    }
  } else if (diff > 0) {
    // Go forward
    for (let i = 0; i < diff; i++) {
      if (store.canRedo()) {
        store.redo()
      }
    }
  }

  currentIndex = targetIndex
  updateTimeline()
}

function updateButtonStates() {
  undoBtn.disabled = !store.canUndo()
  redoBtn.disabled = !store.canRedo()

  // Update tooltips
  undoBtn.title = store.canUndo() ? 'Undo last change' : 'Nothing to undo'
  redoBtn.title = store.canRedo() ? 'Redo last change' : 'Nothing to redo'
}
