import state from '../state.js'

export function createFilterBar() {
  const container = document.createElement('div')
  container.className = 'filter-bar'
  
  const searchInput = document.createElement('input')
  searchInput.type = 'text'
  searchInput.className = 'filter-control search-input'
  searchInput.placeholder = 'Search...'
  
  const zenButton = document.createElement('button')
  zenButton.className = 'filter-control zen-toggle'
  zenButton.textContent = 'Zen Mode'
  
  const pauseButton = document.createElement('button')
  pauseButton.className = 'filter-control pause-toggle'
  pauseButton.textContent = 'Pause'
  
  const statsDisplay = document.createElement('div')
  statsDisplay.className = 'filter-control stats'
  
  let searchTimeout = null
  
  searchInput.addEventListener('input', (e) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    searchTimeout = setTimeout(() => {
      state.setSearchText(e.target.value)
    }, 300)
  })
  
  zenButton.addEventListener('click', () => {
    state.toggleZenMode()
  })
  
  pauseButton.addEventListener('click', () => {
    state.togglePaused()
    if (state.isPaused) {
      pauseButton.textContent = 'Resume'
    } else {
      pauseButton.textContent = 'Pause'
    }
  })
  
  const unsubscribe = state.subscribe((appState) => {
    statsDisplay.textContent = `${appState.getFilteredImages().length} images | ${appState.connectionStatus}`
    
    if (appState.zenMode) {
      zenButton.textContent = 'Exit Zen'
    } else {
      zenButton.textContent = 'Zen Mode'
    }
  })
  
  container.appendChild(searchInput)
  container.appendChild(zenButton)
  container.appendChild(pauseButton)
  container.appendChild(statsDisplay)
  
  return container
}

export default createFilterBar

