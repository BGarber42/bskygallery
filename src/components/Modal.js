let currentModal = null
let currentImageIndex = -1
let filteredImages = []

export function openModal(image) {
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
  
  const img = document.createElement('img')
  img.src = image.fullsizeUrl
  img.alt = image.alt
  
  img.addEventListener('error', () => {
    img.src = image.thumbUrl
  })
  
  const infoPanel = document.createElement('div')
  infoPanel.className = 'modal-info'
  
  const text = document.createElement('p')
  text.className = 'modal-text'
  text.textContent = image.text || '(no text)'
  
  const author = document.createElement('div')
  author.className = 'modal-author'
  author.textContent = `@${image.authorHandle || image.authorDid}`
  
  const timestamp = document.createElement('div')
  timestamp.className = 'modal-timestamp'
  timestamp.textContent = formatTimestamp(image.timestamp)
  
  const link = document.createElement('a')
  link.href = image.postUrl
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.className = 'modal-link'
  link.textContent = 'View on Bluesky →'
  
  infoPanel.appendChild(text)
  infoPanel.appendChild(author)
  infoPanel.appendChild(timestamp)
  infoPanel.appendChild(link)
  
  imageWrapper.appendChild(img)
  
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

