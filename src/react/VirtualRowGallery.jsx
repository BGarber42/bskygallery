import { useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  GALLERY_COLUMN_GAP_PX,
  GALLERY_ROW_GAP_PX,
  getFeedColumnCount,
} from '../constants.js'
import {
  chunkIntoRows,
  estimateRowHeight,
  getColumnWidth,
  rowKey,
} from './galleryLayout.js'
import { MasonryCard } from './MasonryCard.jsx'
import { NewPostsPill } from './NewPostsPill.jsx'
import { useIncomingRowFeed } from './useIncomingRowFeed.js'

export function VirtualRowGallery({ items }) {
  const scrollRef = useRef(null)
  const [width, setWidth] = useState(0)

  const columnCount = useMemo(() => getFeedColumnCount(width), [width])

  const { incomingRow, mainItems, bufferCount, jumpToLatest, onIncomingThumbLoad } =
    useIncomingRowFeed(items, scrollRef, columnCount)

  const columnWidth = useMemo(
    () => getColumnWidth(width, columnCount, GALLERY_COLUMN_GAP_PX),
    [width, columnCount]
  )

  const rows = useMemo(
    () => chunkIntoRows(mainItems, columnCount),
    [mainItems, columnCount]
  )

  useEffect(() => {
    const el = scrollRef.current
    if (!el) {
      return
    }
    const measure = () => setWidth(el.clientWidth)
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    measure()
    return () => ro.disconnect()
  }, [])

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) =>
      estimateRowHeight(rows[index], columnWidth, GALLERY_ROW_GAP_PX),
    overscan: 6,
    getItemKey: (index) => rowKey(rows[index]),
    measureElement: (el) => el.getBoundingClientRect().height,
  })

  const gridStyle = useMemo(
    () => ({
      display: 'grid',
      gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
      gap: `${GALLERY_ROW_GAP_PX}px ${GALLERY_COLUMN_GAP_PX}px`,
    }),
    [columnCount]
  )

  return (
    <div ref={scrollRef} className="gallery-scroll">
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
      <div
        className="feed-virtual-spacer"
        style={{
          height: rowVirtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index]
          return (
            <div
              key={rowKey(row)}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className="feed-row-virtual"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="feed-row" style={gridStyle}>
                {row.map((post) => (
                  <MasonryCard
                    key={post.id}
                    data={post}
                    width={columnWidth}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <NewPostsPill count={bufferCount} onClick={jumpToLatest} />
    </div>
  )
}
