import { shouldShowImage } from './utils/filters.js'

const MAX_IMAGES = 200
const NUM_COLUMNS = 8

class AppState {
  constructor() {
    this.images = []
    this.filters = {
      searchText: ''
    }
    this.layout = 'grid'
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
    
    if (this.images.length >= MAX_IMAGES + NUM_COLUMNS) {
      const numToRemove = Math.floor((this.images.length - MAX_IMAGES) / NUM_COLUMNS) * NUM_COLUMNS
      if (numToRemove > 0) {
        this.images = this.images.slice(0, this.images.length - numToRemove)
      }
    }
    
    this.notify()
  }
  
  setSearchText(text) {
    this.filters.searchText = text
    this.notify()
  }
  
  toggleLayout() {
    // Single fixed grid layout, no toggle needed
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

