import state from '../state.js'
import { openModal } from './Modal.js'

const NUM_COLUMNS = 6

export function createImageGrid() {
  const container = document.createElement('div')
  container.id = 'image-grid-container'
  container.className = 'grid-layout grid'
  
  let unsubscribe = null
  let previousImageIds = []
  
  function render() {
    const newImages = state.getFilteredImages().slice().reverse() // chronological
    const newImageIds = newImages.map(img => img.id)

    const newIdsSet = new Set(newImageIds);
    const oldIdsSet = new Set(previousImageIds);

    const addedIds = newImageIds.filter(id => !oldIdsSet.has(id));
    const removedIds = previousImageIds.filter(id => !newIdsSet.has(id));

    // This is a "fast path" if images were only added, OR if the number of images added 
    // is greater than the number of images removed (which is what happens when MAX_IMAGES is exceeded)
    if (addedIds.length > 0 && addedIds.length >= removedIds.length) {
      const imagesToAdd = newImages.filter(img => addedIds.includes(img.id));
      for (const image of imagesToAdd) {
        const imageElement = createImageElement(image);
        container.appendChild(imageElement);
      }

      // If we're over capacity, remove the oldest ones from the DOM
      if (removedIds.length > 0) {
        removedIds.forEach(id => {
          const elementToRemove = container.querySelector(`[data-image-id="${id}"]`);
          if (elementToRemove) {
            elementToRemove.remove();
          }
        });
      }
    } else {
      // Slow path: Full re-render for filtering/removals
      container.innerHTML = '';
      for (const image of newImages) {
        const imageElement = createImageElement(image);
        container.appendChild(imageElement);
      }
    }

    previousImageIds = newImageIds;
  }
  
  function createImageElement(post) {
    const wrapper = document.createElement('div')
    wrapper.className = 'image-item'
    wrapper.dataset.imageId = post.id
    
    // Handle multiple images
    if (post.images && Array.isArray(post.images)) {
      if (post.images.length === 1) {
        // Single image
        const img = createImg(post.images[0])
        wrapper.appendChild(img)
      } else if (post.images.length === 2) {
        // Two images side by side
        const gridWrapper = document.createElement('div')
        gridWrapper.className = 'multi-image-grid two-images'
        post.images.forEach(imgData => {
          const img = createImg(imgData)
          gridWrapper.appendChild(img)
        })
        wrapper.appendChild(gridWrapper)
      } else if (post.images.length === 3) {
        // Three images: one large on left, two stacked on right
        const gridWrapper = document.createElement('div')
        gridWrapper.className = 'multi-image-grid three-images'
        const leftWrapper = document.createElement('div')
        leftWrapper.className = 'image-left'
        leftWrapper.appendChild(createImg(post.images[0]))
        const rightWrapper = document.createElement('div')
        rightWrapper.className = 'image-right'
        post.images.slice(1, 3).forEach(imgData => {
          rightWrapper.appendChild(createImg(imgData))
        })
        gridWrapper.appendChild(leftWrapper)
        gridWrapper.appendChild(rightWrapper)
        wrapper.appendChild(gridWrapper)
      } else {
        // Four or more images: 2x2 grid with overlay
        const gridWrapper = document.createElement('div')
        gridWrapper.className = 'multi-image-grid four-plus-images'
        post.images.slice(0, 4).forEach(imgData => {
          const img = createImg(imgData)
          gridWrapper.appendChild(img)
        })
        
        // Add count badge if more than 4 images
        if (post.images.length > 4) {
          const countBadge = document.createElement('div')
          countBadge.className = 'image-count-badge'
          countBadge.textContent = `+${post.images.length - 4}`
          gridWrapper.appendChild(countBadge)
        }
        
        wrapper.appendChild(gridWrapper)
      }
    } else {
      // Legacy single image format
      const img = document.createElement('img')
      img.src = post.thumbUrl
      img.alt = post.alt || ''
      img.loading = 'lazy'
      wrapper.appendChild(img)
    }
    
    const overlay = document.createElement('div')
    overlay.className = 'image-overlay'
    wrapper.appendChild(overlay)
    
    wrapper.addEventListener('click', () => openModal(post))
    
    wrapper.addEventListener('mouseenter', () => {
      overlay.style.opacity = '0.6'
    })
    
    wrapper.addEventListener('mouseleave', () => {
      overlay.style.opacity = '0'
    })
    
    return wrapper
  }
  
  function createImg(imgData) {
    const img = document.createElement('img')
    img.src = imgData.thumbUrl
    img.alt = imgData.alt || ''
    img.loading = 'lazy'
    
    img.addEventListener('error', () => {
      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E'
    })
    
    // Store aspect ratio for later use
    if (imgData.aspectRatio && imgData.aspectRatio.width && imgData.aspectRatio.height) {
      img.dataset.aspectRatio = `${imgData.aspectRatio.width}/${imgData.aspectRatio.height}`
    }
    
    return img
  }
  
  function updateLayout() {
    // Apply aspect ratios for grid items
    const items = container.querySelectorAll('.image-item')
    items.forEach(item => {
      const img = item.querySelector('img')
      const aspectRatio = img?.dataset.aspectRatio
      if (aspectRatio) {
        const [width, height] = aspectRatio.split('/').map(Number)
        item.style.aspectRatio = (width / height).toString()
      } else {
        item.style.aspectRatio = ''
      }
    })
  }
  
  function handleStateChange(appState) {
    render()
    updateLayout()
    
    if (appState.zenMode) {
      document.body.classList.add('zen-mode')
    } else {
      document.body.classList.remove('zen-mode')
    }
  }
  
  unsubscribe = state.subscribe(handleStateChange)
  render()
  updateLayout()
  
  return container
}

export default createImageGrid

