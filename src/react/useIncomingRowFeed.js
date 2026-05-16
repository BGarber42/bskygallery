import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FOLLOWING_REFOLLOW_THRESHOLD_PX,
  FOLLOWING_UNFOLLOW_THRESHOLD_PX,
  INCOMING_ROW_BATCH_MS,
  INCOMING_ROW_MAX_WAIT_MS,
  INCOMING_ROW_MERGE_DEBOUNCE_MS,
  INCOMING_ROW_MIN_DWELL_MS,
} from '../constants.js'
import { prependRow } from './galleryLayout.js'

function trimToItemIds(list, itemIds) {
  return list.filter((post) => itemIds.has(post.id))
}

function collectNewHeadPosts(items, allocatedIds) {
  const newPosts = []
  for (const item of items) {
    if (allocatedIds.has(item.id)) {
      break
    }
    newPosts.push(item)
  }
  return newPosts
}

function anchorScrollAfterGrowth(scrollEl, heightBefore) {
  if (!scrollEl) {
    return
  }
  if (scrollEl.scrollTop <= FOLLOWING_REFOLLOW_THRESHOLD_PX) {
    return
  }
  const heightAfter = scrollEl.scrollHeight
  const delta = heightAfter - heightBefore
  if (delta > 0) {
    scrollEl.scrollTop += delta
  }
}

