import { shouldShowImage } from './utils/filters.js'

const MAX_IMAGES = 200

class AppState {
  constructor() {
    this.images = []
    this.filters = {
      nsfwMode: 'blurred',
      searchText: ''
    }
    this.layout = 'masonry'
    this.zenMode = false
    this.connectionStatus = 'connecting'
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
    this.images.unshift(image)
    
    if (this.images.length > MAX_IMAGES) {
      this.images = this.images.slice(0, MAX_IMAGES)
    }
    
    this.notify()
  }
  
  setNsfwMode(mode) {
    this.filters.nsfwMode = mode
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
  
  setConnectionStatus(status) {
    this.connectionStatus = status
    this.notify()
  }
  
  getFilteredImages() {
    return this.images.filter(image => shouldShowImage(image, this.filters))
  }
}

export default new AppState()

