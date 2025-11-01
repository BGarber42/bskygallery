import state from '../state.js'
import { openModal } from './Modal.js'

export function createImageGrid() {
  const container = document.createElement('div')
  container.id = 'image-grid-container'
  container.className = `grid-layout ${state.layout}`
  
  let unsubscribe = null
  
  function render() {
    const filteredImages = state.getFilteredImages()
    
    container.innerHTML = ''
    
    filteredImages.forEach(image => {
      const imageElement = createImageElement(image)
      container.appendChild(imageElement)
    })
    
    updateLayout()
  }
  
  function createImageElement(image) {
    const wrapper = document.createElement('div')
    wrapper.className = 'image-item'
    wrapper.dataset.imageId = image.id
    
    const img = document.createElement('img')
    img.src = image.thumbUrl
    img.alt = image.alt
    img.loading = 'lazy'
    
    img.addEventListener('error', () => {
      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E'
    })
    
    const overlay = document.createElement('div')
    overlay.className = 'image-overlay'
    
    wrapper.appendChild(img)
    wrapper.appendChild(overlay)
    
    if (state.filters.nsfwMode === 'blurred' && image.isNsfw) {
      img.classList.add('blurred')
      wrapper.classList.add('nsfw-blurred')
      
      wrapper.addEventListener('click', (e) => {
        e.stopPropagation()
        const confirmed = confirm('This image is marked as NSFW. View anyway?')
        if (confirmed) {
          openModal(image)
        }
      })
    } else {
      wrapper.addEventListener('click', () => openModal(image))
    }
    
    wrapper.addEventListener('mouseenter', () => {
      overlay.style.opacity = '0.6'
    })
    
    wrapper.addEventListener('mouseleave', () => {
      overlay.style.opacity = '0'
    })
    
    return wrapper
  }
  
  function updateLayout() {
    if (state.layout === 'masonry') {
      container.classList.remove('grid')
      container.classList.add('masonry')
    } else {
      container.classList.remove('masonry')
      container.classList.add('grid')
    }
    
    const items = container.querySelectorAll('.image-item')
    items.forEach(item => {
      if (state.layout === 'grid') {
        const aspectRatio = item.dataset.aspectRatio ? 
          item.dataset.aspectRatio.split(':')[1] / item.dataset.aspectRatio.split(':')[0] : 
          1
        item.style.aspectRatio = aspectRatio.toString()
      } else {
        item.style.aspectRatio = ''
      }
    })
  }
  
  function handleStateChange(appState) {
    render()
    
    if (appState.zenMode) {
      document.body.classList.add('zen-mode')
    } else {
      document.body.classList.remove('zen-mode')
    }
  }
  
  unsubscribe = state.subscribe(handleStateChange)
  render()
  
  return container
}

export default createImageGrid

