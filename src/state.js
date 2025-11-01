import { shouldShowImage } from './utils/filters.js'

const MAX_IMAGES = 200

class AppState {
  constructor() {
    this.images = []
    this.filters = {
      searchText: ''
    }
    this.layout = 'masonry'
    this.zenMode = false
    this.connectionStatus = 'connecting'
    this.isPaused = false
    this.listeners = new Set()
  }
  
  subscribe(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }
  
  notify() {
    this.listeners.forEach(listener => listener(this))
  }
  
  addImage(image) {
    // Only add images if not paused
    if (this.isPaused) {
      return
    }
    
    this.images.unshift(image)
    
    if (this.images.length > MAX_IMAGES) {
      this.images = this.images.slice(0, MAX_IMAGES)
    }
    
    this.notify()
  }
  
  setSearchText(text) {
    this.filters.searchText = text
    this.notify()
  }
  
  toggleLayout() {
    this.layout = this.layout === 'masonry' ? 'grid' : 'masonry'
    this.notify()
  }
  
  toggleZenMode() {
    this.zenMode = !this.zenMode
    this.notify()
  }
  
  togglePaused() {
    this.isPaused = !this.isPaused
    this.notify()
  }
  
  setConnectionStatus(status) {
    this.connectionStatus = status
    this.notify()
  }
  
  getFilteredImages() {
    return this.images.filter(image => shouldShowImage(image, this.filters))
  }
}

export default new AppState()

