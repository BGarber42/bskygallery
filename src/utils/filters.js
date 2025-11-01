const NSFW_LABELS = ['sexual', 'porn', 'nudity', 'graphic-media', 'nsfl']

export function isNsfw(labels) {
  if (!labels || typeof labels !== 'object') return false
  
  return NSFW_LABELS.some(label => 
    labels[label] === true || 
    (Array.isArray(labels[label]) && labels[label].length > 0)
  )
}

export function matchesTextSearch(image, searchText) {
  if (!searchText || searchText.trim() === '') return true
  
  const query = searchText.toLowerCase()
  const searchable = [
    image.text || '',
    image.alt || '',
    image.authorHandle || ''
  ].join(' ').toLowerCase()
  
  return searchable.includes(query)
}

export function shouldShowImage(image, filters) {
  const { nsfwMode, searchText } = filters
  const isNsfwContent = isNsfw(image.labels)
  
  const matchesSearch = matchesTextSearch(image, searchText)
  
  let passesNsfwFilter = true
  if (isNsfwContent) {
    if (nsfwMode === 'hidden') {
      passesNsfwFilter = false
    }
  }
  
  return matchesSearch && passesNsfwFilter
}

export const NSFW_MODES = ['hidden', 'blurred', 'shown']

