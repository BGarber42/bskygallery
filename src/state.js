import { shouldShowImage } from './utils/filters.js'
import { GALLERY_COLUMN_COUNT } from './constants.js'

const MAX_IMAGES = 200

class AppState {
  constructor() {
    this.images = []
    this.filters = {
      searchText: '',
    }
    this.layoutMode = 'feed'
    this.connectionStatus = 'connecting'
    this.isPaused = false
    this.listeners = new Set()
    this.snapshotVersion = 0
  }

  subscribe(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  notify() {
    this.snapshotVersion += 1
    this.listeners.forEach((listener) => listener(this))
  }

  addImage(image) {
    if (this.isPaused) {
      return
    }

    this.images.unshift(image)

    if (this.images.length >= MAX_IMAGES + GALLERY_COLUMN_COUNT) {
      const numToRemove =
        Math.floor((this.images.length - MAX_IMAGES) / GALLERY_COLUMN_COUNT) *
        GALLERY_COLUMN_COUNT
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

  toggleLayoutMode() {
    this.layoutMode = this.layoutMode === 'feed' ? 'dense' : 'feed'
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
    return this.images.filter((image) => shouldShowImage(image, this.filters))
  }
}

export default new AppState()
