import { CarReader } from '@ipld/car'
import { decode } from 'cborg'
import state from './state.js'
import { constructThumbnailUrl, constructFullsizeUrl, getImageFormat } from './utils/imageUrl.js'
import { isNsfw } from './utils/filters.js'

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
    
    const serviceUri = 'wss://bsky.network/xrpc/com.atproto.sync.subscribeRepos'
    
    ws = new WebSocket(serviceUri)
    
    ws.onopen = () => {
      state.setConnectionStatus('connected')
      reconnectAttempts = 0
    }
    
    ws.onmessage = async (event) => {
      try {
        await handleFirehoseMessage(event)
      } catch (error) {
        console.error('Error handling firehose message:', error)
      }
    }
    
    ws.onerror = (error) => {
      console.error('Firehose WebSocket error:', error)
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
    console.error('Error connecting to firehose:', error)
    state.setConnectionStatus('error')
  }
}

async function handleFirehoseMessage(event) {
  try {
    const arrayBuffer = await event.data.arrayBuffer()
    const carBytes = new Uint8Array(arrayBuffer)
    
    const car = await CarReader.fromBytes(carBytes)
    
    const roots = await car.getRoots()
    
    for await (const block of car.blocks()) {
      try {
        const record = decode(block.bytes)
        await processRecord(record)
      } catch (err) {
        console.log('Error decoding block:', err)
      }
    }
  } catch (error) {
    console.error('Error parsing CAR:', error)
  }
}

async function processRecord(record) {
  if (record?.collection !== 'app.bsky.feed.post') {
    return
  }
  
  const post = record.record
  
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
  
  const did = record.did
  
  for (const imageData of embed.images) {
    if (!imageData.image || !imageData.image.ref || !imageData.image.ref.$link) {
      continue
    }
    
    const cid = imageData.image.ref.$link
    const mimeType = imageData.image.mimeType
    const format = getImageFormat(mimeType)
    
    const thumbUrl = constructThumbnailUrl(did, cid, format)
    const fullsizeUrl = constructFullsizeUrl(did, cid, format)
    
    const postUrl = constructPostUrl(did, record)
    const timestamp = post.createdAt || new Date().toISOString()
    
    const image = {
      id: `${did}-${cid}-${Date.now()}`,
      thumbUrl,
      fullsizeUrl,
      alt: imageData.alt || '',
      aspectRatio: imageData.aspectRatio || { width: 1, height: 1 },
      authorDid: did,
      authorHandle: extractHandle(did),
      text: post.text || '',
      timestamp,
      postUrl,
      labels: post.labels || {},
      isNsfw: isNsfw(post.labels || {})
    }
    
    state.addImage(image)
  }
}

function constructPostUrl(did, record) {
  if (record.uri) {
    const match = record.uri.match(/app\.bsky\.feed\.post\/([^/]+)$/)
    if (match) {
      return `https://bsky.app/profile/${did}/post/${match[1]}`
    }
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
