// Main entry point for the demo
// Initializes all exhibits when DOM is ready

import { store, populateInitialHistory } from './store.js'
import { initExhibit1 } from './exhibit1.js'
import { initExhibit2 } from './exhibit2.js'
import { initExhibit3 } from './exhibit3.js'
import { initTests } from './tests.js'

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('@motioneffector/flags demo initializing...')

  try {
    // Initialize the shared store with pre-populated history
    populateInitialHistory()

    // Initialize each exhibit
    initExhibit1()
    initExhibit2()
    initExhibit3()

    // Initialize test runner
    initTests()

    console.log('Demo initialized successfully!')
  } catch (error) {
    console.error('Failed to initialize demo:', error)

    // Show error to user
    document.body.innerHTML = `
      <div style="padding: 40px; text-align: center; color: #f85149;">
        <h1>Demo Failed to Load</h1>
        <p>Error: ${error.message}</p>
        <p>Check the browser console for details.</p>
      </div>
    `
  }
})

// Export store for debugging in console
window.demoStore = store
