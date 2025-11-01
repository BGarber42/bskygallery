import state from '../state.js'
import { NSFW_MODES } from '../utils/filters.js'

export function createFilterBar() {
  const container = document.createElement('div')
  container.className = 'filter-bar'
  
  const nsfwButton = document.createElement('button')
  nsfwButton.className = 'filter-control nsfw-toggle'
  nsfwButton.textContent = `NSFW: ${state.filters.nsfwMode}`
  
  const searchInput = document.createElement('input')
  searchInput.type = 'text'
  searchInput.className = 'filter-control search-input'
  searchInput.placeholder = 'Search...'
  
  const layoutButton = document.createElement('button')
  layoutButton.className = 'filter-control layout-toggle'
  layoutButton.textContent = `Layout: ${state.layout}`
  
  const zenButton = document.createElement('button')
  zenButton.className = 'filter-control zen-toggle'
  zenButton.textContent = 'Zen Mode'
  
  const statsDisplay = document.createElement('div')
  statsDisplay.className = 'filter-control stats'
  
  let searchTimeout = null
  
  nsfwButton.addEventListener('click', () => {
    const currentIndex = NSFW_MODES.indexOf(state.filters.nsfwMode)
    const nextIndex = (currentIndex + 1) % NSFW_MODES.length
    const nextMode = NSFW_MODES[nextIndex]
    state.setNsfwMode(nextMode)
    nsfwButton.textContent = `NSFW: ${nextMode}`
  })
  
  searchInput.addEventListener('input', (e) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    searchTimeout = setTimeout(() => {
      state.setSearchText(e.target.value)
    }, 300)
  })
  
  layoutButton.addEventListener('click', () => {
    state.toggleLayout()
    layoutButton.textContent = `Layout: ${state.layout}`
  })
  
  zenButton.addEventListener('click', () => {
    state.toggleZenMode()
    if (state.zenMode) {
      zenButton.textContent = 'Exit Zen'
    } else {
      zenButton.textContent = 'Zen Mode'
    }
  })
  
  const unsubscribe = state.subscribe((appState) => {
    statsDisplay.textContent = `${appState.getFilteredImages().length} images | ${appState.connectionStatus}`
  })
  
  container.appendChild(nsfwButton)
  container.appendChild(searchInput)
  container.appendChild(layoutButton)
  container.appendChild(zenButton)
  container.appendChild(statsDisplay)
  
  return container
}

export default createFilterBar

