import { useCallback, useEffect, useRef, useState } from 'react'

export const FOLLOWING_THRESHOLD_PX = 48

export function useFeedFollowing(items, scrollRef) {
  const [following, setFollowing] = useState(true)
  const [displayItems, setDisplayItems] = useState(items)
  const [bufferCount, setBufferCount] = useState(0)
  const bufferRef = useRef([])
  const displayItemsRef = useRef(items)
  const followingRef = useRef(true)
  const itemsRef = useRef(items)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    followingRef.current = following
  }, [following])

  useEffect(() => {
    displayItemsRef.current = displayItems
  }, [displayItems])

  useEffect(() => {
    if (following) {
      displayItemsRef.current = items
      setDisplayItems(items)
      bufferRef.current = []
      setBufferCount(0)
    }
  }, [items, following])

  useEffect(() => {
    if (following) {
      return
    }

    const display = displayItemsRef.current
    const itemIds = new Set(items.map((i) => i.id))

    bufferRef.current = bufferRef.current.filter((i) => itemIds.has(i.id))
    setBufferCount(bufferRef.current.length)

    const displayHeadId = display[0]?.id
    if (!displayHeadId) {
      displayItemsRef.current = items
      setDisplayItems(items)
      return
    }

    const headIndex = items.findIndex((i) => i.id === displayHeadId)
    if (headIndex === -1) {
      const filtered = display.filter((i) => itemIds.has(i.id))
      displayItemsRef.current = filtered
      setDisplayItems(filtered)
      return
    }

    if (headIndex > 0) {
      const newPosts = items.slice(0, headIndex)
      const known = new Set([
        ...bufferRef.current.map((i) => i.id),
        ...display.map((i) => i.id),
      ])
      const toAdd = newPosts.filter((i) => !known.has(i.id))
      if (toAdd.length > 0) {
        bufferRef.current = [...toAdd, ...bufferRef.current]
        setBufferCount(bufferRef.current.length)
      }
    }

    if (following && display.some((i) => !itemIds.has(i.id))) {
      const filtered = display.filter((i) => itemIds.has(i.id))
      displayItemsRef.current = filtered
      setDisplayItems(filtered)
    }
  }, [items, following])

  const jumpToLatest = useCallback(() => {
    const el = scrollRef.current
    const latest = itemsRef.current
    bufferRef.current = []
    setBufferCount(0)
    followingRef.current = true
    setFollowing(true)
    displayItemsRef.current = latest
    setDisplayItems(latest)
    el?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [scrollRef])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) {
      return
    }

    const onScroll = () => {
      const top = el.scrollTop
      const latest = itemsRef.current

      if (top <= FOLLOWING_THRESHOLD_PX) {
        if (!followingRef.current) {
          followingRef.current = true
          setFollowing(true)
          bufferRef.current = []
          setBufferCount(0)
          displayItemsRef.current = latest
          setDisplayItems(latest)
        }
        return
      }

      if (followingRef.current) {
        followingRef.current = false
        setFollowing(false)
        displayItemsRef.current = latest
        setDisplayItems(latest)
      }
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  return {
    displayItems,
    bufferCount,
    following,
    jumpToLatest,
  }
}
