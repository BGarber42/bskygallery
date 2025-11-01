export function constructImageUrl(did, cid, format = 'jpeg', size = 'fullsize') {
  return `https://cdn.bsky.app/img/feed_${size}/plain/${did}/${cid}@${format}`
}

export function constructThumbnailUrl(did, cid, format = 'jpeg') {
  return constructImageUrl(did, cid, format, 'thumbnail')
}

export function constructFullsizeUrl(did, cid, format = 'jpeg') {
  return constructImageUrl(did, cid, format, 'fullsize')
}

export function getImageFormat(mimeType) {
  if (mimeType?.includes('webp')) return 'webp'
  if (mimeType?.includes('png')) return 'png'
  return 'jpeg'
}

