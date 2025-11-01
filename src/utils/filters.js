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
  const { searchText } = filters
  
  return matchesTextSearch(image, searchText)
}

