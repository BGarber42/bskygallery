import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMasonry, usePositioner, useResizeObserver } from 'masonic'
import {
  GALLERY_COLUMN_COUNT,
  GALLERY_COLUMN_GAP_PX,
  GALLERY_ROW_GAP_PX,
} from '../constants.js'
import { getColumnWidth } from './galleryLayout.js'
import { MasonryCard } from './MasonryCard.jsx'
import { NewPostsPill } from './NewPostsPill.jsx'
import { useIncomingRowFeed } from './useIncomingRowFeed.js'

export function MasonryGallery({ items }) {
  const scrollRef = useRef(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [height, setHeight] = useState(0)
  const [width, setWidth] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollIdleTimerRef = useRef(null)

  const { incomingRow, mainItems, bufferCount, jumpToLatest, onIncomingThumbLoad } =
    useIncomingRowFeed(items, scrollRef, GALLERY_COLUMN_COUNT)

  const columnWidth = useMemo(
    () => getColumnWidth(width, GALLERY_COLUMN_COUNT, GALLERY_COLUMN_GAP_PX),
    [width]
  )

  const gridStyle = useMemo(
    () => ({
      display: 'grid',
      gridTemplateColumns: `repeat(${GALLERY_COLUMN_COUNT}, 1fr)`,
      gap: `${GALLERY_ROW_GAP_PX}px ${GALLERY_COLUMN_GAP_PX}px`,
    }),
    []
  )

  useEffect(() => {
    const el = scrollRef.current
    if (!el) {
      return
    }
    const measure = () => {
      setHeight(el.clientHeight)
      setWidth(el.clientWidth)
    }
    const onScroll = () => {
      setScrollTop(el.scrollTop)
      setIsScrolling(true)
      if (scrollIdleTimerRef.current) {
        clearTimeout(scrollIdleTimerRef.current)
      }
      scrollIdleTimerRef.current = setTimeout(() => {
        setIsScrolling(false)
      }, 120)
    }
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    el.addEventListener('scroll', onScroll, { passive: true })
    measure()
    setScrollTop(el.scrollTop)
    return () => {
      ro.disconnect()
      el.removeEventListener('scroll', onScroll)
      if (scrollIdleTimerRef.current) {
        clearTimeout(scrollIdleTimerRef.current)
      }
    }
  }, [])

  const positioner = usePositioner(
    {
      width: Math.max(0, width),
      columnCount: GALLERY_COLUMN_COUNT,
      columnGutter: GALLERY_COLUMN_GAP_PX,
      rowGutter: GALLERY_ROW_GAP_PX,
    },
    [width, mainItems.length]
  )

  const resizeObserver = useResizeObserver(positioner)

  const itemHeightEstimate = useMemo(() => {
    if (width <= 0) {
      return 280
    }
    const col =
      (width - (GALLERY_COLUMN_COUNT - 1) * GALLERY_COLUMN_GAP_PX) /
      GALLERY_COLUMN_COUNT
    return Math.max(200, col * 1.15)
  }, [width])

  const itemKey = useCallback((data) => data.id, [])

  const grid = useMasonry({
    positioner,
    resizeObserver,
    items: mainItems,
    height,
    scrollTop,
    isScrolling,
    overscanBy: 2,
    render: MasonryCard,
    itemKey,
    itemHeightEstimate,
    role: 'grid',
    className: 'masonry-grid-root',
  })

  return (
    <div className="gallery-scroll" ref={scrollRef}>
      {incomingRow.length > 0 ? (
        <div className="incoming-row" style={gridStyle}>
          {incomingRow.map((post) => (
            <MasonryCard
              key={post.id}
              data={post}
              width={columnWidth}
              priorityLoad
              onThumbLoad={onIncomingThumbLoad}
            />
          ))}
        </div>
      ) : null}
      {grid}
      <NewPostsPill count={bufferCount} onClick={jumpToLatest} />
    </div>
  )
}
