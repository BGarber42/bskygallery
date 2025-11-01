let currentModal = null
let currentImageIndex = -1
let filteredImages = []

export function openModal(post) {
  if (currentModal) {
    closeModal()
  }
  
  currentModal = document.createElement('div')
  currentModal.className = 'modal'
  currentModal.setAttribute('role', 'dialog')
  currentModal.setAttribute('aria-modal', 'true')
  
  const modalContent = document.createElement('div')
  modalContent.className = 'modal-content'
  
  const closeButton = document.createElement('button')
  closeButton.className = 'modal-close'
  closeButton.textContent = '×'
  closeButton.setAttribute('aria-label', 'Close modal')
  
  const imageWrapper = document.createElement('div')
  imageWrapper.className = 'modal-image-wrapper'
  
  // Handle multiple images vs single image
  if (post.images && Array.isArray(post.images)) {
    // Multi-image post
    post.images.forEach((imgData, index) => {
      const img = document.createElement('img')
      img.src = imgData.fullsizeUrl
      img.alt = imgData.alt || ''
      img.loading = 'lazy'
      
      img.addEventListener('error', () => {
        img.src = imgData.thumbUrl
      })
      
      imageWrapper.appendChild(img)
    })
  } else {
    // Legacy single image
    const img = document.createElement('img')
    img.src = post.fullsizeUrl || post.thumbUrl
    img.alt = post.alt || ''
    
    img.addEventListener('error', () => {
      img.src = post.thumbUrl
    })
    
    imageWrapper.appendChild(img)
  }
  
  const infoPanel = document.createElement('div')
  infoPanel.className = 'modal-info'
  
  const text = document.createElement('p')
  text.className = 'modal-text'
  text.textContent = post.text || '(no text)'
  
  const author = document.createElement('div')
  author.className = 'modal-author'
  author.textContent = `@${post.authorHandle || post.authorDid}`
  
  const timestamp = document.createElement('div')
  timestamp.className = 'modal-timestamp'
  timestamp.textContent = formatTimestamp(post.timestamp)
  
  const link = document.createElement('a')
  link.href = post.postUrl
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.className = 'modal-link'
  link.textContent = 'View on Bluesky →'
  
  infoPanel.appendChild(text)
  infoPanel.appendChild(author)
  infoPanel.appendChild(timestamp)
  infoPanel.appendChild(link)
  
  modalContent.appendChild(closeButton)
  modalContent.appendChild(imageWrapper)
  modalContent.appendChild(infoPanel)
  
  currentModal.appendChild(modalContent)
  
  document.body.appendChild(currentModal)
  document.body.style.overflow = 'hidden'
  
  currentModal.addEventListener('click', (e) => {
    if (e.target === currentModal) {
      closeModal()
    }
  })
  
  closeButton.addEventListener('click', closeModal)
  
  document.addEventListener('keydown', handleKeyDown)
  
  requestAnimationFrame(() => {
    currentModal.classList.add('visible')
  })
}

function closeModal() {
  if (!currentModal) return
  
  document.removeEventListener('keydown', handleKeyDown)
  document.body.style.overflow = ''
  
  currentModal.classList.remove('visible')
  
  setTimeout(() => {
    if (currentModal) {
      currentModal.remove()
      currentModal = null
    }
  }, 300)
}

function handleKeyDown(e) {
  if (e.key === 'Escape') {
    closeModal()
  } else if (e.key === 'ArrowLeft') {
    navigateModal(-1)
  } else if (e.key === 'ArrowRight') {
    navigateModal(1)
  }
}

function navigateModal(direction) {
  if (filteredImages.length === 0) return
  
  currentImageIndex = (currentImageIndex + direction + filteredImages.length) % filteredImages.length
  openModal(filteredImages[currentImageIndex])
}

function formatTimestamp(isoString) {
  try {
    const date = new Date(isoString)
    return date.toLocaleString()
  } catch {
    return isoString
  }
}

export function setFilteredImagesForModal(images) {
  filteredImages = images
}

export default openModal