export function useIncomingRowFeed(items, scrollRef, columnCount) {
  const [following, setFollowing] = useState(true)
  const [incomingRow, setIncomingRow] = useState([])
  const [mainItems, setMainItems] = useState(items)
  const [bufferCount, setBufferCount] = useState(0)

  const bufferRef = useRef([])
  const incomingRowRef = useRef([])
  const mainItemsRef = useRef(items)
  const followingRef = useRef(true)
  const itemsRef = useRef(items)
  const columnCountRef = useRef(columnCount)
  const mergeTimerRef = useRef(null)
  const dwellTimerRef = useRef(null)
  const maxWaitTimerRef = useRef(null)
  const batchTimerRef = useRef(null)
  const batchRef = useRef([])
  const pendingThumbLoadsRef = useRef(new Set())
  const stripFirstSeenRef = useRef(null)
  const prevColumnCountRef = useRef(columnCount)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    followingRef.current = following
  }, [following])

  useEffect(() => {
    incomingRowRef.current = incomingRow
  }, [incomingRow])

  useEffect(() => {
    mainItemsRef.current = mainItems
  }, [mainItems])

  useEffect(() => {
    columnCountRef.current = columnCount
  }, [columnCount])

  const clearMergeTimer = useCallback(() => {
    if (mergeTimerRef.current) {
      clearTimeout(mergeTimerRef.current)
      mergeTimerRef.current = null
    }
  }, [])

  const clearDwellTimer = useCallback(() => {
    if (dwellTimerRef.current) {
      clearTimeout(dwellTimerRef.current)
      dwellTimerRef.current = null
    }
  }, [])

  const clearMaxWaitTimer = useCallback(() => {
    if (maxWaitTimerRef.current) {
      clearTimeout(maxWaitTimerRef.current)
      maxWaitTimerRef.current = null
    }
  }, [])

  const clearBatchTimer = useCallback(() => {
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current)
      batchTimerRef.current = null
    }
  }, [])

  const markStripPostsPendingLoad = useCallback((posts) => {
    for (const post of posts) {
      pendingThumbLoadsRef.current.add(post.id)
    }
  }, [])

  const clearStripPendingLoads = useCallback(() => {
    for (const post of incomingRowRef.current) {
      pendingThumbLoadsRef.current.delete(post.id)
    }
  }, [])

  const stripDwellElapsed = useCallback(() => {
    if (stripFirstSeenRef.current == null) {
      return true
    }
    return Date.now() - stripFirstSeenRef.current >= INCOMING_ROW_MIN_DWELL_MS
  }, [])

  const stripMaxWaitElapsed = useCallback(() => {
    if (stripFirstSeenRef.current == null) {
      return false
    }
    return Date.now() - stripFirstSeenRef.current >= INCOMING_ROW_MAX_WAIT_MS
  }, [])

  const stripThumbsReady = useCallback(() => {
    const strip = incomingRowRef.current
    if (strip.length === 0) {
      return true
    }
    return strip.every((post) => !pendingThumbLoadsRef.current.has(post.id))
  }, [])

  const canMergeStrip = useCallback(() => {
    if (incomingRowRef.current.length === 0) {
      return false
    }
    const dwellOk = stripDwellElapsed()
    const thumbsOk = stripThumbsReady()
    const maxWaitOk = stripMaxWaitElapsed()
    return (dwellOk && thumbsOk) || maxWaitOk
  }, [stripDwellElapsed, stripThumbsReady, stripMaxWaitElapsed])

  const mergeIncomingIntoMain = useCallback(
    (force = false) => {
      const strip = incomingRowRef.current
      if (strip.length === 0) {
        return
      }
      if (!force && !canMergeStrip()) {
        return
      }

      clearMergeTimer()
      clearDwellTimer()
      clearMaxWaitTimer()

      const scrollEl = scrollRef.current
      const heightBefore = scrollEl?.scrollHeight ?? 0

      const merged = prependRow(mainItemsRef.current, strip)
      mainItemsRef.current = merged
      incomingRowRef.current = []
      stripFirstSeenRef.current = null
      clearStripPendingLoads()
      setMainItems(merged)
      setIncomingRow([])

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          anchorScrollAfterGrowth(scrollEl, heightBefore)
        })
      })
    },
    [
      canMergeStrip,
      clearMergeTimer,
      clearDwellTimer,
      clearMaxWaitTimer,
      clearStripPendingLoads,
      scrollRef,
    ]
  )

  const scheduleMaxWaitMerge = useCallback(() => {
    clearMaxWaitTimer()
    if (stripFirstSeenRef.current == null) {
      return
    }
    const waitMs =
      INCOMING_ROW_MAX_WAIT_MS -
      (Date.now() - stripFirstSeenRef.current)
    if (waitMs <= 0) {
      mergeIncomingIntoMain(true)
      return
    }
    maxWaitTimerRef.current = setTimeout(() => {
      maxWaitTimerRef.current = null
      mergeIncomingIntoMain(true)
    }, waitMs)
  }, [clearMaxWaitTimer, mergeIncomingIntoMain])

  const scheduleMergeAttempt = useCallback(() => {
    clearMergeTimer()
    clearDwellTimer()

    const strip = incomingRowRef.current
    if (strip.length === 0) {
      return
    }

    scheduleMaxWaitMerge()

    const tryMerge = () => {
      if (incomingRowRef.current.length === 0) {
        return
      }
      if (canMergeStrip()) {
        mergeIncomingIntoMain(true)
        return
      }
      if (!stripDwellElapsed()) {
        const waitMs =
          INCOMING_ROW_MIN_DWELL_MS -
          (Date.now() - (stripFirstSeenRef.current ?? Date.now()))
        dwellTimerRef.current = setTimeout(
          () => {
            dwellTimerRef.current = null
            tryMerge()
          },
          Math.max(0, waitMs)
        )
      }
    }

    if (strip.length >= columnCountRef.current) {
      tryMerge()
      return
    }

    mergeTimerRef.current = setTimeout(() => {
      mergeTimerRef.current = null
      tryMerge()
    }, INCOMING_ROW_MERGE_DEBOUNCE_MS)
  }, [
    clearMergeTimer,
    clearDwellTimer,
    canMergeStrip,
    mergeIncomingIntoMain,
    scheduleMaxWaitMerge,
    stripDwellElapsed,
  ])

  const onIncomingThumbLoad = useCallback(
    (postId) => {
      pendingThumbLoadsRef.current.delete(postId)
      if (incomingRowRef.current.some((post) => post.id === postId)) {
        scheduleMergeAttempt()
      }
    },
    [scheduleMergeAttempt]
  )

  const syncAtTop = useCallback(
    (latest) => {
      clearMergeTimer()
      clearDwellTimer()
      clearMaxWaitTimer()
      clearBatchTimer()
      bufferRef.current = []
      batchRef.current = []
      setBufferCount(0)
      incomingRowRef.current = []
      stripFirstSeenRef.current = null
      clearStripPendingLoads()
      mainItemsRef.current = latest
      setIncomingRow([])
      setMainItems(latest)
      scrollRef.current?.scrollTo({ top: 0 })
    },
    [
      clearMergeTimer,
      clearDwellTimer,
      clearMaxWaitTimer,
      clearBatchTimer,
      clearStripPendingLoads,
      scrollRef,
    ]
  )

  const addToIncomingRow = useCallback(
    (newPosts) => {
      if (newPosts.length === 0 || columnCountRef.current < 1) {
        return
      }

      const hadStrip = incomingRowRef.current.length > 0
      let strip = [...incomingRowRef.current]
      const addedToStrip = []

      const reversed = [...newPosts].reverse()
      for (let i = 0; i < reversed.length; i++) {
        const post = reversed[i]
        if (strip.length >= columnCountRef.current) {
          if (canMergeStrip()) {
            mainItemsRef.current = prependRow(mainItemsRef.current, strip)
            for (const merged of strip) {
              pendingThumbLoadsRef.current.delete(merged.id)
            }
            strip = []
            stripFirstSeenRef.current = null
          } else {
            const remainder = reversed.slice(i).reverse()
            batchRef.current.unshift(...remainder)
            scheduleMergeAttempt()
            break
          }
        }
        strip.push(post)
        addedToStrip.push(post)
      }

      if (addedToStrip.length > 0) {
        markStripPostsPendingLoad(addedToStrip)
      }

      if (strip.length > 0 && !hadStrip) {
        stripFirstSeenRef.current = Date.now()
      }

      incomingRowRef.current = strip
      setIncomingRow(strip)
      setMainItems(mainItemsRef.current)

      if (strip.length > 0) {
        scheduleMergeAttempt()
      }
    },
    [
      canMergeStrip,
      markStripPostsPendingLoad,
      scheduleMergeAttempt,
    ]
  )

  const flushIncomingBatch = useCallback(() => {
    batchTimerRef.current = null
    const batch = batchRef.current
    batchRef.current = []
    if (batch.length > 0) {
      addToIncomingRow(batch)
    }
  }, [addToIncomingRow])

  const queueIncomingBatch = useCallback(
    (newPosts) => {
      if (newPosts.length === 0) {
        return
      }
      batchRef.current.push(...newPosts)
      if (!batchTimerRef.current) {
        batchTimerRef.current = setTimeout(
          flushIncomingBatch,
          INCOMING_ROW_BATCH_MS
        )
      }
    },
    [flushIncomingBatch]
  )

  useEffect(() => {
    if (columnCount < 1) {
      return
    }
    if (prevColumnCountRef.current !== columnCount) {
      prevColumnCountRef.current = columnCount
      if (incomingRowRef.current.length > 0) {
        mergeIncomingIntoMain(true)
      }
    }
  }, [columnCount, mergeIncomingIntoMain])

  useEffect(() => {
    return () => {
      clearMergeTimer()
      clearDwellTimer()
      clearMaxWaitTimer()
      clearBatchTimer()
    }
  }, [
    clearMergeTimer,
    clearDwellTimer,
    clearMaxWaitTimer,
    clearBatchTimer,
  ])

  useEffect(() => {
    const itemIds = new Set(items.map((i) => i.id))

    const hasMainOverlap =
      mainItemsRef.current.length === 0 ||
      mainItemsRef.current.some((i) => itemIds.has(i.id))
    if (!hasMainOverlap) {
      syncAtTop(items)
      return
    }

    if (
      followingRef.current &&
      mainItemsRef.current.some((i) => !itemIds.has(i.id))
    ) {
      const trimmedMain = trimToItemIds(mainItemsRef.current, itemIds)
      mainItemsRef.current = trimmedMain
      setMainItems(trimmedMain)
    }

    if (incomingRowRef.current.some((i) => !itemIds.has(i.id))) {
      const trimmedIncoming = trimToItemIds(incomingRowRef.current, itemIds)
      incomingRowRef.current = trimmedIncoming
      setIncomingRow(trimmedIncoming)
      if (trimmedIncoming.length === 0) {
        stripFirstSeenRef.current = null
        clearStripPendingLoads()
      }
    }

    bufferRef.current = bufferRef.current.filter((i) => itemIds.has(i.id))
    setBufferCount(bufferRef.current.length)

    if (!followingRef.current) {
      const displayHeadId = mainItemsRef.current[0]?.id
      if (!displayHeadId) {
        return
      }
      const headIndex = items.findIndex((i) => i.id === displayHeadId)
      if (headIndex > 0) {
        const known = new Set([
          ...bufferRef.current.map((i) => i.id),
          ...incomingRowRef.current.map((i) => i.id),
          ...mainItemsRef.current.map((i) => i.id),
          ...batchRef.current.map((i) => i.id),
        ])
        const toAdd = items.slice(0, headIndex).filter((i) => !known.has(i.id))
        if (toAdd.length > 0) {
          bufferRef.current = [...toAdd, ...bufferRef.current]
          setBufferCount(bufferRef.current.length)
        }
      }
      return
    }

    const allocated = new Set([
      ...incomingRowRef.current.map((i) => i.id),
      ...mainItemsRef.current.map((i) => i.id),
      ...batchRef.current.map((i) => i.id),
    ])
    const newPosts = collectNewHeadPosts(items, allocated)
    if (newPosts.length > 0) {
      queueIncomingBatch(newPosts)
    }
  }, [items, queueIncomingBatch, syncAtTop, clearStripPendingLoads])

  const jumpToLatest = useCallback(() => {
    const el = scrollRef.current
    const latest = itemsRef.current
    clearBatchTimer()
    batchRef.current = []
    mergeIncomingIntoMain(true)
    bufferRef.current = []
    setBufferCount(0)
    followingRef.current = true
    setFollowing(true)
    incomingRowRef.current = []
    stripFirstSeenRef.current = null
    clearStripPendingLoads()
    mainItemsRef.current = latest
    setIncomingRow([])
    setMainItems(latest)
    el?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [
    scrollRef,
    mergeIncomingIntoMain,
    clearBatchTimer,
    clearStripPendingLoads,
  ])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) {
      return
    }

    const onScroll = () => {
      const top = el.scrollTop

      if (top <= FOLLOWING_REFOLLOW_THRESHOLD_PX) {
        if (!followingRef.current) {
          followingRef.current = true
          setFollowing(true)
          bufferRef.current = []
          setBufferCount(0)
          mergeIncomingIntoMain(true)
        }
        return
      }

      if (top > FOLLOWING_UNFOLLOW_THRESHOLD_PX && followingRef.current) {
        followingRef.current = false
        setFollowing(false)
        mergeIncomingIntoMain(true)
      }
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [mergeIncomingIntoMain])

  return {
    incomingRow,
    mainItems,
    bufferCount,
    following,
    jumpToLatest,
    mergeIncomingIntoMain,
    onIncomingThumbLoad,
  }
}
