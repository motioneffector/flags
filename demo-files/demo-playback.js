// Demo Playback System
// Automatically operates all exhibits in a human-perceptible way

import { store, loadScenario } from './store.js'

// Timing constants (milliseconds)
const STEP_DELAY = 400       // Delay between steps
const ACTION_DELAY = 200     // Delay for quick actions
const SCROLL_OFFSET = 100    // Pixels above element when scrolling

// Playback state
let isPlaying = false
let shouldStop = false

// ============================================
// UTILITY FUNCTIONS
// ============================================

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function scrollToElement(element) {
  if (!element) return
  const rect = element.getBoundingClientRect()
  const targetY = window.scrollY + rect.top - SCROLL_OFFSET
  window.scrollTo({ top: targetY, behavior: 'smooth' })
}

function highlightElement(element, duration = 300) {
  if (!element) return
  element.style.transition = 'box-shadow 0.2s ease'
  element.style.boxShadow = '0 0 20px 5px rgba(88, 166, 255, 0.6)'
  setTimeout(() => {
    element.style.boxShadow = ''
  }, duration)
}

function simulateClick(element) {
  if (!element) return
  highlightElement(element)
  element.click()
}

function simulateBarClick(barContainer, percent) {
  if (!barContainer) return
  const rect = barContainer.getBoundingClientRect()
  const x = rect.left + (rect.width * percent)
  const y = rect.top + (rect.height / 2)

  highlightElement(barContainer)

  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y
  })
  barContainer.dispatchEvent(clickEvent)
}

function updateProgressText(text) {
  const progressText = document.getElementById('progress-text')
  if (progressText) {
    progressText.textContent = text
  }
}

// ============================================
// DEMO PLAYBACK SEQUENCES
// ============================================

async function playExhibit1Demo() {
  const exhibit = document.getElementById('exhibit-1')
  scrollToElement(exhibit)
  await delay(STEP_DELAY)

  // 1. Load "Near Death" scenario
  updateProgressText('Demo: Loading "Near Death" scenario...')
  const dangerBtn = document.querySelector('[data-scenario="danger"]')
  simulateClick(dangerBtn)
  await delay(STEP_DELAY * 2)

  // 2. Heal up by clicking health bar
  updateProgressText('Demo: Healing character...')
  const healthBar = document.getElementById('health-bar-container')
  simulateBarClick(healthBar, 0.8)
  await delay(STEP_DELAY)

  // 3. Add gold by clicking gold bar
  updateProgressText('Demo: Adding gold...')
  const goldBar = document.getElementById('gold-bar-container')
  simulateBarClick(goldBar, 0.5)
  await delay(STEP_DELAY)

  // 4. Level up twice
  updateProgressText('Demo: Leveling up...')
  const levelUpBtn = document.getElementById('level-up-btn')
  simulateClick(levelUpBtn)
  await delay(ACTION_DELAY)
  simulateClick(levelUpBtn)
  await delay(STEP_DELAY)

  // 5. Equip shield
  updateProgressText('Demo: Equipping shield...')
  const shieldCard = document.querySelector('[data-item="shield"]')
  simulateClick(shieldCard)
  await delay(STEP_DELAY)

  // 6. Equip potion
  updateProgressText('Demo: Equipping potion...')
  const potionCard = document.querySelector('[data-item="potion"]')
  simulateClick(potionCard)
  await delay(STEP_DELAY)

  // 7. Toggle status effect
  updateProgressText('Demo: Changing status effect...')
  const blessedStatus = document.querySelector('[data-status="blessed"]')
  simulateClick(blessedStatus)
  await delay(STEP_DELAY)

  // 8. Load "Battle Ready" scenario
  updateProgressText('Demo: Loading "Battle Ready" scenario...')
  const battleBtn = document.querySelector('[data-scenario="battle"]')
  simulateClick(battleBtn)
  await delay(STEP_DELAY * 2)
}

