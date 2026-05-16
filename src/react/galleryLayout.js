import { GALLERY_ROW_GAP_PX } from '../constants.js'

export function pickAspectRatio(post) {
  const first = post.images?.[0]
  const ar = first?.aspectRatio
  if (ar?.width && ar?.height) {
    return ar.width / ar.height
  }
  return 1
}

export function estimateCellHeight(post, columnWidth) {
  const imageCount = post.images?.length ?? 1
  if (imageCount === 1) {
    const ratio = pickAspectRatio(post)
    return columnWidth / ratio
  }
  if (imageCount === 2) {
    const half = columnWidth / 2
    const r0 = post.images[0]?.aspectRatio
    const r1 = post.images[1]?.aspectRatio
    const h0 = r0?.width && r0?.height ? half / (r0.width / r0.height) : half
    const h1 = r1?.width && r1?.height ? half / (r1.width / r1.height) : half
    return Math.max(h0, h1)
  }
  if (imageCount === 3) {
    return Math.max(250, columnWidth * 0.75)
  }
  return columnWidth
}

export function chunkIntoRows(items, columnCount) {
  if (columnCount < 1 || items.length === 0) {
    return []
  }
  const rows = []
  for (let i = 0; i < items.length; i += columnCount) {
    rows.push(items.slice(i, i + columnCount))
  }
  return rows
}

export function estimateRowHeight(row, columnWidth, rowGap = GALLERY_ROW_GAP_PX) {
  if (!row.length) {
    return rowGap
  }
  let maxH = 0
  for (const post of row) {
    maxH = Math.max(maxH, estimateCellHeight(post, columnWidth))
  }
  return maxH + rowGap
}

export function prependRow(mainItems, row) {
  if (!row.length) {
    return mainItems
  }
  return [...row, ...mainItems]
}

export function rowKey(row) {
  return row.map((post) => post.id).join('-')
}

export function getColumnWidth(containerWidth, columnCount, columnGap) {
  if (columnCount < 1 || containerWidth <= 0) {
    return 0
  }
  return (containerWidth - (columnCount - 1) * columnGap) / columnCount
}
