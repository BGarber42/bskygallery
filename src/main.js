import state from './state.js'
import { connectFirehose, disconnectFirehose } from './firehose.js'
import createFilterBar from './components/FilterBar.js'
import createImageGrid from './components/ImageGrid.js'
import { setFilteredImagesForModal } from './components/Modal.js'

function init() {
  const app = document.getElementById('app')
  
  if (!app) {
    console.error('App container not found')
    return
  }
  
  const filterBarContainer = document.getElementById('filter-bar')
  const imageGridContainer = document.getElementById('image-grid')
  
  if (!filterBarContainer || !imageGridContainer) {
    console.error('Required DOM elements not found')
    return
  }
  
  const filterBar = createFilterBar()
  const imageGrid = createImageGrid()
  
  filterBarContainer.appendChild(filterBar)
  imageGridContainer.appendChild(imageGrid)
  
  const connectionStatusEl = document.getElementById('connection-status')
  
  state.subscribe((appState) => {
    if (connectionStatusEl) {
      const status = appState.connectionStatus
      connectionStatusEl.textContent = `Status: ${status}`
      
      const statusColors = {
        connecting: 'yellow',
        connected: 'green',
        disconnected: 'orange',
        error: 'red'
      }
      
      connectionStatusEl.style.color = statusColors[status] || 'white'
    }
    
    document.body.classList.toggle('zen-mode', appState.zenMode)
    
    setFilteredImagesForModal(appState.getFilteredImages())
  })
  
  connectFirehose()
  
  window.addEventListener('keydown', (e) => {
    if (e.key === 'z') {
      state.toggleZenMode()
    }
  })
  
  window.addEventListener('beforeunload', () => {
    disconnectFirehose()
  })
  
  console.log('Bluesky Firehose Gallery initialized')
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

