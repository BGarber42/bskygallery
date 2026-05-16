import state from '../state.js'
import { openModal } from './Modal.js'

let layoutFrame = null

export function createImageGrid() {
  const container = document.createElement('div')
  container.id = 'image-grid-container'
  container.className = 'grid-layout grid'

  let unsubscribe = null
  let previousImageIds = []

  function scheduleLayout(elements) {
    if (layoutFrame !== null) {
      cancelAnimationFrame(layoutFrame)
    }
    layoutFrame = requestAnimationFrame(() => {
      layoutFrame = null
      updateLayoutForElements(elements)
    })
  }

  function render() {
    const newImages = state.getFilteredImages().slice().reverse()
    const newImageIds = newImages.map((img) => img.id)

    const newIdsSet = new Set(newImageIds)
    const oldIdsSet = new Set(previousImageIds)

    const addedIds = newImageIds.filter((id) => !oldIdsSet.has(id))
    const removedIds = previousImageIds.filter((id) => !newIdsSet.has(id))

    const elementsToLayout = []

    if (addedIds.length > 0 && addedIds.length >= removedIds.length) {
      const imagesToAdd = newImages.filter((img) => addedIds.includes(img.id))
      for (const image of imagesToAdd) {
        const imageElement = createImageElement(image)
        container.appendChild(imageElement)
        elementsToLayout.push(imageElement)
      }

      if (removedIds.length > 0) {
        removedIds.forEach((id) => {
          const elementToRemove = container.querySelector(
            `[data-image-id="${id}"]`
          )
          if (elementToRemove) {
            elementToRemove.remove()
          }
        })
      }
    } else {
      container.innerHTML = ''
      for (const image of newImages) {
        const imageElement = createImageElement(image)
        container.appendChild(imageElement)
        elementsToLayout.push(imageElement)
      }
    }

    previousImageIds = newImageIds
    scheduleLayout(elementsToLayout)
  }

  function createImageElement(post) {
    const wrapper = document.createElement('div')
    wrapper.className = 'image-item'
    wrapper.dataset.imageId = post.id

    if (post.images && Array.isArray(post.images)) {
      if (post.images.length === 1) {
        const img = createImg(post.images[0])
        wrapper.appendChild(img)
      } else if (post.images.length === 2) {
        const gridWrapper = document.createElement('div')
        gridWrapper.className = 'multi-image-grid two-images'
        post.images.forEach((imgData) => {
          gridWrapper.appendChild(createImg(imgData))
        })
        wrapper.appendChild(gridWrapper)
      } else if (post.images.length === 3) {
        const gridWrapper = document.createElement('div')
        gridWrapper.className = 'multi-image-grid three-images'
        const leftWrapper = document.createElement('div')
        leftWrapper.className = 'image-left'
        leftWrapper.appendChild(createImg(post.images[0]))
        const rightWrapper = document.createElement('div')
        rightWrapper.className = 'image-right'
        post.images.slice(1, 3).forEach((imgData) => {
          rightWrapper.appendChild(createImg(imgData))
        })
        gridWrapper.appendChild(leftWrapper)
        gridWrapper.appendChild(rightWrapper)
        wrapper.appendChild(gridWrapper)
      } else {
        const gridWrapper = document.createElement('div')
        gridWrapper.className = 'multi-image-grid four-plus-images'
        post.images.slice(0, 4).forEach((imgData) => {
          gridWrapper.appendChild(createImg(imgData))
        })

        if (post.images.length > 4) {
          const countBadge = document.createElement('div')
          countBadge.className = 'image-count-badge'
          countBadge.textContent = `+${post.images.length - 4}`
          gridWrapper.appendChild(countBadge)
        }

        wrapper.appendChild(gridWrapper)
      }
    } else {
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
      img.src =
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E'
    })

    if (
      imgData.aspectRatio &&
      imgData.aspectRatio.width &&
      imgData.aspectRatio.height
    ) {
      img.dataset.aspectRatio = `${imgData.aspectRatio.width}/${imgData.aspectRatio.height}`
    }

    return img
  }

  function updateLayoutForElements(items) {
    const list = items.length > 0 ? items : container.querySelectorAll('.image-item')
    list.forEach((item) => {
      const img = item.querySelector('img')
      const aspectRatio = img?.dataset.aspectRatio
      if (aspectRatio) {
        const [w, h] = aspectRatio.split('/').map(Number)
        item.style.aspectRatio = (w / h).toString()
      } else {
        item.style.aspectRatio = ''
      }
    })
  }

  function handleStateChange() {
    render()
  }

  unsubscribe = state.subscribe(handleStateChange)
  render()

  return container
}

export default createImageGrid
