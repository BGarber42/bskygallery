import state from './state.js'
import { constructThumbnailUrl, constructFullsizeUrl, getImageFormat } from './utils/imageUrl.js'

let ws = null
let reconnectTimeout = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 10
const RECONNECT_DELAY = 3000

export async function connectFirehose() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    return
  }
  
  try {
    state.setConnectionStatus('connecting')
    
    // Connect to public Jetstream instance with filter for posts with images
    const params = new URLSearchParams({
      wantedCollections: 'app.bsky.feed.post'
    })
    const serviceUri = `wss://jetstream2.us-east.bsky.network/subscribe?${params.toString()}`
    
    ws = new WebSocket(serviceUri)
    
    ws.onopen = () => {
      state.setConnectionStatus('connected')
      reconnectAttempts = 0
    }
    
    ws.onmessage = async (event) => {
      try {
        await handleJetstreamMessage(event)
      } catch (error) {
        console.error('Error handling jetstream message:', error)
      }
    }
    
    ws.onerror = (error) => {
      console.error('Jetstream WebSocket error:', error)
      state.setConnectionStatus('error')
    }
    
    ws.onclose = () => {
      state.setConnectionStatus('disconnected')
      
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++
        console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`)
        reconnectTimeout = setTimeout(connectFirehose, RECONNECT_DELAY)
      } else {
        console.error('Max reconnection attempts reached')
      }
    }
    
  } catch (error) {
    console.error('Error connecting to jetstream:', error)
    state.setConnectionStatus('error')
  }
}

async function handleJetstreamMessage(event) {
  try {
    const message = JSON.parse(event.data)
    
    // Only process commit events
    if (message.kind !== 'commit' || !message.commit) {
      return
    }
    
    const commit = message.commit
    
    // Only process create operations for posts
    if (commit.operation !== 'create' || commit.collection !== 'app.bsky.feed.post') {
      return
    }
    
    const post = commit.record
    
    if (!post || post.$type !== 'app.bsky.feed.post') {
      return
    }
    
    if (!post.embed || post.embed.$type !== 'app.bsky.embed.images') {
      return
    }
    
    const embed = post.embed
    
    if (!embed.images || !Array.isArray(embed.images) || embed.images.length === 0) {
      return
    }
    
    const did = message.did
    const rkey = commit.rkey
    const postUrl = constructPostUrl(did, rkey)
    const timestamp = post.createdAt || new Date().toISOString()
    
    // Collect all images from the post
    const images = []
    for (const imageData of embed.images) {
      if (!imageData.image || !imageData.image.ref || !imageData.image.ref.$link) {
        continue
      }
      
      const cid = imageData.image.ref.$link
      const mimeType = imageData.image.mimeType
      const format = getImageFormat(mimeType)
      
      const thumbUrl = constructThumbnailUrl(did, cid, format)
      const fullsizeUrl = constructFullsizeUrl(did, cid, format)
      
      images.push({
        thumbUrl,
        fullsizeUrl,
        alt: imageData.alt || '',
        aspectRatio: imageData.aspectRatio || { width: 1, height: 1 }
      })
    }
    
    if (images.length > 0) {
      // Create a single post object with all images
      const postData = {
        id: `${did}-${rkey}-${Date.now()}`,
        images,
        authorDid: did,
        authorHandle: extractHandle(did),
        text: post.text || '',
        timestamp,
        postUrl
      }
      
      state.addImage(postData)
    }
    
  } catch (error) {
    console.error('Error parsing jetstream message:', error)
  }
}

function constructPostUrl(did, rkey) {
  if (rkey) {
    return `https://bsky.app/profile/${did}/post/${rkey}`
  }
  return `https://bsky.app/profile/${did}`
}

function extractHandle(did) {
  return did
}

export function disconnectFirehose() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }
  
  if (ws) {
    ws.close()
    ws = null
  }
  
  state.setConnectionStatus('disconnected')
}
