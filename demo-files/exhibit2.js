// Exhibit 2: Live Condition Cards
// Visual condition evaluation that reacts to game state changes

import { store } from './store.js'

// Pre-defined conditions
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

// Active conditions
let conditions = []
let conditionsGrid

// Track previous results for animation
let previousResults = new Map()

export function initExhibit2() {
  conditionsGrid = document.getElementById('conditions-grid')

  // Load saved conditions or use defaults
  const saved = localStorage.getItem('demo-conditions')
  if (saved) {
    try {
      conditions = JSON.parse(saved)
    } catch {
      conditions = [...DEFAULT_CONDITIONS]
    }
  } else {
    conditions = [...DEFAULT_CONDITIONS]
  }

  // Set up modal
  setupModal()

  // Initial render
  renderConditions()

  // Subscribe to store changes
  store.subscribe(() => {
    updateConditions()
  })
}

function setupModal() {
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
  conditions.push({ name, condition })
  saveConditions()
  renderConditions()
}

function removeCondition(index) {
  conditions.splice(index, 1)
  saveConditions()
  renderConditions()
}

function saveConditions() {
  localStorage.setItem('demo-conditions', JSON.stringify(conditions))
}

function renderConditions() {
  conditionsGrid.innerHTML = conditions.map((c, i) => {
    const result = evaluateCondition(c.condition)
    previousResults.set(i, result)

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
    const condition = conditions[i]
    if (!condition) return

    const result = evaluateCondition(condition.condition)
    const prevResult = previousResults.get(i)

    // Update classes
    card.classList.toggle('passing', result)
    card.classList.toggle('failing', !result)

    // Animate if result changed
    if (prevResult !== undefined && prevResult !== result) {
      card.classList.add('animating')
      setTimeout(() => card.classList.remove('animating'), 400)
    }

    // Update result indicator
    const resultEl = card.querySelector('.condition-result')
    resultEl.textContent = result ? '✓' : '✗'
    resultEl.classList.toggle('pass', result)
    resultEl.classList.toggle('fail', !result)

    // Update expression blocks
    const expressionEl = card.querySelector('.condition-expression')
    expressionEl.innerHTML = renderConditionBlocks(condition.condition)

    previousResults.set(i, result)
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
  // Parse the condition into visual blocks
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
  // Simple tokenizer for visual display
  const tokens = condition.split(/\s+(AND|OR)\s+/i)

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].trim()
    if (!token) continue

    if (/^(AND|OR)$/i.test(token)) {
      parts.push({ type: 'operator', value: token.toUpperCase() })
    } else {
      // Handle NOT prefix
      let expr = token
      if (/^NOT\s+/i.test(expr)) {
        expr = expr.replace(/^NOT\s+/i, '!').trim()
      }
      // Handle parentheses groups
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
  // Extract the flag name and show current value
  const match = expression.match(/^!?([a-zA-Z_][a-zA-Z0-9_.]*)\s*([<>=!]+)?\s*(.+)?$/)
  if (!match) return null

  const [, flagName, operator, compareValue] = match
  const value = store.get(flagName)

  if (operator && compareValue !== undefined) {
    // Comparison expression - show actual values
    return `${value} ${operator} ${compareValue}`
  } else {
    // Simple flag check
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