async function playExhibit2Demo() {
  const exhibit = document.getElementById('exhibit-2')
  scrollToElement(exhibit)
  await delay(STEP_DELAY)

  updateProgressText('Demo: Watching conditions update...')

  // The conditions automatically update from Exhibit 1 changes
  // Let's make some changes to show the conditions react

  // Reduce gold to make "Can Afford" fail
  updateProgressText('Demo: Reducing gold - watch conditions change...')
  store.set('player.gold', 50)
  await delay(STEP_DELAY)

  // Unequip sword to make "Ready for Battle" fail
  updateProgressText('Demo: Unequipping sword - conditions react...')
  store.set('inventory.has_sword', false)
  await delay(STEP_DELAY)

  // Re-equip sword and increase gold
  updateProgressText('Demo: Re-equipping and adding gold...')
  store.set('inventory.has_sword', true)
  store.set('player.gold', 300)
  await delay(STEP_DELAY)

  // Set level high to pass "Elite Status"
  updateProgressText('Demo: Leveling up for Elite Status...')
  store.set('player.level', 12)
  await delay(STEP_DELAY * 2)
}

async function playExhibit3Demo() {
  const exhibit = document.getElementById('exhibit-3')
  scrollToElement(exhibit)
  await delay(STEP_DELAY)

  // 1. Demonstrate undo
  updateProgressText('Demo: Using Undo...')
  const undoBtn = document.getElementById('undo-btn')
  if (!undoBtn.disabled) {
    simulateClick(undoBtn)
    await delay(STEP_DELAY)
    simulateClick(undoBtn)
    await delay(STEP_DELAY)
  }

  // 2. Demonstrate redo
  updateProgressText('Demo: Using Redo...')
  const redoBtn = document.getElementById('redo-btn')
  if (!redoBtn.disabled) {
    simulateClick(redoBtn)
    await delay(STEP_DELAY)
  }

  // 3. Demonstrate batch - 3 separate changes
  updateProgressText('Demo: Making 3 separate changes...')
  const make3Btn = document.getElementById('make-3-changes')
  simulateClick(make3Btn)
  await delay(STEP_DELAY * 2)

  // 4. Undo to show 3 separate undos needed
  updateProgressText('Demo: Undoing separate changes (3 undos)...')
  for (let i = 0; i < 3; i++) {
    if (!undoBtn.disabled) {
      simulateClick(undoBtn)
      await delay(ACTION_DELAY)
    }
  }
  await delay(STEP_DELAY)

  // 5. Demonstrate batch - single batch of 3
  updateProgressText('Demo: Making batch of 3 changes...')
  const batchBtn = document.getElementById('make-batch-3')
  simulateClick(batchBtn)
  await delay(STEP_DELAY * 2)

  // 6. Single undo reverts all
  updateProgressText('Demo: Single undo reverts batch...')
  if (!undoBtn.disabled) {
    simulateClick(undoBtn)
    await delay(STEP_DELAY)
  }

  // 7. Demonstrate save
  updateProgressText('Demo: Saving to localStorage...')
  const saveBtn = document.getElementById('save-btn')
  simulateClick(saveBtn)
  await delay(STEP_DELAY)

  // 8. Make some changes
  updateProgressText('Demo: Making changes after save...')
  store.set('player.gold', 999)
  store.set('player.level', 20)
  await delay(STEP_DELAY)

  // 9. Load to restore
  updateProgressText('Demo: Loading saved state...')
  const loadBtn = document.getElementById('load-btn')
  simulateClick(loadBtn)
  await delay(STEP_DELAY * 2)
}

// ============================================
// MAIN PLAYBACK FUNCTION
// ============================================

export async function runDemoPlayback() {
  if (isPlaying) return
  isPlaying = true
  shouldStop = false

  try {
    updateProgressText('Demo: Starting interactive demo playback...')
    await delay(STEP_DELAY)

    // Play through each exhibit
    if (!shouldStop) {
      await playExhibit1Demo()
    }

    if (!shouldStop) {
      await playExhibit2Demo()
    }

    if (!shouldStop) {
      await playExhibit3Demo()
    }

    // Final state - load fresh start
    updateProgressText('Demo: Resetting to fresh start...')
    loadScenario('fresh')
    await delay(STEP_DELAY)

    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' })

    updateProgressText('Demo playback complete! Try the exhibits yourself.')
  } catch (error) {
    console.error('Demo playback error:', error)
    updateProgressText('Demo playback encountered an error')
  } finally {
    isPlaying = false
  }
}

export function stopDemoPlayback() {
  shouldStop = true
}

export function isDemoPlaying() {
  return isPlaying
}
